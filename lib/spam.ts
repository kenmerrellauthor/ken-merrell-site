import 'server-only';

/*
 * Multi-layer spam & bot defense:
 * 1. IP rate limiting (prevents flooding / email bombing)
 * 2. Honeypot field (hidden from visitors, filled by automated crawlers)
 * 3. Time trap (forms submitted in under 1.5s are bots)
 * 4. Cloudflare Turnstile verification (managed CAPTCHA alternative)
 */

const formSubmissions = new Map<string, { count: number; resetAt: number }>();
const MAX_SUBMISSIONS_PER_WINDOW = 8;
const SUBMISSION_WINDOW_MS = 60 * 1000; // 8 submissions per minute per IP

export function checkFormRateLimit(ip: string | null): boolean {
  if (!ip) return true;
  const now = Date.now();
  const record = formSubmissions.get(ip);
  if (!record || record.resetAt <= now) {
    formSubmissions.set(ip, { count: 1, resetAt: now + SUBMISSION_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_SUBMISSIONS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

export async function isSpam(form: FormData, ip?: string | null): Promise<string | null> {
  // Rate limiting check per IP
  if (ip && !checkFormRateLimit(ip)) {
    return 'rate-limited';
  }

  // Honeypot check
  if (String(form.get('website') || '').trim() !== '') {
    return 'honeypot';
  }

  // Time trap check
  const started = Number(form.get('_t') || 0);
  if (started > 0 && Date.now() - started < 1500) {
    return 'too-fast';
  }

  // Cloudflare Turnstile verification
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const token = String(form.get('cf-turnstile-response') || '');
    if (!token) return 'no-turnstile-token';
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
      const json = (await res.json()) as { success: boolean };
      if (!json.success) return 'turnstile-failed';
    } catch {
      return 'turnstile-unreachable';
    }
  }

  return null;
}

/** Standard email validation with length and newline protection */
export function isEmail(s: string): boolean {
  if (!s || s.length > 254 || /[\r\n\t]/.test(s)) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(s);
}

/** Strips all carriage returns, newlines, and tabs to prevent email header injection attacks */
export function sanitizeSingleLine(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

