import type { MarkdownInstance } from "astro";
import type { Locale } from "./lang";
import type { PostSlug } from "../data/posts";

const files = import.meta.glob<MarkdownInstance<Record<string, unknown>>>("../content/blog/*/*.md", { eager: true });

/** A post's body in the page language, or the English one until Phase 3 adds the translation. */
export const postBody = (locale: Locale, slug: PostSlug) => {
  const own = files[`../content/blog/${locale}/${slug}.md`];
  const en = files[`../content/blog/en/${slug}.md`];
  if (!en) throw new Error(`src/content/blog/en/${slug}.md is missing`);
  const file = own ?? en;
  return { Content: file.Content, raw: file.rawContent(), fallback: !own };
};
