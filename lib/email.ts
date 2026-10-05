import 'server-only';
import { Resend } from 'resend';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function shell(title: string, rows: [string, string][], body: string, footer: string) {
  const r = rows
    .map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #ece6da;color:#8a8173;width:110px">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #ece6da;color:#1b1814">${esc(v)}</td></tr>`)
    .join('');
  return `<div style="font-family:Georgia,serif;background:#f3f0ea;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:28px 30px">
<div style="font-family:Georgia,serif;font-size:20px;letter-spacing:.12em;color:#1b1814">KEN MERRELL</div>
<h1 style="font-size:22px;font-weight:600;color:#1b1814;margin:18px 0 8px">${esc(title)}</h1>
<table style="width:100%;border-collapse:collapse;font-size:15px">${r}</table>
${body}
<p style="font-size:12px;color:#8a8173;margin-top:28px">${esc(footer)}</p>
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
        html: `<div style="background:#fffbeb;border:1px solid #f59e0b;padding:14px 18px;border-radius:4px;margin-bottom:20px;font-family:sans-serif;font-size:13px;color:#92400e;line-height:1.5">
          <strong>Notice:</strong> This message was sent from your website and intended for <code>${esc(opts.to)}</code>. Because your Resend domain is not yet verified, Resend delivered it to your verified account email (<code>inquirefromyasir@gmail.com</code>). Once you verify your domain in <a href="https://resend.com/domains" style="color:#b45309;font-weight:600">resend.com/domains</a>, messages will deliver directly to <code>${esc(opts.to)}</code>.
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

export function readerEmail(r: { name: string; email: string; format: string }, adminUrl: string) {
  return shell(
    `New advance reader: ${r.name}`,
    [['Name', r.name], ['Email', r.email], ['Format', r.format], ['Review', 'Agreed to review']],
    `<p style="margin-top:22px"><a href="${esc(adminUrl)}" style="background:#1b1814;color:#efe7d6;padding:12px 18px;text-decoration:none;font-size:13px">See all readers in your admin</a></p>`,
    'Passed spam check. Also saved to your reader list.'
  );
}

export function contactEmail(m: { name: string; email: string; message: string }) {
  return shell(
    `New message from ${m.name}`,
    [['Name', m.name], ['Email', m.email], ['Sent from', 'Contact form']],
    `<p style="font-size:16px;line-height:1.6;color:#1b1814;white-space:pre-wrap;margin-top:18px">${esc(m.message)}</p><p style="font-size:13px;color:#8a8173">Hit reply to answer ${esc(m.name)} directly.</p>`,
    'Passed spam check. Bots are blocked before they reach you.'
  );
}

export function verifyReaderEmail(link: string) {
  return `<div style="font-family:Georgia,serif;background:#161310;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#1a1612;padding:28px 30px;border:1px solid rgba(239,231,214,.08);border-radius:4px">
<div style="font-family:Georgia,serif;font-size:20px;letter-spacing:.12em;color:#c9a860">KEN MERRELL</div>
<h1 style="font-size:22px;font-weight:600;color:#fff;margin:18px 0 8px">Confirm your advance reader subscription</h1>
<p style="font-size:16px;line-height:1.6;color:#efe7d6">Click the button below to confirm your email address and join Ken's advance reader list.</p>
<p style="margin-top:22px"><a href="${esc(link)}" style="display:inline-block;background:#c9a860;color:#15120f;padding:12px 18px;text-decoration:none;font-size:13px;font-weight:600;border-radius:2px">Confirm my email</a></p>
<p style="font-size:12px;color:#8f8573;margin-top:28px">If you didn't request this, you can safely ignore this email.</p>
</div></div>`;
}
