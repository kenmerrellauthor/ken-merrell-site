export type BookStatus = 'available' | 'coming';

export interface Quote {
  text: string;
  source: string;
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
  published: string;
  pages: string;
  formats: string;
  isbn: string;
  quotes: Quote[];
  chapterTitle: string;
  /** Sample chapter. Blank line = new paragraph, a line with *** = scene break. */
  sample: string;
  /** Coming soon only: ISO date of release (for the countdown) and a label like "Spring 2027". */
  releaseDate: string;
  releaseLabel: string;
  updatedAt: string;
}

export type VideoType = 'Trailer' | 'Reading' | 'Interview';

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  type: VideoType;
  duration: string;
  order: number;
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
}

export interface Reader {
  id: string;
  name: string;
  email: string;
  format: 'Ebook' | 'Paperback';
  agreed: boolean;
  createdAt: string;
}
