'use server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { addReader, addReview, getBook, getSite, newId } from '@/lib/store';
import { isEmail, isSpam, sanitizeSingleLine } from '@/lib/spam';
import { contactEmail, readerEmail, sendMail } from '@/lib/email';

export type FormState = {
  ok: boolean;
  errors: Record<string, string>;
  message?: string;
  values?: Record<string, string>;
  name?: string;
  format?: string;
  bookTitle?: string;
};

async function ip() {
  const h = await headers();
  return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kenmerrell.com') || `${proto}://${host}`;
}

export async function submitReader(_prev: FormState, form: FormData): Promise<FormState> {
  const name = sanitizeSingleLine(String(form.get('name') || '')).slice(0, 120);
  const email = sanitizeSingleLine(String(form.get('email') || '')).slice(0, 200);
  const bookTitle = sanitizeSingleLine(String(form.get('bookTitle') || '')).slice(0, 200);
  const formats = form.getAll('format').map(String);
  const hasEbook = formats.includes('Ebook');
  const hasPaperback = formats.includes('Paperback');
  let format = 'Ebook';
  if (hasEbook && hasPaperback) {
    format = 'Ebook & Paperback';
  } else if (hasPaperback) {
    format = 'Paperback';
  } else if (hasEbook) {
    format = 'Ebook';
  }
  const agreed = form.get('agree') === 'on';
  const values = { name, email, format, agree: agreed ? 'on' : '', bookTitle };

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Please add your name.';
  if (!isEmail(email)) errors.email = 'Enter a full email address, like jane@example.com';
  if (!hasEbook && !hasPaperback) errors.format = 'Please select at least one format (Ebook, Paperback, or both).';
  if (!agreed) errors.agree = 'Please agree to post an honest review within two weeks of launch.';
  if (Object.keys(errors).length) {
    const count = Object.keys(errors).length;
    return {
      ok: false,
      errors,
      values,
      message: count === 1 ? 'One thing needs a look before you can join.' : `${count === 2 ? 'Two' : 'A few'} things need a look before you can join.`
    };
  }

  const spam = await isSpam(form, await ip());
  if (spam) {
    // Return harmless success for bots to prevent them probing filters
    return { ok: true, errors: {}, name: name.split(' ')[0], format, bookTitle };
  }

  const { SignJWT } = await import('jose');
  const secret = process.env.SESSION_SECRET || 'dev-only-secret-change-me-please-min-32-chars';
  const token = await new SignJWT({ name, email, format, agreed, bookTitle })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret));

  const link = `${await origin()}/verify-reader?token=${token}`;
  
  await sendMail({
    to: email,
    subject: bookTitle ? `Confirm your advance reader subscription for ${bookTitle}` : `Confirm your advance reader subscription`,
    html: (await import('@/lib/email')).verifyReaderEmail(link, bookTitle),
  });

  // Identity Bridging: Link anonymous ad click session to real reader contact
  const sessionId = sanitizeSingleLine(String(form.get('sessionId') || '')).slice(0, 50);
  if (sessionId) {
    try {
      const { bridgeReaderIdentity } = await import('@/lib/analytics');
      await bridgeReaderIdentity(sessionId, { name, email, format, bookTitle });
    } catch {
      /* ignore */
    }
  }

  return { ok: true, errors: {}, name: name.split(' ')[0], format, bookTitle, message: 'verify' };
}

export async function submitContact(_prev: FormState, form: FormData): Promise<FormState> {
  const name = sanitizeSingleLine(String(form.get('name') || '')).slice(0, 120);
  const email = sanitizeSingleLine(String(form.get('email') || '')).slice(0, 200);
  const message = String(form.get('message') || '').trim().slice(0, 5000);
  const values = { name, email, message };
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Please add your name.';
  if (!isEmail(email)) errors.email = 'Enter a full email address, like sam@example.com';
  if (message.length < 2) errors.message = 'Please write a short message.';
  if (Object.keys(errors).length) return { ok: false, errors, values };

  const spam = await isSpam(form, await ip());
  if (spam) {
    return { ok: true, errors: {}, name: name.split(' ')[0], values: { email } };
  }
  const site = await getSite();
  const toEmail = site.notifyEmail || process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'upcometrends@gmail.com';
  if (!toEmail) return { ok: true, errors: {}, name: name.split(' ')[0], values: { email } };

  const sent = await sendMail({
    to: toEmail,
    subject: `New message from ${name}`,
    html: contactEmail({ name, email, message }),
    replyTo: email
  });
  if (!sent && process.env.RESEND_API_KEY) {
    return { ok: false, errors: {}, values, message: 'Sorry, the message could not be sent just now. Please try again in a minute.' };
  }
  return { ok: true, errors: {}, name: name.split(' ')[0], values: { email } };
}

export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  const bookId = sanitizeSingleLine(String(form.get('bookId') || '')).slice(0, 64);
  const name = sanitizeSingleLine(String(form.get('name') || '')).slice(0, 120);
  const rating = Math.min(5, Math.max(1, Math.floor(Number(form.get('rating')) || 5)));
  const text = String(form.get('text') || '').trim().slice(0, 2000);
  const values = { name, rating: String(rating), text };
  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Please add your name.';
  if (text.length < 10) errors.text = 'Please write a bit more (at least 10 characters).';
  if (!bookId) return { ok: false, errors: {}, message: 'Invalid form submission.' };

  const book = await getBook(bookId);
  if (!book) return { ok: false, errors: {}, message: 'Book not found.' };

  if (Object.keys(errors).length) return { ok: false, errors, values };

  const spam = await isSpam(form, await ip());
  if (spam) return { ok: true, errors: {}, name: name.split(' ')[0] };

  await addReview(bookId, {
    id: newId(),
    name,
    rating,
    text,
    createdAt: new Date().toISOString(),
    approved: false,
  });
  revalidatePath('/books', 'layout');
  return { ok: true, errors: {}, name: name.split(' ')[0] };
}

