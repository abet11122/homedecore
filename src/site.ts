/**
 * Central site configuration.
 * Edit this file to rebrand — everything else reads from here.
 */

export const SITE = {
  name: 'Cozy Nest Ideas',
  tagline: 'Considered interiors for real homes',
  description:
    'An editorial guide to interiors: room-by-room design ideas, DIY projects and styling tips you can actually use.',
  url: 'https://www.cozynestideas.online',
  author: 'Editorial Team',
  authorRole: 'Cozy Nest Ideas editorial byline',
  authorBio:
    'Editorial Team is the publication byline for Cozy Nest Ideas, not a claim about staff numbers or professional credentials. Our guides provide decorating inspiration; AI-generated illustrations are visual concepts, not photographs of projects completed by us.',
  authorAvatar:
    '/favicon.svg',
  pinterest: '',
  instagram: '',
  email: 'mmubasharshahzad40@gmail.com',
  /** Paste your Pinterest domain-verification code here (Settings → Claim). */
  pinterestVerification: '',
  /** Paste your Google Search Console verification code here. */
  googleVerification: 'TnMLs9NaIrs9_XiBl7Y_KbP7N8XfH5FxyUWXRRBnq4A',
  /** Google Analytics 4 measurement ID. */
  googleAnalyticsId: 'G-T9NG3EPSQ6',
  /** Slug for the author hub page at /author/<slug>/. */
  authorSlug: 'editorial-team',
  /** Public profiles for the author — feeds Person.sameAs (E-E-A-T). */
  authorLinks: [] as string[],
  locale: 'en_US',
  lang: 'en',
  /** Square mark used for Organization.logo in structured data. */
  logo: '/favicon.svg',
  /** Twitter/X handle including the @. Optional. */
  twitter: '',
} as const;

export type CategorySlug =
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'entryway'
  | 'small-spaces'
  | 'home-office'
  | 'diy-decor'
  | 'outdoor'
  | 'seasonal'
  | 'renter';

export interface Category {
  slug: CategorySlug;
  name: string;
  blurb: string;
  image: string;
  /** Shown inline in the header nav. The rest live under the "More" menu. */
  primary?: boolean;
}

const ALL_CATEGORIES: Category[] = [
  {
    slug: 'living-room',
    name: 'Living Room',
    blurb:
      'The room that sets the tone for the whole house — layout, seating, light and the art of a room that works for both guests and Tuesday nights.',
    image: '/images/generated/living-room-rug-1536.webp',
    primary: true,
  },
  {
    slug: 'bedroom',
    name: 'Bedroom',
    blurb:
      'Rooms built for rest. Layered bedding, quiet colour, low light and the small decisions that make a bedroom feel like a retreat.',
    image: '/images/generated/bedroom-1536.webp',
    primary: true,
  },
  {
    slug: 'kitchen',
    name: 'Kitchen',
    blurb:
      'Hard-working rooms that still deserve to be beautiful. Open shelving, islands, surfaces and storage that survives real cooking.',
    image: '/images/generated/kitchen-1536.webp',
    primary: true,
  },
  {
    slug: 'bathroom',
    name: 'Bathroom',
    blurb:
      'The smallest room and the hardest to get right. Storage that fits, lighting that flatters, and changes that work even when you rent.',
    image: '/images/generated/bathroom-1536.webp',
    primary: true,
  },
  {
    slug: 'entryway',
    name: 'Entryway',
    blurb:
      'The first three feet of the house and the hardest-working. Storage, layout and styling for entries, hallways and mudrooms of every size.',
    image: '/images/generated/rental-entryway-1536.webp',
    primary: true,
  },
  {
    slug: 'small-spaces',
    name: 'Small Spaces',
    blurb:
      'Studios, box rooms and awkward corners. How to zone, scale and edit so a small home reads as intentional rather than cramped.',
    image: '/images/generated/small-spaces-1536.webp',
    primary: true,
  },
  {
    slug: 'home-office',
    name: 'Home Office',
    blurb:
      'Workspaces built into corners, closets and the edges of other rooms — layouts, lighting and storage for a desk that still feels like part of the house.',
    image: '/images/generated/home-office-1536.webp',
  },
  {
    slug: 'diy-decor',
    name: 'DIY Decor',
    blurb:
      'Projects worth the weekend. Handmade pieces that look considered, not crafty — with honest costs and realistic timelines.',
    image: '/images/generated/diy-decor-1536.webp',
  },
  {
    slug: 'outdoor',
    name: 'Outdoor',
    blurb:
      'Balconies, patios and back gardens. The dimensions, bases and lighting that turn leftover outdoor space into somewhere you actually sit.',
    image: '/images/generated/outdoor-1536.webp',
  },
  {
    slug: 'seasonal',
    name: 'Seasonal',
    blurb:
      'Decorating with the calendar. Mantels, tablescapes and light — how to mark the season without redecorating the whole house.',
    image: '/images/generated/autumn-1536.webp',
  },
  {
    slug: 'renter',
    name: 'Renter',
    blurb:
      'Everything that comes off the wall again. Reversible upgrades, deposit-safe fixes and the changes that move house with you.',
    image: '/images/generated/rental-entryway-1536.webp',
  },
];

// Both DIY guides need evidence review. Suppress their otherwise empty hub.
// Restore this category once at least one guide passes editorial review.
export const CATEGORIES = ALL_CATEGORIES.filter((category) => category.slug !== 'diy-decor');

export function categoryPath(slug: string): string {
  return CATEGORIES.some((category) => category.slug === slug) ? `/category/${slug}/` : '/stories/';
}

/** Categories shown inline in the header; the rest sit under "More". */
export const PRIMARY_CATEGORIES = CATEGORIES.filter((c) => c.primary);
export const SECONDARY_CATEGORIES = CATEGORIES.filter((c) => !c.primary);

export function categoryBySlug(slug: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.slug === slug);
}

export function categoryName(slug: string): string {
  return categoryBySlug(slug)?.name ?? slug.replace(/-/g, ' ');
}

/** Public article URLs are independent of the content file's folder. */
export function postSlug(id: string): string {
  return id.split('/').filter(Boolean).at(-1) ?? id;
}

export function postPath(post: { id: string } | string): string {
  const id = typeof post === 'string' ? post : post.id;
  return `/post/${postSlug(id)}/`;
}

/** Rough reading time from a Markdown body. */
export function readingTime(body: string): number {
  const words = wordCount(body);
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* ------------------------------------------------------------------
   Tags
   Frontmatter tags were authored by hand, so the same idea arrives in
   several spellings ("small spaces", "small-spaces", "Small Spaces").
   Everything is keyed off the slug so those collapse into one page,
   and the display label is derived from the slug rather than from
   whichever spelling happened to be written first.
------------------------------------------------------------------- */

/** Words that stay lowercase inside a tag label unless they lead it. */
const MINOR_WORDS = new Set(['and', 'the', 'of', 'for', 'in', 'to', 'a']);

/** Tags whose natural casing a title-caser would get wrong. */
const TAG_LABEL_OVERRIDES: Record<string, string> = {
  diy: 'DIY',
  'diy-decor': 'DIY Decor',
  'peel-and-stick': 'Peel-and-Stick',
  'renter-friendly': 'Renter-Friendly',
};

export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function tagLabel(slug: string): string {
  if (TAG_LABEL_OVERRIDES[slug]) return TAG_LABEL_OVERRIDES[slug];
  return slug
    .split('-')
    .map((word, i) =>
      i > 0 && MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

export interface TagSummary {
  slug: string;
  label: string;
  count: number;
}

/**
 * Every distinct tag across the archive, most-used first.
 * `minCount` drops one-off tags that would only ever build a single-post
 * page — thin pages Google reads as low value, so they are left unbuilt
 * and simply render as plain text on the post.
 */
export function collectTags(
  posts: Array<{ data: { tags?: string[] } }>,
  minCount = 2
): TagSummary[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    // A post can carry two spellings of the same tag; count it once.
    for (const slug of new Set((post.data.tags ?? []).map(tagSlug))) {
      if (!slug || slug === 'onthecorner') continue;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .map(([slug, count]) => ({ slug, label: tagLabel(slug), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Does this post carry the given tag, in any spelling? */
export function postHasTag(post: { data: { tags?: string[] } }, slug: string): boolean {
  return (post.data.tags ?? []).some((t) => tagSlug(t) === slug);
}

/** Body word count — reported in Article schema, which Google reads. */
export function wordCount(body: string): number {
  const text = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, '')
    .replace(/<div\b[^>]*class="[^"]*shop-look-wrap[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ');
  return text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

/**
 * Keep scheduled and editorial-hold stories reachable at their permanent URL
 * without promoting, indexing or monetizing them. The folder a post lives in
 * is deliberately irrelevant: moving a Markdown file must not change its URL.
 */
export function isPublished(post: { data: { publishDate: Date; editorialReady?: boolean; disposition?: string } }): boolean {
  return (post.data.disposition ?? 'keep') === 'keep' && post.data.publishDate.getTime() <= Date.now() && post.data.editorialReady !== false;
}
