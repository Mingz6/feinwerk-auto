// Demo-safety checks over the built site. Run after `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { en } from "../src/i18n/en.ts";
import { fr } from "../src/i18n/fr.ts";
import { zhHans } from "../src/i18n/zh-hans.ts";
import { zhHk } from "../src/i18n/zh-hk.ts";

const DIST = "dist";
const BASE = "/feinwerk-auto/";
const disclaimers: Record<string, string> = {
  "en-CA": en["footer.disclaimer"],
  "fr-CA": fr["footer.disclaimer"],
  "zh-Hans": zhHans["footer.disclaimer"],
  "zh-HK": zhHk["footer.disclaimer"],
};
const strips: Record<string, string> = {
  "en-CA": en["strip.label"],
  "fr-CA": fr["strip.label"],
  "zh-Hans": zhHans["strip.label"],
  "zh-HK": zhHk["strip.label"],
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const decode = (s: string) =>
  s.replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

assert.ok(existsSync(DIST), "dist/ is missing: run `npm run build` first");
const pages = walk(DIST).filter((f) => f.endsWith(".html"));

test("dist has the English, French, Simplified and Cantonese version of every page", () => {
  const rel = pages.map((p) => relative(DIST, p).replaceAll("\\", "/"));
  const english = rel.filter((p) => p !== "404.html" && !/^(fr|zh-hans|zh-hk)\//.test(p));
  assert.ok(english.includes("index.html"));
  for (const p of english) for (const x of ["fr/", "zh-hans/", "zh-hk/"]) assert.ok(rel.includes(x + p), x + p);
});

for (const file of pages) {
  const name = relative(DIST, file);
  const html = readFileSync(file, "utf8");
  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] ?? "";

  test(`${name}: noindex, nofollow`, () => {
    assert.match(html, /<meta name="robots" content="noindex,\s*nofollow">/);
  });

  test(`${name}: Design concept aside before the header`, () => {
    const aside = html.match(/<aside\b[^>]*\bdata-concept\b[^>]*>([\s\S]*?)<\/aside>/);
    assert.ok(aside, "no concept <aside>");
    assert.ok(decode(aside[1]).includes(strips[lang]), `strip text for ${lang}`);
    assert.ok(html.indexOf("data-concept") < html.indexOf("<header"), "the strip comes first");
  });

  test(`${name}: footer disclaimer in the page language`, () => {
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] ?? "";
    const p = footer.match(/<p\b[^>]*\bdata-disclaimer\b[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(p, "no disclaimer in <footer>");
    assert.equal(decode(p[1]).trim(), disclaimers[lang], lang);
  });

  test(`${name}: every root-relative URL is under ${BASE}`, () => {
    const urls = [...html.matchAll(/\b(?:href|src|action|content)="(\/[^"]*)"/g)].map((m) => m[1]);
    assert.deepEqual(urls.filter((u) => !u.startsWith(BASE)), []);
  });

  test(`${name}: sample phone and address only`, () => {
    for (const tel of html.matchAll(/href="tel:([^"]+)"/g)) assert.equal(tel[1], "+16045550148");
    assert.ok(html.includes("88 Sample Way"));
  });
}
