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

/**
 * Reading time from the Markdown source: 200 words a minute, plus 400 Chinese characters a minute.
 * Chinese has no spaces between words, so splitting on spaces would make every Chinese post "1 min".
 */
export const readMinutes = (markdown: string): number => {
  const han = markdown.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = markdown.replace(/\p{Script=Han}+/gu, " ").split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  return Math.max(1, Math.round(words / 200 + han / 400));
};
