# Things To Do — Making Ken Merrell's Website 100% Ready for Live Users & Google

This checklist covers all technical, functional, and content requirements to make the website live, fully operational, and discovered on Google.

---

## 1. Live Links

### Local Development (Active Now)
- **Public Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Admin Login Credentials**:
  - **Email**: `ken@example.com`
  - **Password**: `123` *(configured in `.env.local`)*

### Production (Once Deployed to Vercel)
- **Public Website**: `https://<your-vercel-app-name>.vercel.app` *(or your custom domain)*
- **Admin Dashboard**: `https://<your-vercel-app-name>.vercel.app/admin`

---

## 2. Platform Status (Already Built & Working)

| Feature | Status | Details |
|---|---|---|
| **Add / Edit Books** | Ready | 1-click book creation. Even if you don't enter a title, it defaults to *"Untitled Book"* so nothing blocks you. |
| **Instant Live Toggle** | Ready | 1-click switch between **Available** (live on public site) and **Coming soon**. |
| **Delete Books** | Ready | Dedicated delete button inside each book's edit view. |
| **Book Reordering** | Ready | Up/down arrows in admin immediately change bookshelf order on homepage and library. |
| **Advance Reader CRM** | Ready | Readers sign up on `/advance-readers`; records appear in `/admin/readers`, with 1-click CSV export and 1-click bulk email (BCC). |
| **Reader Reviews** | Ready | Visitors submit reviews on book pages; Admin approves, rejects, or adds public author responses. |
| **Video Management** | Ready | Paste any YouTube link; title and thumbnail auto-populate. |
| **Author & Bio** | Ready | Manage author photo, signature quote, bio, homepage quotes, and notification email. |

---

## 3. Things To Do: Functional & Cloud Setup

To make the site operate in production where serverless disks are read-only and emails must be delivered:

### A. Database & Media Persistence (Supabase)
> **Why it's needed**: When deployed on Vercel, files cannot be saved to the server's local hard drive. Supabase stores books, uploaded book covers, author photos, reviews, and reader signups.

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project.
3. Open the **SQL Editor** in your Supabase dashboard and run the script in [`supabase/schema.sql`](./supabase/schema.sql).
4. Copy the following keys from **Project Settings > API**:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role secret** (`SUPABASE_SERVICE_ROLE_KEY`) *(used only securely on the server)*
   - Bucket name: `media` *(created automatically by `schema.sql`)*

---

### B. Contact & Reader CRM Emails (Resend)
> **Why it's needed**: Automatically sends an email directly to Ken's personal inbox whenever someone submits the contact form or joins the advance reader list.

1. Create a free account at [resend.com](https://resend.com).
2. Generate an API key (`RESEND_API_KEY`).
3. Add and verify your sending domain (or use onboarding address for testing).
4. Set `RESEND_FROM` (e.g. `Ken Merrell <contact@yourdomain.com>`).
5. Open `/admin/about` on the website and set **Where messages and signups are sent** to Ken's personal email address.

---

### C. Invisible Spam & Bot Protection (Cloudflare Turnstile)
> **Why it's needed**: Stops bots from flooding forms and email inboxes without making real visitors solve annoying picture captchas.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) > **Turnstile**.
2. Add a new widget in **Managed** mode for your live domain and `localhost`.
3. Copy:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`

---

### D. Production Deployment (Vercel)
1. Push this repository to GitHub or GitLab.
2. In [vercel.com](https://vercel.com), click **Add New Project** and select this repository.
3. In the **Environment Variables** section, paste:
   ```env
   ADMIN_EMAIL=ken@yourdomain.com
   ADMIN_PASSWORD=choose-a-strong-password-for-ken
   SESSION_SECRET=paste-a-random-64-character-string
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
   SUPABASE_BUCKET=media
   RESEND_API_KEY=re_...
   RESEND_FROM=Ken Merrell <noreply@yourdomain.com>
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4...
   TURNSTILE_SECRET_KEY=0x4...
   NEXT_PUBLIC_SITE_URL=https://your-live-url.com
   ```
4. Click **Deploy**.

---

## 4. Things To Do: Google Search Indexing & Visibility

To make Google index the site and display rich book cards in search results:

1. **Verify in Google Search Console**:
   - Go to [search.google.com/search-console](https://search.google.com/search-console).
   - Add your property URL.
2. **Submit Sitemap**:
   - In Search Console, navigate to **Sitemaps**.
   - Enter `sitemap.xml` and click **Submit**.
   - The sitemap dynamically lists the Homepage, `/books`, `/author`, `/advance-readers`, and every published book URL.
3. **Inspect & Request Indexing**:
   - Paste `https://your-domain.com/` into the URL inspection bar and click **Request Indexing**.
   - Paste `https://your-domain.com/books` and click **Request Indexing**.
4. **Rich Schema Verification**:
   - The site automatically injects Schema.org JSON-LD for books (`@type: Book`, `name`, `author`, `isbn`, `description`).
   - Test any book URL with [Google Rich Results Test](https://search.google.com/test/rich-results).

---

## 5. Things To Do: Real Content Checklist

Once the accounts above are connected, replace the placeholder data via `/admin`:

- [ ] **Book Covers**: Upload real high-resolution covers for the 7 published titles.
- [ ] **Sample Chapters**: Upload `.docx` or paste chapter 1 for the interactive flipbook.
- [ ] **Purchase Links**: Add Amazon and Audible links for each available book.
- [ ] **Upcoming Book**: Set the title, release label (e.g. *Fall 2026*), and date for the countdown clock.
- [ ] **Author Photo & Bio**: Upload Ken's portrait and approve the biography in `/admin/about`.
- [ ] **YouTube Links**: Paste real video URLs into `/admin/videos` (trailers, interviews, readings).
- [ ] **Test Submissions**: Submit one test message on the contact form and one test advance reader signup to verify inbox delivery.
