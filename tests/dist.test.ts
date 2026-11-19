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

// Phase 2a: service pages, the booking contract on every block, and the trademark rules (PLAN.md Demo safety).
const SERVICE_SLUGS = ["bmw-mini", "mercedes-amg", "vw-audi-porsche", "tires", "fleet", "carplay-retrofit", "pre-purchase-inspection"];
const MAKES = ["bmw-mini", "mercedes-amg", "vw-audi-porsche", "other"];
const SERVICES = ["diagnosis", "repair", "maintenance", "transmission", "suspension", "tires", "fleet", "carplay", "inspection"];
const sampleWord: Record<string, string> = { "en-CA": en.sample, "fr-CA": fr.sample, "zh-Hans": zhHans.sample, "zh-HK": zhHk.sample };
const MODEL_BLOCKS: Record<string, number> = { "bmw-mini": 4, "mercedes-amg": 4, "vw-audi-porsche": 4, "carplay-retrofit": 3 };
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test("all seven service pages are built in all four languages", () => {
  for (const x of ["", "fr/", "zh-hans/", "zh-hk/"]) for (const s of SERVICE_SLUGS) assert.ok(existsSync(join(DIST, x, s, "index.html")), `${x}${s}/`);
});

for (const file of pages.filter((f) => SERVICE_SLUGS.some((s) => relative(DIST, f).replaceAll("\\", "/").replace(/^(fr|zh-hans|zh-hk)\//, "") === `${s}/index.html`))) {
  const name = relative(DIST, file).replaceAll("\\", "/");
  const slug = name.replace(/^(fr|zh-hans|zh-hk)\//, "").split("/")[0];
  const html = readFileSync(file, "utf8");
  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] ?? "";

  test(`${name}: every block has a Book button that carries make and service`, () => {
    const starts = [...html.matchAll(/<li\b[^>]*\bdata-block="[^"]+"[^>]*>/g)];
    if (MODEL_BLOCKS[slug]) assert.equal(starts.filter((m) => attr(m[0], "data-block-kind") === "model").length, MODEL_BLOCKS[slug], "model blocks");
    starts.forEach((m, i) => {
      const chunk = html.slice(m.index, starts[i + 1]?.index ?? html.length);
      const a = chunk.match(/<a\b[^>]*\sdata-book[\s>][^>]*>|<a\b[^>]*\sdata-book\b[^>]*>/)?.[0];
      assert.ok(a, `${attr(m[0], "data-block")}: no Book button`);
      const href = decode(attr(a, "href") ?? "");
      assert.ok(href.startsWith(`${BASE}${name.match(/^(fr|zh-hans|zh-hk)\//)?.[0] ?? ""}book/?`), href);
      const q = new URLSearchParams(href.split("?")[1]);
      assert.ok(SERVICES.includes(q.get("service") ?? ""), `service in ${href}`);
      assert.equal(attr(a, "data-book-service"), q.get("service"));
      if (attr(m[0], "data-block-kind") === "model") {
        assert.ok(MAKES.includes(q.get("make") ?? ""), `make in ${href}`);
        assert.equal(attr(a, "data-book-make"), q.get("make"));
        assert.equal(attr(a, "data-book-model"), q.get("model"));
      }
    });
  });

  test(`${name}: every price is labelled Sample`, () => {
    const prices = [...html.matchAll(/<p\b[^>]*\bdata-sample-price\b[^>]*>([\s\S]*?)<\/p>/g)];
    if (slug !== "fleet") assert.ok(prices.length > 0, "no prices");
    for (const p of prices) assert.ok(decode(p[1]).includes(`>${sampleWord[lang]}<`), "Sample tag");
  });
}

test("no maker logo: the favicon is the only image file, and inline drawings carry no words or images", () => {
  const images = walk(DIST).map((f) => relative(DIST, f).replaceAll("\\", "/")).filter((f) => /\.(svg|png|jpe?g|webp|avif|gif|ico)$/i.test(f));
  // A new image (Ming's photos) gets added here only after a look that badges and plates are blurred.
  assert.deepEqual(images, ["favicon.svg"]);
  const maker = /logo|badge|emblem|roundel|crest|bmw|mini|mercedes|benz|amg|audi|porsche|volkswagen|\bvw\b/i;
  for (const file of pages) {
    const html = readFileSync(file, "utf8");
    for (const img of html.matchAll(/<img\b[^>]*>/g)) assert.doesNotMatch(`${attr(img[0], "src")} ${attr(img[0], "alt")}`, maker, `${file}: ${img[0]}`);
    for (const svg of html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)) {
      assert.match(svg[0], /^<svg\b[^>]*aria-hidden="true"/, `${file}: an <svg> that isn't decorative`);
      assert.doesNotMatch(svg[0], /<(image|use|foreignObject)\b/, `${file}: <svg> with an image`);
      // Drawings may number callouts or mark parking ("1", "P"); a word inside an <svg> could be a wordmark.
      for (const tx of svg[0].matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)) assert.match(tx[1], /^\s*[0-9A-Z]{1,2}\s*$/, `${file}: <text>${tx[1]}</text>`);
      assert.doesNotMatch(svg[0].match(/^<svg\b[^>]*>/)![0], maker, `${file}: ${svg[0].slice(0, 80)}`);
    }
  }
});

test("no 'authorized' or 'dealer' wording on any page, in any language", () => {
  const words = /\b(authori[sz]ed|authori[sz]ation|dealers?|dealerships?|franchised?)\b|concessionnaire|agréé|autoris|(?<![A-Za-z0-9])4S(?![A-Za-z0-9])|经销|經銷|授权|授權|特约|特約|代理/i;
  for (const file of pages) {
    const html = readFileSync(file, "utf8").replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "");
    const visible = decode(html.replace(/<[^>]*>/g, " "));
    const attrs = [...html.matchAll(/\s(?:content|alt|title|aria-label)="([^"]*)"/g)].map((m) => decode(m[1])).join(" ");
    const hit = `${visible} ${attrs}`.match(words);
    assert.equal(hit, null, `${relative(DIST, file)}: "${hit?.[0]}"`);
  }
});
