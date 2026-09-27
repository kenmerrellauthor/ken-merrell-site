# Ken Merrell Author Website — Client Requirements & Content Onboarding

This document outlines everything needed from the client (**Ken Merrell**) to connect the live services, load all real books and media, and launch the website on his custom domain.

---

## 1. Third-Party Service Credentials & Accounts

The website relies on four secure external services (all free-tier eligible). The client or developer can provide credentials for each:

### A. Domain & DNS Access
- **Ken's Custom Domain**: (e.g. `kenmerrell.com` or `www.kenmerrell.com`)
- **DNS Access or Coordination**: Ability to add DNS records (A/CNAME records for Vercel, and TXT/MX records for email verification).

### B. Supabase (Database & Media Storage)
- **Supabase Account**: Free project created at [supabase.com](https://supabase.com/).
- **Project URL**: (e.g. `https://<project-ref>.supabase.co`)
- **Service Role Secret Key**: Found under **Project Settings > API / Data API > Service Role Secret** (`sb_secret_...` or JWT). *Used only on the server to save books, sample chapters, uploaded covers, and reader signups.*
- **Database Setup**: Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor once.

### C. Resend (Email Delivery for Forms)
- **Resend Account**: Free account at [resend.com](https://resend.com/).
- **API Key**: (`re_...` with sending access).
- **Verified Sender Domain**: (e.g. `Ken Merrell <contact@kenmerrell.com>`).
- **Ken's Notification Email**: The private email address where contact messages and advance reader signups should be forwarded. *(Ken's real email address is kept private and never exposed on the public site).*

### D. Cloudflare Turnstile (Spam & Bot Protection)
- **Cloudflare Account**: Free account at [dash.cloudflare.com](https://dash.cloudflare.com/).
- **Turnstile Widget**: Managed widget created for Ken's live domain and `localhost`.
- **Site Key**: Public key (`0x4AAAAAA...`).
- **Secret Key**: Private secret key (`0x4AAAAAA...`).

---

## 2. Book Catalogue Content (7 Current Books + 1 Upcoming)

For each of the 7 published/available books and the upcoming title, the following assets and copy are needed:

### For Each of the 7 Published Books:
1. **Title & Tagline**:
   - Exact book title.
   - One-line hook / tagline (e.g., *"They hanged her husband. They did not silence his widow."*).
2. **Cover & Banner Artwork**:
   - High-resolution front cover image (JPG, PNG, or WebP).
   - Optional hero banner artwork for featured carousel titles (wide landscape format).
3. **Book Description**:
   - Official blurb / synopsis (1–3 paragraphs explaining story, stakes, and main character choice).
4. **Metadata**:
   - Genre (e.g. *Historical Fiction, Suspense, Thriller*).
   - Publication Date (Month & Year).
   - Page count (e.g. 384 pages).
   - Formats available (e.g. *Print, Ebook, Audio*).
   - ISBN.
5. **Purchase Links**:
   - Amazon buy link (Paperback/Hardcover/Kindle).
   - Audible audiobook link (if available; toggleable on/off).
6. **Reader / Press Reviews**:
   - 1 to 3 short praise quotes or endorsements with author/source attribution.
7. **Sample Chapter (Interactive Flipbook)**:
   - Word file (`.docx`) or pasted plain text for the first chapter / excerpt to display in the page-turning reader.

### For the "Coming Soon" Title:
1. **Title & Teaser**: Working title and 1–2 paragraph teaser.
2. **Expected Release**: Label (e.g. *"Fall 2026"* or specific date for live countdown clock).
3. **Cover / Teaser Graphic**: Cover reveal art or teaser artwork placeholder.

---

## 3. Author Information & Media

To replace placeholders in the **About**, **Videos**, and **Footer** sections:

1. **Author Headshot / Portrait**: High-resolution photo of Ken Merrell.
2. **Author Biography**: Approved 2–3 paragraph biography for the About section.
3. **Core Quote / Pull Quote**: Signature author quote (default placeholder: *"What will I do when the pressure falls on me?"*).
4. **Homepage Reader Quotes**: 2–4 short, punchy reviews or reader quotes to feature in the homepage carousel.
5. **YouTube Videos**:
   - Links to 2–4 YouTube videos (Book trailers, author interviews, readings, or podcast appearances).
6. **Social / Author Profiles**:
   - Amazon Author Central profile URL.
   - YouTube Channel link.
   - Any optional social media profile links (Facebook, Instagram, X/Twitter, Goodreads).

---

## 4. Admin Access & Management

- **Ken's Preferred Admin Email**: Email address Ken will use to sign in to the `/admin` dashboard.
- **Admin Password**: Secure, strong password for Ken's administrative access.

---

## 5. Client Checklist Summary

| Item | Required From | Status |
|---|---|---|
| Domain Name & DNS Access | Client / Registrar | Pending |
| Supabase Project (URL + Service Key) | Client / Tech Setup | Pending |
| Resend API Key & Verified Domain | Client / Tech Setup | Pending |
| Ken's Notification Email Address | Client | Pending |
| Cloudflare Turnstile Keys | Client / Tech Setup | Pending |
| 7 Book Covers & Metadata | Client | Pending |
| 7 Sample Chapters (.docx or text) | Client | Pending |
| Amazon & Audible Purchase Links | Client | Pending |
| Coming Soon Book Details & Date | Client | Pending |
| Author Headshot Photo | Client | Pending |
| Author Biography & Pull Quotes | Client | Pending |
| YouTube Video Links | Client | Pending |
| Admin Login Password | Client | Pending |
