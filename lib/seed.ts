import type { Book, SiteSettings, Video } from './types';

const now = new Date().toISOString();

const SAMPLE_PLACEHOLDER = `Sample chapter text from Ken's manuscript sits here, set at a comfortable reading size so readers can settle in and keep going.

[Second paragraph of the sample chapter. Replace this text in the admin panel by pasting the chapter or uploading the Word file.]

[Third paragraph. Each spread holds roughly two pages of the printed book.]

[The chapter continues here.]

[Dialogue and description keep the same rhythm from page to page.]

***

[A new scene begins after the break.]

[Closing paragraph of the sample, ideally ending on a hook.]`;

function book(p: Partial<Book> & Pick<Book, 'id' | 'slug' | 'title' | 'order'>): Book {
  return {
    displayTitle: p.title,
    tagline: '',
    description: '[Book description from Ken. A short paragraph or two that sets up the story, the stakes and the choice the main character has to make.]',
    genre: '[Genre] · A novel',
    status: 'available',
    featured: false,
    isNew: false,
    cover: null,
    banner: null,
    clothColor: '#1c1712',
    amazonUrl: '',
    audibleUrl: '',
    videoUrl: '',
    published: '[Month Year]',
    pages: '[000]',
    formats: 'Print, Ebook',
    isbn: '[000-0-000]',
    quotes: [],
    reviews: [],
    chapterTitle: '[Chapter title]',
    sample: SAMPLE_PLACEHOLDER,
    releaseDate: '',
    releaseLabel: '',
    updatedAt: now,
    ...p
  };
}

export const seedBooks: Book[] = [
  book({
    id: 'b1', slug: 'petticoats-and-ash', title: 'Petticoats and Ash', order: 1,
    displayTitle: 'Petticoats|*and* Ash', tagline: '[One-line hook for Petticoats and Ash]',
    featured: true, isNew: true, cover: '/img/covers/petticoats-and-ash.jpg', banner: '/img/banners/ash.jpg',
    audibleUrl: '#', amazonUrl: '#', formats: 'Print, Ebook, Audio'
  }),
  book({
    id: 'b2', slug: 'petticoats-and-a-traitors-death', title: 'Petticoats and a Traitor’s Death', order: 2,
    displayTitle: 'Petticoats *and a*|Traitor’s Death', tagline: 'They hanged her husband.\nThey did not silence his widow.',
    featured: true, cover: '/img/covers/petticoats-and-a-traitors-death.jpg', banner: '/img/banners/traitor.jpg',
    audibleUrl: '#', amazonUrl: '#', formats: 'Print, Ebook, Audio'
  }),
  book({
    id: 'b3', slug: 'of-craven-dawn', title: 'Of Craven Dawn', order: 3,
    displayTitle: '*Of* Craven|Dawn', tagline: 'One woman vanished into the cracks of America,\nuntil she was actually seen.',
    featured: true, cover: '/img/covers/of-craven-dawn.jpg', banner: '/img/banners/craven.jpg', amazonUrl: '#'
  }),
  book({ id: 'b4', slug: 'the-landlord', title: '[The Landlord]', order: 4, clothColor: '#1c1712' }),
  book({ id: 'b5', slug: 'book-five', title: '[Book five title]', order: 5, clothColor: '#4b1d1b' }),
  book({ id: 'b6', slug: 'book-six', title: '[Book six title]', order: 6, clothColor: '#1f2d25' }),
  book({ id: 'b7', slug: 'book-seven', title: '[Book seven title]', order: 7, clothColor: '#1b2332' }),
  book({
    id: 'b8', slug: 'upcoming', title: '[Upcoming title]', order: 8, status: 'coming', clothColor: '#120f0c',
    tagline: '[A short teaser for the upcoming book, one or two lines.]',
    releaseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 74).toISOString().slice(0, 10), releaseLabel: '[Month Year]',
    sample: ''
  })
];

export const seedVideos: Video[] = [
  { id: 'v1', youtubeId: '', title: '[Featured video title]', type: 'Trailer', duration: '', order: 1 },
  { id: 'v2', youtubeId: '', title: '[Video title]', type: 'Reading', duration: '', order: 2 },
  { id: 'v3', youtubeId: '', title: '[Video title]', type: 'Interview', duration: '', order: 3 }
];

export const seedSite: SiteSettings = {
  pullQuote: 'What will I do when the pressure falls on me?',
  bio: `Sooner or later, life puts each of us in a vise. We may have to choose between people we love, protect something we could lose, or find a way forward when every choice has a cost.

That is the moment I write toward. My stories may begin with a watchful landlord, a sentence of treason, or a secret buried beneath a river. But beneath the suspense is a question I think we all know: What will I do when the pressure falls on me?`,
  photo: null,
  amazonAuthorUrl: '',
  youtubeUrl: '',
  notifyEmail: '',
  homeQuotes: [
    { text: 'Sooner or later, life puts each of us in a vise.', sub: 'That is the moment I write toward.', who: 'Ken Merrell' },
    { text: '“What will I do when the pressure falls on me?”', sub: 'The question beneath every one of my stories.', who: 'Ken Merrell' },
    { text: '“[Reader or reviewer quote about Ken’s books.]”', sub: '[Book title]', who: '[Name · Source]' },
    { text: '“[Second reader or reviewer quote.]”', sub: '[Book title]', who: '[Name · Source]' }
  ]
};
