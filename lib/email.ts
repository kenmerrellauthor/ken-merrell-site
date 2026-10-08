import 'server-only';
import { Resend } from 'resend';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function shell(title: string, rows: [string, string][], body: string, footer: string) {
  const r = rows
    .map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(239,231,214,0.08);color:#8f8573;width:125px;font-size:13px;letter-spacing:.04em">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid rgba(239,231,214,0.08);color:#efe7d6;font-size:14px">${esc(v)}</td></tr>`)
    .join('');
  return `<div style="font-family:Georgia,serif;background:#12100d;padding:28px 16px">
<div style="max-width:580px;margin:0 auto;background:#1a1612;border:1px solid rgba(201,168,96,0.25);border-radius:6px;padding:32px 30px;box-shadow:0 12px 36px rgba(0,0,0,0.4)">
<div style="font-family:Georgia,serif;font-size:20px;letter-spacing:.14em;color:#c9a860;font-weight:700">KEN MERRELL</div>
<div style="font-size:11px;letter-spacing:.16em;color:#8f8573;text-transform:uppercase;margin-top:2px">Author &amp; Novelist</div>
<h1 style="font-size:22px;font-weight:600;color:#ffffff;margin:22px 0 14px;line-height:1.35">${esc(title)}</h1>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:18px">${r}</table>
<div style="color:#efe7d6;font-size:15px;line-height:1.7">${body}</div>
<p style="font-size:12px;color:#8f8573;margin-top:28px;border-top:1px solid rgba(239,231,214,0.08);padding-top:16px">${esc(footer)}</p>
</div></div>`;
}

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string; attachments?: { filename: string; content: Buffer }[] }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) {
    console.log(`[email not sent: ${!key ? 'RESEND_API_KEY missing' : 'no recipient set in Admin > Author & bio'}]`, opts.subject);
    return false;
  }
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM || 'Ken Merrell website <onboarding@resend.dev>';
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });
  if (error) {
    console.error('[Resend Error]:', error);
    // If Resend trial restricts delivery to account owner email (403 validation_error),
    // automatically deliver to the verified Resend account email so no message is ever lost.
    if (opts.to !== 'inquirefromyasir@gmail.com' && (error.name === 'validation_error' || String(error.message).includes('testing emails'))) {
      console.log(`[Resend Fallback]: ${opts.to} is not yet verified in Resend. Delivering to verified account inquirefromyasir@gmail.com...`);
      const fallback = await resend.emails.send({
        from,
        to: 'inquirefromyasir@gmail.com',
        subject: `[Intended for: ${opts.to}] ${opts.subject}`,
        html: `<div style="background:#221a0f;border:1px solid #c9a860;padding:14px 18px;border-radius:4px;margin-bottom:20px;font-family:sans-serif;font-size:13px;color:#f3d79b;line-height:1.5">
          <strong>Notice:</strong> This message was sent from your website and intended for <code>${esc(opts.to)}</code>. Because your Resend domain is not yet verified, Resend delivered it to your verified account email (<code>inquirefromyasir@gmail.com</code>). Once you verify your domain in <a href="https://resend.com/domains" style="color:#c9a860;font-weight:600">resend.com/domains</a>, messages will deliver directly to <code>${esc(opts.to)}</code>.
        </div>` + opts.html,
        replyTo: opts.replyTo,
        attachments: opts.attachments,
      });
      if (!fallback.error) {
        console.log('[Resend Fallback Success]: sent email id:', fallback.data?.id, 'to inquirefromyasir@gmail.com');
        return true;
      }
    }
    return false;
  }
  console.log('[Resend Success]: sent email id:', data?.id, 'to:', opts.to);
  return true;
}

export function readerEmail(r: { name: string; email: string; format: string; bookTitle?: string }, adminUrl: string) {
  const rows: [string, string][] = [
    ['Name', r.name],
    ['Email', r.email],
    ['Book Wishlist', r.bookTitle || 'General advance list'],
    ['Format', r.format],
    ['Review', 'Agreed to review']
  ];
  return shell(
    `New advance reader: ${r.name}${r.bookTitle ? ` (${r.bookTitle})` : ''}`,
    rows,
    `<p style="margin-top:22px"><a href="${esc(adminUrl)}" style="display:inline-block;background:#c9a860;color:#12100d;padding:12px 22px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.08em;border-radius:3px">SEE ALL READERS IN ADMIN &rarr;</a></p>`,
    'Passed spam check. Also saved to your reader list in CRM.'
  );
}

export function contactEmail(m: { name: string; email: string; message: string }) {
  return shell(
    `New message from ${m.name}`,
    [['Name', m.name], ['Email', m.email], ['Sent from', 'Contact form']],
    `<div style="font-size:15px;line-height:1.7;color:#efe7d6;white-space:pre-wrap;margin-top:14px;background:#15120f;padding:16px 18px;border-left:3px solid #c9a860;border-radius:3px">${esc(m.message)}</div><p style="font-size:13px;color:#8f8573;margin-top:18px">Hit reply to answer ${esc(m.name)} directly.</p>`,
    'Passed spam check. Bots are blocked before they reach you.'
  );
}

export function verifyReaderEmail(link: string, bookTitle?: string) {
  return `<div style="font-family:Georgia,serif;background:#12100d;padding:28px 16px">
<div style="max-width:580px;margin:0 auto;background:#1a1612;border:1px solid rgba(201,168,96,0.25);border-radius:6px;padding:32px 30px;box-shadow:0 12px 36px rgba(0,0,0,0.4)">
<div style="font-family:Georgia,serif;font-size:20px;letter-spacing:.14em;color:#c9a860;font-weight:700">KEN MERRELL</div>
<div style="font-size:11px;letter-spacing:.16em;color:#8f8573;text-transform:uppercase;margin-top:2px">Author &amp; Novelist</div>
<h1 style="font-size:22px;font-weight:600;color:#ffffff;margin:22px 0 10px;line-height:1.35">Confirm your advance reader &amp; wishlist subscription</h1>
<p style="font-size:15px;line-height:1.7;color:#efe7d6">Click the button below to confirm your email address and join Ken's advance reader wishlist${bookTitle ? ` for <strong style="color:#ffffff">${esc(bookTitle)}</strong>` : ''}.</p>
<p style="margin-top:24px"><a href="${esc(link)}" style="display:inline-block;background:#c9a860;color:#12100d;padding:13px 26px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.08em;border-radius:3px">CONFIRM MY EMAIL &rarr;</a></p>
<p style="font-size:12px;color:#8f8573;margin-top:28px;border-top:1px solid rgba(239,231,214,0.08);padding-top:16px">If you didn't request this, you can safely ignore this email.</p>
</div></div>`;
}

export function welcomeReaderEmail(r: { name: string; bookTitle?: string; booksUrl?: string }) {
  return `<div style="font-family:Georgia,serif;background:#12100d;padding:28px 16px">
<div style="max-width:580px;margin:0 auto;background:#1a1612;border:1px solid rgba(201,168,96,0.25);border-radius:6px;padding:32px 30px;box-shadow:0 12px 36px rgba(0,0,0,0.4)">
<div style="font-family:Georgia,serif;font-size:20px;letter-spacing:.14em;color:#c9a860;font-weight:700">KEN MERRELL</div>
<div style="font-size:11px;letter-spacing:.16em;color:#8f8573;text-transform:uppercase;margin-top:2px">Author &amp; Novelist</div>
<h1 style="font-size:22px;font-weight:600;color:#ffffff;margin:22px 0 10px;line-height:1.35">You're on the Wishlist!</h1>
<p style="font-size:15px;line-height:1.7;color:#efe7d6">Thank you, <strong style="color:#ffffff">${esc(r.name)}</strong>! Your email has been verified and you've successfully joined Ken Merrell's advance reader wishlist${r.bookTitle ? ` for <strong style="color:#ffffff">${esc(r.bookTitle)}</strong>` : ''}.</p>
<p style="font-size:15px;line-height:1.7;color:#efe7d6">As an advance reader, you'll be among the very first to receive preview chapters, manuscript updates, and exclusive announcements before anyone else.</p>
${r.booksUrl ? `<p style="margin-top:24px"><a href="${esc(r.booksUrl)}" style="display:inline-block;background:#c9a860;color:#12100d;padding:13px 26px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.08em;border-radius:3px">EXPLORE BOOKS &rarr;</a></p>` : ''}
<p style="font-size:12px;color:#8f8573;margin-top:28px;border-top:1px solid rgba(239,231,214,0.08);padding-top:16px">Thank you for supporting independent fiction. You can reply directly to this email at any time.</p>
</div></div>`;
}
