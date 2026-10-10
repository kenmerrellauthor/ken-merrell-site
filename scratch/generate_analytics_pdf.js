const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(process.cwd(), 'Ken_Merrell_Ad_Tracking_and_Analytics_Guide.pdf');

const doc = new PDFDocument({
  size: 'A4', // 595.28 x 841.89 pt
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  autoFirstPage: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Brand Colors
const NAVY = '#1E293B';
const DARK = '#0F172A';
const GOLD = '#B8860B';
const GOLD_LIGHT = '#FDF6E2';
const TEXT_MUTED = '#64748B';
const BODY_TEXT = '#334155';
const BORDER = '#CBD5E1';
const LIGHT_BG = '#F8FAFC';
const BLUE = '#1D4ED8';
const GREEN = '#15803D';

const PAGE_WIDTH = doc.page.width;
const CONTENT_WIDTH = PAGE_WIDTH - 100; // 495.28 pt

function checkPageSpace(doc, neededHeight) {
  if (doc.y + neededHeight > doc.page.height - 55) {
    doc.addPage();
    drawPageHeader(doc);
  }
}

function drawPageHeader(doc) {
  doc.save();
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica-Bold')
     .text('KEN MERRELL AUTHOR PLATFORM', 50, 22, { characterSpacing: 1, lineBreak: false });
  doc.fontSize(8).fillColor(GOLD).font('Helvetica')
     .text('AD TRACKING, ANALYTICS & ATTRIBUTION GUIDE', 50, 22, { align: 'right', width: CONTENT_WIDTH, lineBreak: false });
  doc.strokeColor(BORDER).lineWidth(0.5).moveTo(50, 34).lineTo(50 + CONTENT_WIDTH, 34).stroke();
  doc.restore();
  doc.page.margins.bottom = oldBottom;
  doc.y = 48;
}

function drawSectionHeading(doc, title, subtitle) {
  checkPageSpace(doc, 45);
  doc.moveDown(0.7);
  doc.fontSize(13).fillColor(NAVY).font('Helvetica-Bold').text(title);
  if (subtitle) {
    doc.fontSize(8.5).fillColor(GOLD).font('Helvetica-Bold').text(subtitle.toUpperCase(), { characterSpacing: 0.8 });
  }
  doc.moveDown(0.2);
  doc.strokeColor(GOLD).lineWidth(1.5).moveTo(50, doc.y).lineTo(50 + 55, doc.y).stroke();
  doc.moveDown(0.5);
}

function drawSubheading(doc, title) {
  checkPageSpace(doc, 25);
  doc.moveDown(0.4);
  doc.fontSize(10.5).fillColor(DARK).font('Helvetica-Bold').text(title);
  doc.moveDown(0.2);
}

function drawParagraph(doc, text, options = {}) {
  const height = doc.heightOfString(text, { width: CONTENT_WIDTH, lineGap: 2.5, ...options });
  checkPageSpace(doc, height + 8);
  doc.fontSize(9).fillColor(BODY_TEXT).font(options.font || 'Helvetica')
     .text(text, { width: CONTENT_WIDTH, lineGap: 2.5, ...options });
  doc.moveDown(0.35);
}

function drawCalloutBox(doc, title, bodyLines, accentColor = GOLD, bgColor = LIGHT_BG) {
  const lineHeights = bodyLines.reduce((acc, l) => acc + doc.heightOfString(l, { width: CONTENT_WIDTH - 28, lineGap: 2 }) + 3, 0);
  const totalHeight = lineHeights + (title ? 24 : 14);
  checkPageSpace(doc, totalHeight + 10);

  const startY = doc.y;
  doc.save();
  doc.roundedRect(50, startY, CONTENT_WIDTH, totalHeight, 3).fillAndStroke(bgColor, BORDER);
  doc.rect(50, startY, 4, totalHeight).fill(accentColor);
  doc.restore();

  let textY = startY + 8;
  if (title) {
    doc.fontSize(9.5).fillColor(DARK).font('Helvetica-Bold')
       .text(title, 64, textY, { width: CONTENT_WIDTH - 28 });
    textY += 15;
  }

  bodyLines.forEach(line => {
    doc.fontSize(8.5).fillColor(BODY_TEXT).font('Helvetica')
       .text(line, 64, textY, { width: CONTENT_WIDTH - 28, lineGap: 2 });
    textY += doc.heightOfString(line, { width: CONTENT_WIDTH - 28, lineGap: 2 }) + 3;
  });

  doc.y = startY + totalHeight + 10;
}

function drawTable(doc, headers, rows, colWidths) {
  const rowHeight = 20;
  const tableHeight = (rows.length + 1) * rowHeight + 8;
  checkPageSpace(doc, tableHeight);

  const startX = 50;
  let currentY = doc.y;

  // Header row
  doc.save();
  doc.rect(startX, currentY, CONTENT_WIDTH, rowHeight).fill(NAVY);
  doc.restore();

  let colX = startX;
  headers.forEach((h, i) => {
    doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold')
       .text(h, colX + 5, currentY + 5, { width: colWidths[i] - 10, align: i >= 2 ? 'right' : 'left' });
    colX += colWidths[i];
  });

  currentY += rowHeight;

  // Data rows
  rows.forEach((row, rowIndex) => {
    const isAlt = rowIndex % 2 === 1;
    if (isAlt) {
      doc.save();
      doc.rect(startX, currentY, CONTENT_WIDTH, rowHeight).fill('#F8FAFC');
      doc.restore();
    }
    doc.save();
    doc.strokeColor(BORDER).lineWidth(0.5).moveTo(startX, currentY + rowHeight).lineTo(startX + CONTENT_WIDTH, currentY + rowHeight).stroke();
    doc.restore();

    let cellX = startX;
    row.forEach((cell, cellIndex) => {
      const isBold = cellIndex === 0;
      let fontColor = BODY_TEXT;
      if (cell.includes('[CLICKED') || cell.includes('21.7%') || cell.includes('33.7%') || cell.includes('47.1%') || cell.includes('63.8%')) fontColor = GREEN;
      if (cell.includes('#USR-') || cell.includes('Paid Ad')) fontColor = BLUE;
      if (cell.includes('[ARC') || cell.includes('Organic')) fontColor = GOLD;

      doc.fontSize(8).fillColor(fontColor).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
         .text(cell, cellX + 5, currentY + 5, { width: colWidths[cellIndex] - 10, align: cellIndex >= 2 && !cell.startsWith('[') ? 'right' : 'left' });
      cellX += colWidths[cellIndex];
    });

    currentY += rowHeight;
  });

  doc.y = currentY + 8;
}

// ==========================================
// COVER / HEADER BANNER
// ==========================================
doc.save();
doc.rect(50, 45, CONTENT_WIDTH, 95).fill(NAVY);
doc.rect(50, 45, 5, 95).fill(GOLD);
doc.restore();

doc.fontSize(9.5).fillColor(GOLD).font('Helvetica-Bold')
   .text('KEN MERRELL AUTHOR PLATFORM', 68, 58, { characterSpacing: 1.5 });
doc.fontSize(18).fillColor('#FFFFFF').font('Helvetica-Bold')
   .text('Ad Tracking, Analytics & Attribution Guide', 68, 74);
doc.fontSize(9).fillColor('#CBD5E1').font('Helvetica')
   .text('Complete Reference for First-Party Analytics, UTMs, Meta Ads, and Live Visitor Tracking', 68, 102);

doc.y = 155;

// ==========================================
// SECTION 1: EXECUTIVE OVERVIEW
// ==========================================
drawSectionHeading(doc, '1. Executive Overview & The Single-Dashboard Solution', 'Strategy & Architecture');

drawParagraph(doc, 'When authors start running ads on Facebook, Instagram, or BookBub, marketing agencies typically recommend installing Google Analytics 4 (GA4) and Facebook Pixel. For an independent author, this creates serious problems:');

drawCalloutBox(doc, 'Why Traditional Tools Fail Authors:', [
  '• Platform Overload: Ken would need to log into Meta Ads Manager, GA4, Amazon KDP, and BookBub, spending hours stitching spreadsheets together.',
  '• Extreme Complexity: GA4 is designed for enterprise data analysts and hides basic daily stats behind dozens of confusing menus.',
  '• Ad Blocker Loss: 30% to 40% of readers use ad blockers or Safari/Firefox privacy protection, blocking GA4 and Meta Pixel completely.',
  '• Disconnected from Books: Third-party tools cannot tie an ad click directly to Ken\'s Advance Reader team signups or "Buy on Amazon" buttons.'
], '#EF4444', '#FEF2F2');

drawParagraph(doc, 'The Solution: Build a lightweight first-party analytics system directly into Ken\'s website admin portal (/admin/analytics). Ken opens his existing website dashboard and instantly sees his daily viewers, ad campaign ROI, and individual visitor clickstreams with zero extra logins and zero monthly subscription fees.');

// ==========================================
// SECTION 2: UTM PARAMETERS DEMYSTIFIED
// ==========================================
drawSectionHeading(doc, '2. What are UTM Parameters & How Do They Work?', 'Tracking Technology');

drawParagraph(doc, 'A UTM parameter is simply an extra label attached to the end of a link. It does not alter the destination page; it just quietly informs Ken\'s website where the visitor came from.');

drawCalloutBox(doc, 'Anatomy of a Tracking Link:', [
  'Standard URL:   https://www.kenmerrell.com/books/the-iron-gate',
  'Tracked URL:     https://www.kenmerrell.com/books/the-iron-gate?utm_source=facebook&utm_medium=ad&utm_campaign=spring_promo',
  '',
  '• utm_source:   WHERE the reader came from (e.g. facebook, instagram, bookbub, newsletter)',
  '• utm_medium:   THE TYPE of channel (e.g. paid_ad, organic_bio, organic_story, email)',
  '• utm_campaign: THE SPECIFIC PROMOTION (e.g. spring_promo, trailer_launch, arc_recruitment)'
], GOLD, LIGHT_BG);

// ==========================================
// SECTION 3: IN-PLATFORM ENGINE & PAID VS ORGANIC
// ==========================================
drawSectionHeading(doc, '3. Tracking Engine & Paid vs. Organic Traffic Split', 'Visitor Attribution');

drawParagraph(doc, 'Ken needs to know whether his visitors arrived from a PAID AD (where he spent budget) or ORGANICALLY (free visitors finding his profile bio, reels, or Google search). The system handles this automatically:');

drawCalloutBox(doc, 'Two-Tier Detection System:', [
  '1. Automatic HTTP Referrer: If a reader visits from an Instagram bio or Google search without UTM tags, the browser still sends a referrer header. The site automatically logs them as "Organic Social (Instagram)" or "Organic Search (Google)".',
  '2. Explicit UTM Tagging: For 100% precision, Ken uses "utm_medium=paid_ad" for ads and "utm_medium=organic_bio" for his profile links. The system splits the numbers cleanly into a Paid vs. Organic overview.'
], BLUE, LIGHT_BG);

// ==========================================
// SECTION 4: WHERE TO GET TRACKING LINKS
// ==========================================
drawSectionHeading(doc, '4. Where & How Do You Get / Create the Tracking Link?', 'Step-by-Step Options');

drawParagraph(doc, 'A tracking link is not something you buy or purchase. It is simply Ken\'s page address with labels. You can get or create them in 4 easy ways:');

drawParagraph(doc, 'Option 1: Inside Ken\'s Website Admin (/admin/analytics)', { font: 'Helvetica-Bold' });
drawParagraph(doc, 'Once implemented, Ken uses the built-in 10-second generator: select book, select platform (Instagram/Facebook/BookBub), type campaign name, and click "Copy Link".');

drawParagraph(doc, 'Option 2: Right Inside Meta Ads Manager (Free Native Generator)', { font: 'Helvetica-Bold' });
drawParagraph(doc, 'When creating an ad at adsmanager.facebook.com, paste Ken\'s clean URL in "Website URL", then click the blue "Build a URL parameter" button just below it. Meta generates and attaches the tags automatically.');

drawParagraph(doc, 'Option 3: Google\'s Free Campaign URL Builder (Available Today)', { font: 'Helvetica-Bold' });
drawParagraph(doc, 'Visit ga-dev-tools.google/campaign-url-builder/ (free, no account needed), type the page URL, source, medium, and campaign name, and copy the ready-to-use link.');

drawParagraph(doc, 'Option 4: Amazon Attribution (For Actual Sales & Royalties)', { font: 'Helvetica-Bold' });
drawParagraph(doc, 'Inside advertising.amazon.com, navigate to Amazon Attribution -> Create Campaign -> Select Ken\'s book. Amazon outputs a tracked Amazon URL that Ken pastes into his website admin under Books -> Amazon URL.');

// ==========================================
// SECTION 5: HOW TO SET LINKS IN META & INSTAGRAM
// ==========================================
drawSectionHeading(doc, '5. How to Add & Change Links in Meta Ads & Instagram', 'Platform Guides');

drawSubheading(doc, '5.1 Meta Ads Manager (Paid Facebook & Instagram Ads)');
drawParagraph(doc, '1. Go to adsmanager.facebook.com -> Campaigns -> select your Ad Set -> click the "Ads" tab.\n2. Hover over your ad and click "Edit". Scroll down to the "Destination" section.\n3. In "Website URL", enter Ken\'s book URL (or the full tracking link).\n4. In "URL Parameters", enter: utm_source=instagram&utm_medium=paid_ad&utm_campaign=spring_promo\n5. Click the green "Publish" button. (Existing active ads will briefly undergo a 15-30 min review).');

drawSubheading(doc, '5.2 Instagram Profile Bio Link (Free Organic Traffic)');
drawParagraph(doc, '1. Open the Instagram app -> tap Ken\'s profile icon -> tap "Edit Profile".\n2. Tap "Links" -> "Add external link".\n3. In URL, paste: https://www.kenmerrell.com?utm_source=instagram&utm_medium=organic_bio&utm_campaign=profile_bio\n4. Title: "Official Website & Books" -> Tap "Done".');

drawSubheading(doc, '5.3 Instagram Stories (Link Sticker)');
drawParagraph(doc, '1. Create a Story -> tap the Sticker tray icon -> select the "LINK" sticker.\n2. Paste: https://www.kenmerrell.com/books/the-iron-gate?utm_source=instagram&utm_medium=organic_story&utm_campaign=trailer\n3. Tap "Customize sticker text" -> write "Read Chapter 1" or "Buy on Amazon" -> Post.');

// ==========================================
// SECTION 6: CLIENT DASHBOARD SCREENS (OUTPUTS)
// ==========================================
drawSectionHeading(doc, '6. What Ken Sees in His Admin Portal (/admin/analytics)', 'Client Dashboard Outputs');

drawSubheading(doc, 'Output A: Top Executive KPI Cards & Paid vs. Organic Split');
drawCalloutBox(doc, 'TODAY AT A GLANCE (TOP BANNER)', [
  '[ TODAY\'S VIEWERS: 142 ]   [ THIS WEEK: 1,120 ]   [ AMAZON CLICKS: 82 ]   [ ARC SIGNUPS: 16 ]',
  '',
  'Traffic Split Today: Paid Ads = 65% (92 visitors)  |  Organic (Bio/Posts/Search) = 35% (50 visitors)'
], GOLD, LIGHT_BG);

drawSubheading(doc, 'Output B: Advertising & Organic Campaign Leaderboard');
drawParagraph(doc, 'Ken compares each promotion side-by-side to immediately identify his most profitable channels:');

drawTable(
  doc,
  ['Campaign Name', 'Source & Medium', 'Visitors', 'Amazon Clicks', 'ARC Signups', 'Conv. Rate'],
  [
    ['Spring Fantasy Ad', 'Instagram Paid Ad', '450', '82', '16', '21.7%'],
    ['BookBub Featured Deal', 'BookBub Promo', '720', '215', '28', '33.7%'],
    ['Instagram Profile Bio', 'Instagram Organic', '140', '45', '21', '47.1%'],
    ['Author Newsletter May', 'Email Broadcast', '130', '35', '48', '63.8%'],
    ['Facebook Boosted Post', 'Facebook Paid Ad', '210', '38', '9', '22.3%'],
  ],
  [120, 110, 50, 75, 65, 75]
);

drawSubheading(doc, 'Output C: Live Visitor Journey Feed (Every Single User)');
drawParagraph(doc, 'Ken can inspect every single individual person who comes to his website:');

drawTable(
  doc,
  ['Time', 'User ID', 'Source / Campaign', 'Location', 'Device', 'Outcome'],
  [
    ['03:42 PM', '#USR-8422', 'Instagram Story Ad', 'Austin, TX', 'iPhone', '[CLICKED AMAZON]'],
    ['03:38 PM', '#USR-8421', 'Facebook: Spring Promo', 'London, UK', 'Desktop', '[ARC SIGNUP: John]'],
    ['03:25 PM', '#USR-8420', 'Google Search (Organic)', 'Chicago, IL', 'Android', 'Exited (30s)'],
    ['03:10 PM', '#USR-8419', 'BookBub Deal', 'Toronto, CA', 'iPad', '[CLICKED AMAZON]'],
    ['02:54 PM', '#USR-8418', 'Instagram Bio (Organic)', 'Seattle, WA', 'iPhone', '[ARC SIGNUP: Sarah]'],
  ],
  [55, 65, 125, 80, 65, 105]
);

drawSubheading(doc, 'Output D: Individual Visitor Clickstream Drawer (When Ken Clicks #USR-8422)');
drawCalloutBox(doc, 'VISITOR #USR-8422 DETAILED CLICKSTREAM TIMELINE', [
  'Acquired via: Instagram Story Ad (Campaign: book_trailer_v2) | Location: Austin, Texas | Device: iPhone | Duration: 4m 12s',
  '--------------------------------------------------------------------------------------------------------',
  '03:42:10 PM - Landed on /books/the-iron-gate from Instagram ad swipe',
  '03:42:45 PM - Clicked "Watch Book Trailer" (watched for 1 minute 15 seconds)',
  '03:44:00 PM - Scrolled down to read Editorial Reviews & Quotes',
  '03:44:50 PM - Navigated to /author ("About Ken Merrell") - Read bio for 1m 20s',
  '03:46:10 PM - Returned to /books/the-iron-gate',
  '03:46:22 PM - *** CLICKED "BUY ON AMAZON" BUTTON *** -> Forwarded to Amazon Product Page'
], GREEN, LIGHT_BG);

drawSubheading(doc, 'Output E: Reader CRM Profile (Identity Bridging)');
drawCalloutBox(doc, 'READER CRM RECORD: JANE DOE (Verified ARC Reader)', [
  'Email: jane.doe@example.com | Format: Paperback & Ebook | Book: The Iron Gate',
  'Acquisition Trail: Facebook Ad (Campaign: Spring_Launch_Promo) | Session: #USR-8421 | Visited 2 pages prior to joining.',
  'Ken can see Jane\'s entire journey prior to joining and track her review status.'
], GOLD, GOLD_LIGHT);

// ==========================================
// SECTION 7: IMPLEMENTATION ROADMAP
// ==========================================
drawSectionHeading(doc, '7. Implementation Roadmap (4 Phases)', 'Execution Plan');

drawCalloutBox(doc, 'Roadmap Overview:', [
  '• Phase 1: Database & Event Storage — Add analytics_sessions and analytics_events in Supabase/local store with salted daily visitor hashing (zero cookies, zero privacy consent needed).',
  '• Phase 2: Lightweight Beacon & Session Logging — Deploy /api/track endpoint, attach listeners to "Buy on Amazon" buttons, and link reader form submissions to session IDs.',
  '• Phase 3: Admin Analytics Dashboard & Live Feed — Build /admin/analytics with KPI cards, campaign leaderboard, and the slide-out visitor clickstream drawer.',
  '• Phase 4: 1-Click Campaign Link Generator — Add the URL generator into the admin so Ken can copy tagged links for Facebook, Instagram, BookBub, and Email in 10 seconds.'
], BLUE, LIGHT_BG);

// ==========================================
// FOOTERS ON ALL PAGES
// ==========================================
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.save();
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // prevent auto-page-break
  doc.strokeColor(BORDER).lineWidth(0.5).moveTo(50, doc.page.height - 32).lineTo(50 + CONTENT_WIDTH, doc.page.height - 32).stroke();
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica')
     .text('Ken Merrell Author Platform — Private & Confidential', 50, doc.page.height - 24, { lineBreak: false });
  doc.fontSize(8).fillColor(TEXT_MUTED).font('Helvetica')
     .text(`Page ${i + 1} of ${totalPages}`, 50, doc.page.height - 24, { align: 'right', width: CONTENT_WIDTH, lineBreak: false });
  doc.restore();
  doc.page.margins.bottom = oldBottom;
}

doc.end();

writeStream.on('finish', () => {
  console.log('SUCCESS: PDF created at ' + outputPath);
});
