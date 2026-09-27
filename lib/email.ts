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

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) {
    console.log(`[email not sent: ${!key ? 'RESEND_API_KEY missing' : 'no recipient set in Admin > Author & bio'}]`, opts.subject);
    return false;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'Ken Merrell website <onboarding@resend.dev>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo
  });
  if (error) {
    console.error('Resend error', error);
    return false;
  }
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
