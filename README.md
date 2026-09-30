# Ken Merrell · Author Website

Next.js 15 site built from the approved Viloro Tech design (homepage, library, book pages, admin panel, forms).

## What is included

**Public site (Milestone 1)**
- Homepage with 6 sections: featured book banner carousel (3D books, swipe, autoplay), swipeable quote band, All Books bookcase (+ "Browse all books"), Coming Soon with live countdown, Videos (YouTube plays in place), Advance Readers signup, About and Contact.
- `/books` library: walnut bookcase, 6 shelves of 6 per page, Next/Previous shelf paging.
- `/books/[slug]` book pages: 3D cover, tagline, description, details, up to 3 quotes, Amazon + Audible buttons, sample chapter as an open book with page-flip (swipe, arrows or corner), single-page reader on phones, "More by Ken" shelf.
- Responsive for phone, tablet and desktop. SEO: per-book titles/descriptions, Open Graph, Book schema, sitemap.xml, robots.txt. Fonts are self-hosted.

**Admin, forms and launch (Milestone 2)**
- `/admin` private login (email + password from env vars, signed session cookie, 5-try lockout, Turnstile when configured).
- Books: add, edit, remove, reorder, switch between Available and Coming soon, feature in banner, NEW ribbon, cover/banner upload, sample chapter paste or Word (.docx) upload, Amazon link, Audible on/off + link, details, quotes.
- Videos: paste a YouTube link (title fills in), type, length, reorder, remove.
- Author & bio: photo, pull quote, bio, homepage quotes, Amazon author page, YouTube channel, and the email where messages and signups are sent.
- Advance readers: list, filter, CSV export, email all (BCC), remove.
- Forms: Cloudflare Turnstile (invisible) + honeypot + time trap. Contact messages and new signups are emailed via Resend; signups are also saved to the admin list. Ken's email address never appears on the site.

## Run locally

```bash
npm install
cp .env.example .env.local   # copy environment config; sets dev credentials in .env.local
npm run dev
```
In local development with `.env.local`: admin login credentials are set via `ADMIN_EMAIL` and `ADMIN_PASSWORD`, data is stored in `/data/*.json` (created on first run from `lib/seed.ts`), uploads go to `/data/uploads`, and emails are logged to the console instead of sent when Resend is unconfigured.


## Launch checklist (Vercel + Supabase + Resend + Turnstile)

1. **Supabase** (free): create a project, open SQL editor, run `supabase/schema.sql` (tables + public `media` bucket). Copy the project URL and the `service_role` key (Settings > API). The key is only used on the server.
2. **Resend** (free): add and verify Ken's domain, create an API key. `RESEND_FROM` must use that domain.
3. **Cloudflare Turnstile** (free): add a widget for the domain, mode "Managed". Copy the site key and secret.
4. **Vercel**: import the repo, add every variable from `.env.example`:
   `ADMIN_EMAIL`, `ADMIN_PASSWORD` (long), `SESSION_SECRET` (64 random chars, e.g. `openssl rand -hex 32`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=media`, `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
   Supabase is required on Vercel because its disk is read-only.
5. Deploy, then connect Ken's domain in Vercel (Settings > Domains) and update his DNS.
6. Sign in at `/admin`, open **Author & bio** and set **Where messages and signups are sent**. The first visit seeds the database with the 7 books.
7. Replace the placeholders (every `[...]` text): real titles, covers, descriptions, sample chapters, Amazon/Audible links, author photo, videos, upcoming book. Test both forms once live.

## Where things live

| Area | Files |
|---|---|
| Pages | `app/page.tsx`, `app/books/page.tsx`, `app/books/[slug]/page.tsx` |
| Design styles | `app/globals.css` (tokens + every section, breakpoints at 1280 / 1100 / 760) |
| Carousel, bookcase, flip book, forms | `components/*` |
| Admin | `app/admin/*`, `components/admin/*`, `app/admin/admin.css` |
| Data layer (Supabase or local JSON) | `lib/store.ts`, types in `lib/types.ts`, starting content in `lib/seed.ts` |
| Spam protection, email, auth | `lib/spam.ts`, `lib/email.ts`, `lib/auth.ts`, `middleware.ts` |

**Banner titles:** in the admin, "Banner title" uses `*word*` for the gold italic words and `|` for a line break, e.g. `Petticoats *and a*|Traitor’s Death`.
