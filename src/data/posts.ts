import type { Key } from "../i18n/en";

/** The three posts. Bodies live in src/content/blog/{locale}/{slug}.md; titles and teasers in the dictionaries. */
export const POSTS = [
  { slug: "misfire-vacuum-leak", n: 1, date: "2026-10-28", book: { make: "bmw-mini", service: "diagnosis" } },
  { slug: "mercedes-service-a-b", n: 2, date: "2026-10-05", book: { make: "mercedes-amg", service: "maintenance" } },
  { slug: "bc-winter-tires", n: 3, date: "2026-09-15", book: { service: "tires" } },
] as const;
export type Post = (typeof POSTS)[number];
export type PostSlug = Post["slug"];

export const postTitle = (p: Post) => `post.${p.n}.title` as Key;
export const postText = (p: Post) => `post.${p.n}.text` as Key;

/** Reading time at 200 words a minute, from the Markdown source. */
export const readMinutes = (markdown: string): number =>
  Math.max(1, Math.round(markdown.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length / 200));
