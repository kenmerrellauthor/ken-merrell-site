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
};

async function ip() {
  const h = await headers();
  return h.get('cf-connecting-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}

async function origin() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
}

export async function submitReader(_prev: FormState, form: FormData): Promise<FormState> {
  const name = sanitizeSingleLine(String(form.get('name') || '')).slice(0, 120);
  const email = sanitizeSingleLine(String(form.get('email') || '')).slice(0, 200);
  const format = form.get('format') === 'Paperback' ? 'Paperback' : 'Ebook';
  const agreed = form.get('agree') === 'on';
  const values = { name, email, format, agree: agreed ? 'on' : '' };

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Please add your name.';
  if (!isEmail(email)) errors.email = 'Enter a full email address, like jane@example.com';
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
    return { ok: true, errors: {}, name: name.split(' ')[0], format };
  }

  const res = await addReader({ id: newId(), name, email, format, agreed, createdAt: new Date().toISOString() });
  if (!res.duplicate) {
    const site = await getSite();
    const toEmail = site.notifyEmail || process.env.ADMIN_EMAIL || 'upcometrends@gmail.com';
    if (!toEmail) return { ok: true, errors: {}, name: name.split(' ')[0], format };

    await sendMail({
      to: toEmail,
      subject: `New advance reader: ${name}`,
      html: readerEmail({ name, email, format: res.reader.format }, `${await origin()}/admin/readers`),
      replyTo: email
    });
  }
  return { ok: true, errors: {}, name: name.split(' ')[0], format };
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
  const toEmail = site.notifyEmail || process.env.ADMIN_EMAIL || 'upcometrends@gmail.com';
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

