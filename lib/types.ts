export type BookStatus = 'available' | 'coming';

export interface Quote {
  text: string;
  source: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number; // 1-5
  text: string;
  /** Optional comment left by admin in the CRM */
  adminComment?: string;
  /** ISO timestamp of when the review was submitted */
  createdAt: string;
  /** Whether the review is approved/visible on the public page */
  approved: boolean;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  /** Styled title for banners. Wrap small words in *asterisks* for gold italics, use | for a line break. */
  displayTitle: string;
  tagline: string;
  description: string;
  genre: string;
  status: BookStatus;
  featured: boolean;
  isNew: boolean;
  order: number;
  cover: string | null;
  banner: string | null;
  clothColor: string;
  amazonUrl: string;
  audibleUrl: string;
  videoUrl?: string;
  videoThumbnail?: string | null;
  /** Multiple videos for this book (trailers, chapter readings, interviews, teasers) */
  videos?: BookVideo[];
  published: string;
  pages: string;
  formats: string;
  isbn: string;
  quotes: Quote[];
  reviews?: Review[];
  chapterTitle: string;
  /** Sample chapter. Blank line = new paragraph, a line with *** = scene break. */
  sample: string;
  /** Coming soon only: ISO date of release (for the countdown) and a label like "Spring 2027". */
  releaseDate: string;
  releaseLabel: string;
  updatedAt: string;
  /** ISO timestamp of when the book was first created/uploaded. Used for the 3-day "New" badge. */
  createdAt?: string;
}

export type VideoType = 'Trailer' | 'Reading' | 'Interview';

export interface BookVideo {
  id?: string;
  url: string;
  title?: string;
  type?: 'Trailer' | 'Reading' | 'Interview' | 'Teaser' | string;
  thumbnail?: string | null;
  duration?: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  type: VideoType;
  duration: string;
  order: number;
  thumbnail?: string | null;
}

export interface HomeQuote {
  text: string;
  sub: string;
  who: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  image?: string;
}

export interface SiteSettings {
  pullQuote: string;
  bio: string;
  photo: string | null;
  amazonAuthorUrl: string;
  youtubeUrl: string;
  socialLinks?: SocialLink[];
  notifyEmail: string;
  homeQuotes: HomeQuote[];
  lastSeenReaders?: string;
  adSettings?: AdSettings;
}

export interface SidebarAdItem {
  enabled: boolean;
  label?: string; // e.g. "ADVERTISEMENT", "SPONSORED", "FEATURED NOVEL"
  badge?: string; // e.g. "★ BESTSELLER", "⚡ NEW RELEASE"
  bookSlug?: string; // auto-populate from an existing book
  title?: string;
  coverImage?: string;
  bannerImage?: string;
  tagline?: string;
  ratingStars?: number; // 1-5
  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;
  customHtml?: string; // for custom scripts or external ad tags
}

export interface InArticleAdItem {
  enabled: boolean;
  insertAfterParagraph: number; // default: 2 (or after 2nd paragraph)
  label?: string; // e.g. "SPONSORED RECOMMENDATION", "FEATURED NOVEL"
  badge?: string; // e.g. "★ BESTSELLER", "⚡ HISTORICAL SUSPENSE"
  bookSlug?: string;
  title?: string;
  coverImage?: string;
  bannerImage?: string; // Clickable horizontal banner image
  tagline?: string;
  ratingStars?: number; // 1-5
  primaryBtnText?: string;
  primaryBtnUrl?: string;
  secondaryBtnText?: string;
  secondaryBtnUrl?: string;
  customHtml?: string; // for custom scripts or external ad tags
}

export interface AdSettings {
  leftAd: SidebarAdItem;
  rightAd: SidebarAdItem;
  inArticleAd?: InArticleAdItem;
}

export interface Reader {
  id: string;
  name: string;
  email: string;
  format: 'Ebook' | 'Paperback' | string;
  agreed?: boolean;
  bookTitle?: string;
  createdAt: string;
}

export interface CrmNotification {
  id: string;
  type: 'reader' | 'review' | 'comment';
  title: string;
  subtitle: string;
  detail?: string;
  createdAt: string;
  href: string;
  unread: boolean;
  metadata?: {
    email?: string;
    format?: string;
    bookTitle?: string;
    bookId?: string;
    rating?: number;
    readerName?: string;
    blogTitle?: string;
    blogId?: string;
    blogSlug?: string;
  };
}

export type TrafficMedium = 'paid_ad' | 'organic_bio' | 'organic_post' | 'story' | 'newsletter' | 'cpc' | 'search' | 'direct' | 'referral';

export interface AnalyticsLocation {
  city: string;
  region: string;
  country: string;
}

export interface AnalyticsSession {
  id: string; // e.g. "USR-8422"
  createdAt: string;
  updatedAt: string;
  durationSeconds: number;
  source: string; // "Instagram", "Facebook", "BookBub", "Google", "Email", "TikTok", "Direct"
  medium: TrafficMedium | string;
  campaign: string;
  content?: string;
  term?: string;
  adClickId?: string;
  adClickSource?: string;
  location: AnalyticsLocation;
  device: string; // "iPhone", "Android", "iPad", "Mac", "Windows", "Desktop", "Mobile"
  browser: string; // "Safari", "Chrome", "Firefox", "Edge"
  landingPage: string;
  referrer?: string;
  exitOutcome: 'amazon_click' | 'arc_signup' | 'video_play' | 'browse' | 'exit';
  outcomeDetail?: string;
  readerId?: string;
  readerName?: string;
  readerEmail?: string;
  pageCount: number;
  ipHash?: string;
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  timestamp: string;
  eventType: 'pageview' | 'amazon_click' | 'video_play' | 'arc_signup' | 'scroll_quote';
  pagePath: string;
  pageTitle?: string;
  bookTitle?: string;
  details?: string;
  targetUrl?: string;
}

export interface CampaignSummary {
  campaign: string;
  source: string;
  medium: string;
  isPaid: boolean;
  visitors: number;
  amazonClicks: number;
  arcSignups: number;
  videoPlays: number;
  conversionRate: number; // percentage (amazonClicks + arcSignups) / visitors * 100
  estimatedCost?: number;
  costPerClick?: number;
  notes?: string;
}

export interface AnalyticsKPIs {
  todayVisitors: number;
  yesterdayVisitors: number;
  visitorsDeltaPct: number;
  thisWeekVisitors: number;
  totalViews: number;
  amazonClicks: number;
  amazonIntentRate: number;
  arcSignups: number;
  paidVisitors: number;
  paidPercentage: number;
  organicVisitors: number;
  organicPercentage: number;
}

export interface BlogFAQItem {
  question: string;
  answer: string;
}

export interface BlogComment {
  id: string;
  blogId: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  createdAt: string;
  approved: boolean;
  authorReply?: string;
  authorReplyAt?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown / HTML formatted text
  coverImage?: string | null;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  isPublished: boolean;
  featured?: boolean;
  views?: number;
  relatedBookSlug?: string | null;
  videoUrl?: string | null; // Optional YouTube / video spotlight URL
  // SEO & Generative Engine Optimization (GEO) Fields
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  keyTakeaways?: string[]; // High-density bullet takeaways for ChatGPT Search, Perplexity, and readers
  faqItems?: BlogFAQItem[]; // Question & Answer pairs for JSON-LD FAQPage schema and public accordion
  comments?: BlogComment[]; // Reader reflections and discussion
}

