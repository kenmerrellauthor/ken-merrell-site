import type { SidebarAdItem, InArticleAdItem, AdSettings } from './types';

export const defaultLeftAd: SidebarAdItem = {
  enabled: true,
  label: 'FEATURED NOVEL',
  badge: '★ BESTSELLER',
  bookSlug: 'petticoats-and-ash',
  title: 'Petticoats and Ash',
  coverImage: '/img/covers/petticoats-and-ash.jpg',
  tagline: 'She survived the war—but what she did to survive haunted her for twenty-five years.',
  ratingStars: 5,
  primaryBtnText: 'BUY ON AMAZON ↗',
  primaryBtnUrl: 'https://www.amazon.com/Petticoats-Ash-Ken-Merrell/dp/B0HHQKCWZM',
  secondaryBtnText: 'READ SAMPLE',
  secondaryBtnUrl: '/books/petticoats-and-ash#sample',
};

export const defaultRightAd: SidebarAdItem = {
  enabled: true,
  label: 'ADVERTISEMENT',
  badge: '⚡ NEW RELEASE',
  bookSlug: 'petticoats-and-a-traitors-death',
  title: "Petticoats and a Traitor's Death",
  coverImage: '/img/covers/petticoats-and-a-traitors-death.jpg',
  tagline: 'They hanged her husband. They did not silence his widow.',
  ratingStars: 5,
  primaryBtnText: 'BUY ON AMAZON ↗',
  primaryBtnUrl: '#',
  secondaryBtnText: 'READ SAMPLE',
  secondaryBtnUrl: '/books/petticoats-and-a-traitors-death#sample',
};

export const defaultInArticleAd: InArticleAdItem = {
  enabled: true,
  placement: 'mid',
  insertAfterParagraph: 2,
  label: 'RECOMMENDED NOVEL',
  badge: '★ HISTORICAL SUSPENSE',
  bookSlug: 'petticoats-and-ash',
  title: 'Petticoats and Ash',
  coverImage: '/img/covers/petticoats-and-ash.jpg',
  bannerImage: '/img/banners/ash.jpg',
  tagline: 'She survived the war—but what she did to survive haunted her for twenty-five years.',
  ratingStars: 5,
  primaryBtnText: 'BUY ON AMAZON ↗',
  primaryBtnUrl: 'https://www.amazon.com/Petticoats-Ash-Ken-Merrell/dp/B0HHQKCWZM',
  secondaryBtnText: 'READ FREE SAMPLE',
  secondaryBtnUrl: '/books/petticoats-and-ash#sample',
};

export const defaultAdSettings: AdSettings = {
  leftAd: defaultLeftAd,
  rightAd: defaultRightAd,
  inArticleAd: defaultInArticleAd,
};
