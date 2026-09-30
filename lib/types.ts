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

export interface SiteSettings {
  pullQuote: string;
  bio: string;
  photo: string | null;
  amazonAuthorUrl: string;
  youtubeUrl: string;
  notifyEmail: string;
  homeQuotes: HomeQuote[];
  lastSeenReaders?: string;
}

export interface Reader {
  id: string;
  name: string;
  email: string;
  format: 'Ebook' | 'Paperback';
  agreed: boolean;
  createdAt: string;
}
