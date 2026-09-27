import 'server-only';

/*
 * Three layers, all invisible to real visitors:
 * 1. Cloudflare Turnstile (when keys are set) - no puzzles, runs in the background.
 * 2. Honeypot field that people never see but bots fill in.
 * 3. Time trap: a form submitted less than 3 seconds after it loaded is a bot.
 */
export async function isSpam(form: FormData, ip?: string | null): Promise<string | null> {
  if (String(form.get('website') || '').trim() !== '') return 'honeypot';
  const started = Number(form.get('_t') || 0);
  if (!started || Date.now() - started < 3000) return 'too-fast';

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

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
