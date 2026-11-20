// Demo-safety checks over the built site. Run after `npm run build`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
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

test("no maker logo: only the favicon, touch icon and share cards are image files, and inline drawings carry no words or images", () => {
  const images = walk(DIST).map((f) => relative(DIST, f).replaceAll("\\", "/")).filter((f) => /\.(svg|png|jpe?g|webp|avif|gif|ico)$/i.test(f));
  // A new image (Ming's photos) gets added here only after a look that badges and plates are blurred.
  // The share cards and touch icon are drawn by scripts/share-cards.mjs: type and line art only.
  assert.deepEqual(images.sort(), ["apple-touch-icon.png", "favicon.svg", "og/en.png", "og/fr.png", "og/zh-hans.png", "og/zh-hk.png"]);
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

// Phase 2b: the booking flow. PLAN.md: page JavaScript under 15 KB gzipped; BC PIPA s.10 and CASL on the form.
const JS_BUDGET = 15 * 1024;
const gz = (s: string | Buffer) => gzipSync(s, { level: 9 }).length;
/** A module and everything it imports, each file once. */
const moduleFiles = (src: string, seen = new Set<string>()): Set<string> => {
  const file = join(DIST, src.replace(BASE, ""));
  if (seen.has(file)) return seen;
  seen.add(file);
  const code = readFileSync(file, "utf8");
  for (const m of code.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) moduleFiles(join(BASE, relative(DIST, join(file, "..", m[1]))), seen);
  return seen;
};
const pageJs = (html: string) => {
  const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc=)(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g)].reduce((n, m) => n + gz(m[1]), 0);
  const files = new Set<string>();
  for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) moduleFiles(m[1], files);
  return inline + [...files].reduce((n, f) => n + gz(readFileSync(f)), 0);
};

test(`every page ships under ${JS_BUDGET / 1024} KB of JavaScript, gzipped`, () => {
  const sizes = pages.map((f) => [relative(DIST, f), pageJs(readFileSync(f, "utf8"))] as const).sort((a, b) => b[1] - a[1]);
  console.log(`page JavaScript, gzipped: largest ${sizes[0][0]} ${(sizes[0][1] / 1024).toFixed(1)} KB, smallest ${sizes.at(-1)![0]} ${(sizes.at(-1)![1] / 1024).toFixed(1)} KB`);
  for (const [name, size] of sizes) assert.ok(size < JS_BUDGET, `${name}: ${size} bytes`);
});

const consentWord: Record<string, string> = { "en-CA": "unsubscribe", "fr-CA": "désabonner", "zh-Hans": "退订", "zh-HK": "取消訂閱" };
for (const file of pages) {
  const name = relative(DIST, file).replaceAll("\\", "/");
  const html = readFileSync(file, "utf8");
  const lang = html.match(/<html[^>]*\blang="([^"]+)"/)?.[1] ?? "";
  const isBook = /^((fr|zh-hans|zh-hk)\/)?book\/index\.html$/.test(name);

  test(`${name}: one booking flow, ${isBook ? "inline on the page" : "in the sheet"}`, () => {
    assert.equal([...html.matchAll(/data-book-flow/g)].length, 1);
    assert.equal(html.includes("data-book-sheet"), !isBook);
    if (isBook) assert.match(html, /<dialog\b[^>]*class="book-inline"[^>]*\bopen\b/);
    assert.match(html, /<form\b[^>]*method="dialog"[^>]*data-book-form/, "the form can't submit anywhere");
    assert.doesNotMatch(html.match(/<form\b[^>]*data-book-form[^>]*>/)![0], /\saction=/);
  });

  test(`${name}: reminders box unticked, with identity, contact and unsubscribe (CASL); privacy purpose and contact (PIPA s.10)`, () => {
    const box = html.match(/<input\b[^>]*name="reminders"[^>]*>/)?.[0] ?? "";
    assert.ok(box, "no reminders box");
    assert.doesNotMatch(box, /\schecked\b/);
    assert.doesNotMatch(box, /\srequired\b/);
    const label = decode(html.match(/<label class="book-consent">([\s\S]*?)<\/label>/)?.[1].replace(/<[^>]*>/g, "") ?? "");
    for (const part of ["Feinwerk Auto", "88 Sample Way", "604-555-0148", consentWord[lang]]) assert.ok(label.includes(part), `${part} in "${label}"`);
    const privacy = decode(html.match(/<p\b[^>]*data-privacy[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "");
    assert.ok(privacy.includes("604-555-0148"), "privacy contact");
    assert.ok(html.indexOf("data-privacy") > html.indexOf('name="email"'), "the privacy line sits under the fields");
  });
}

// Phase 2c: the other pages, the blog and the 404 (PLAN.md Information architecture).
const ENGLISH_19 = [
  "index.html", ...SERVICE_SLUGS.map((s) => `${s}/index.html`), "book/index.html", "contact/index.html", "about/index.html",
  "reviews/index.html", "warranty/index.html", "privacy/index.html", "blog/index.html", "blog/misfire-vacuum-leak/index.html",
  "blog/mercedes-service-a-b/index.html", "blog/bc-winter-tires/index.html", "404.html",
];
const read = (p: string) => readFileSync(join(DIST, p), "utf8");
const text = (html: string) => decode(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ");

test("all 19 English pages in PLAN.md's table are built, each in four languages but the 404", () => {
  assert.equal(ENGLISH_19.length, 19);
  for (const p of ENGLISH_19) assert.ok(existsSync(join(DIST, p)), p);
  for (const p of ENGLISH_19.filter((p) => p !== "404.html")) for (const x of ["fr/", "zh-hans/", "zh-hk/"]) assert.ok(existsSync(join(DIST, x, p)), x + p);
});

test("every HTML pattern compiles under the v flag browsers use, and phone and email reject what the provider rejects", () => {
  const patterns = new Set(pages.flatMap((f) => [...readFileSync(f, "utf8").matchAll(/\spattern="([^"]+)"/g)].map((m) => decode(m[1]))));
  assert.ok(patterns.size >= 2);
  for (const p of patterns) new RegExp(`^(?:${p})$`, "v");
  const html = read("book/index.html");
  const re = (name: string) => new RegExp(`^(?:${decode(html.match(new RegExp(`name="${name}"[^>]*\\spattern="([^"]+)"`))![1])})$`, "v");
  const phone = re("phone");
  for (const ok of ["604-555-0148", "(604) 555-0148", "+1 604 555 0148", "604.555.0148"]) assert.ok(phone.test(ok), ok);
  for (const bad of ["123", "555-01", "call me", "((((((("]) assert.ok(!phone.test(bad), bad);
  const email = re("email");
  assert.ok(email.test("a@b.co"));
  for (const bad of ["a@b", "a b@c.d", "@b.co"]) assert.ok(!email.test(bad), bad);
});

test("the sample rating is the mean of the sample reviews", () => {
  const site = JSON.parse(readFileSync("src/data/site.json", "utf8"));
  const mean = site.sample.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / site.sample.reviews.length;
  assert.equal(Math.round(mean * 10) / 10, site.sample.rating);
});

for (const x of ["", "fr/", "zh-hans/", "zh-hk/"]) {
  const lang = read(`${x}index.html`).match(/<html[^>]*\blang="([^"]+)"/)![1];

  test(`${x}reviews/: every review is labelled Sample on screen and in code`, () => {
    const html = read(`${x}reviews/index.html`);
    const items = [...html.matchAll(/<li\b[^>]*data-sample-review[^>]*>([\s\S]*?)<\/li>/g)];
    assert.equal(items.length, 6);
    for (const m of items) assert.ok(text(m[1]).includes(sampleWord[lang]), "Sample tag");
    assert.match(html, /<ul\b[^>]*\bdata-sample\b/);
  });

  test(`${x}privacy/: PIPA s.3 scope and s.10 purposes and contact`, () => {
    const html = read(`${x}privacy/index.html`);
    for (const s of ["s3", "s10", "s10-contact"]) assert.match(html, new RegExp(`data-pipa="${s}"`), s);
    const officer = text(html.match(/data-pipa="s10-contact"[\s\S]*?<\/section>/)![0]);
    assert.ok(officer.includes("604-555-0148") && officer.includes("88 Sample Way"), "privacy officer contact");
    const purposes = html.match(/data-pipa="s10"[\s\S]*?<\/section>/)![0];
    assert.equal([...purposes.matchAll(/<li>/g)].length, 4, "the four purposes");
  });

  test(`${x}book/ and contact/: the privacy line links to the privacy page`, () => {
    for (const p of ["book", "contact"]) {
      const line = read(`${x}${p}/index.html`).match(/<p\b[^>]*data-privacy[^>]*>[\s\S]*?<\/p>/)![0];
      assert.ok(line.includes(`href="${BASE}${x}privacy/"`), p);
    }
  });

  test(`${x}contact/: the quote form can't send anything`, () => {
    const form = read(`${x}contact/index.html`).match(/<form\b[^>]*data-contact-form[^>]*>/)![0];
    assert.match(form, /method="dialog"/);
    assert.doesNotMatch(form, /\saction=/);
  });

  test(`${x}blog/: three posts, each linked`, () => {
    const html = read(`${x}blog/index.html`);
    for (const s of ["misfire-vacuum-leak", "mercedes-service-a-b", "bc-winter-tires"]) assert.ok(html.includes(`href="${BASE}${x}blog/${s}/"`), s);
  });

  // Phases 3a to 3c translated every post, so no page shows the English body or the fallback note.
  test(`${x}blog posts: own body, no fallback note`, () => {
    for (const s of ["misfire-vacuum-leak", "mercedes-service-a-b", "bc-winter-tires"]) {
      const html = read(`${x}blog/${s}/index.html`);
      assert.ok(!html.includes("data-post-fallback"), s);
      assert.match(html, /<div class="post-body">/, s);
    }
  });
}

test("the 3 posts: a diagnosis story, a Mercedes A/B explainer, a BC winter tire guide with 1 Oct to 30 Apr", () => {
  const body = (s: string) => text(read(`blog/${s}/index.html`).match(/<div class="post-body"[\s\S]*?<div class="card post-cta">/)![0]);
  const misfire = body("misfire-vacuum-leak");
  for (const w of ["fuel trim", "smoke test", "misfire"]) assert.ok(misfire.toLowerCase().includes(w), w);
  const ab = body("mercedes-service-a-b");
  for (const w of ["Service A", "Service B", "Brake fluid", "Cabin air filter"]) assert.ok(ab.includes(w), w);
  const tires = body("bc-winter-tires");
  for (const w of ["1 October to 30 April", "3.5 mm", "M+S", "mountain and snowflake"]) assert.ok(tires.includes(w), w);
});

test("the 3 French posts carry their key terms in Canadian French, with no-break spaces", () => {
  const NB = "\u00a0";
  // text() folds every \s, no-break spaces included, so this one keeps them.
  const keepNb = (html: string) => decode(html.replace(/<[^>]*>/g, " ")).replace(/[ \t\r\n]+/g, " ").replaceAll("\u2019", "'");
  const body = (s: string) => keepNb(read(`fr/blog/${s}/index.html`).match(/<div class="post-body"[\s\S]*?<div class="card post-cta">/)![0]);
  const misfire = body("misfire-vacuum-leak");
  for (const w of ["corrections de carburant", "test de fumée", "raté d'allumage", `2${NB}500${NB}tr/min`, `+18${NB}%`, "main-d'œuvre"]) assert.ok(misfire.includes(w), w);
  const ab = body("mercedes-service-a-b");
  for (const w of ["Service A", "Service B", "liquide de frein", "filtre à air de l'habitacle", `16${NB}000${NB}km`]) assert.ok(ab.includes(w), w);
  const tires = body("bc-winter-tires");
  for (const w of ["1er octobre au 30 avril", `3,5${NB}mm`, "M+S", "montagne et du flocon de neige", "pneus d'hiver", `7${NB}°C`]) assert.ok(tires.includes(w), w);
  for (const t of [misfire, ab, tires]) assert.doesNotMatch(t, / [:%»]|« |\d \d{3}\b/, "a breakable space in French typography");
});

test("the 3 简体中文 posts carry their key terms, with Chinese punctuation and the Chinese reading time", () => {
  const page = (s: string) => read(`zh-hans/blog/${s}/index.html`);
  const body = (s: string) => text(page(s).match(/<div class="post-body"[\s\S]*?<div class="card post-cta">/)![0]);
  const misfire = body("misfire-vacuum-leak");
  for (const w of ["燃油修正", "烟雾测试", "缺火", "+18%", "2,500 转"]) assert.ok(misfire.includes(w), w);
  const ab = body("mercedes-service-a-b");
  for (const w of ["Service A", "Service B", "刹车油", "空调滤清器", "16,000 公里", "MB 229.5"]) assert.ok(ab.includes(w), w);
  const tires = body("bc-winter-tires");
  for (const w of ["10 月 1 日至 4 月 30 日", "3.5 毫米", "M+S", "三峰山雪花标志", "冬季轮胎", "7 °C"]) assert.ok(tires.includes(w), w);
  for (const t of [misfire, ab, tires]) assert.doesNotMatch(t, /\p{Script=Han}[,.:;?!()]|[,:;?!(]\p{Script=Han}/u, "half-width punctuation next to Chinese");
  // About 900 characters each: 2 minutes at 400 a minute, not the "1 min" that counting spaces gives.
  for (const s of ["misfire-vacuum-leak", "mercedes-service-a-b", "bc-winter-tires"]) assert.match(text(page(s)), /2 分钟/, s);
});

test("the 3 廣東話 posts are written Cantonese in Traditional characters, with their key terms and reading time", () => {
  const page = (s: string) => read(`zh-hk/blog/${s}/index.html`);
  const body = (s: string) => text(page(s).match(/<div class="post-body"[\s\S]*?<div class="card post-cta">/)![0]);
  const misfire = body("misfire-vacuum-leak");
  for (const w of ["燃油修正", "煙霧測試", "失火", "+18%", "2,500 轉"]) assert.ok(misfire.includes(w), w);
  const ab = body("mercedes-service-a-b");
  for (const w of ["Service A", "Service B", "煞車油", "冷氣隔塵網", "16,000 公里", "MB 229.5"]) assert.ok(ab.includes(w), w);
  const tires = body("bc-winter-tires");
  for (const w of ["10 月 1 日至 4 月 30 日", "3.5 毫米", "M+S", "三峰山雪花標誌", "雪呔", "7 °C"]) assert.ok(tires.includes(w), w);
  for (const t of [misfire, ab, tires]) {
    assert.doesNotMatch(t, /\p{Script=Han}[,.:;?!()]|[,:;?!(]\p{Script=Han}/u, "half-width punctuation next to Chinese");
    for (const w of ["我哋", "嘅", "唔"]) assert.ok(t.includes(w), `written Cantonese: ${w}`);
  }
  for (const s of ["misfire-vacuum-leak", "mercedes-service-a-b", "bc-winter-tires"]) {
    assert.match(page(s), /<html lang="zh-HK"/, s);
    assert.match(text(page(s)), /大約 2 分鐘睇完/, s);
  }
});

test("every page but the 404 links its 4 language versions and x-default, and each target exists", () => {
  const SITE = "https://mingz6.github.io/feinwerk-auto/";
  const prefixes = { en: "", fr: "fr/", "zh-Hans": "zh-hans/", "zh-HK": "zh-hk/", "x-default": "" } as const;
  for (const file of pages) {
    const name = relative(DIST, file).replaceAll("\\", "/");
    if (name === "404.html") continue;
    const route = name.replace(/^(fr|zh-hans|zh-hk)\//, "").replace(/index\.html$/, "");
    const links = [...read(name).matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
    assert.deepEqual(links.map(([l]) => l), Object.keys(prefixes), name);
    for (const [lang, href] of links) {
      assert.equal(href, SITE + prefixes[lang as keyof typeof prefixes] + route, `${name} ${lang}`);
      assert.ok(existsSync(join(DIST, href.slice(SITE.length), "index.html")), `${name} ${lang} → ${href}`);
    }
  }
});

test("404: search box, Call and Book; no canonical, hreflang, og:url or language redirect", () => {
  const html = read("404.html");
  assert.match(html, /<form\b[^>]*role="search"[^>]*>/);
  assert.match(html, /<input\b[^>]*type="search"/);
  assert.match(html, /href="tel:\+16045550148"/);
  assert.ok(html.includes(`href="${BASE}book/"`), "Book");
  assert.doesNotMatch(html, /rel="canonical"|<link\b[^>]*hreflang=|og:url|location\.replace/);
  assert.equal([...html.matchAll(/<li\b[^>]*data-search-item/g)].length, 18 * 4, "index of every page in every language");
});

const pngSize = (file: string) => {
  const b = readFileSync(file);
  assert.equal(b.toString("latin1", 1, 4), "PNG", `${file} is not a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
const ogFile: Record<string, string> = { "en-CA": "en", "fr-CA": "fr", "zh-Hans": "zh-hans", "zh-HK": "zh-hk" };

test("share and icons: every page has the SVG favicon, the 180x180 touch icon and its language's 1200x630 og:image", () => {
  assert.deepEqual(pngSize(join(DIST, "apple-touch-icon.png")), [180, 180]);
  for (const f of Object.values(ogFile)) assert.deepEqual(pngSize(join(DIST, "og", `${f}.png`)), [1200, 630], f);
  for (const file of pages) {
    const html = readFileSync(file, "utf8");
    const lang = html.match(/<html lang="([^"]+)"/)![1];
    assert.match(html, /<link rel="icon" href="\/feinwerk-auto\/favicon\.svg" type="image\/svg\+xml">/, file);
    assert.match(html, /<link rel="apple-touch-icon" href="\/feinwerk-auto\/apple-touch-icon\.png">/, file);
    const og = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
    assert.equal(og, `https://mingz6.github.io/feinwerk-auto/og/${ogFile[lang]}.png`, file);
    assert.match(html, /<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">/, file);
    assert.match(html, /<meta property="og:image:alt" content="[^"]{10,}">/, file);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, file);
  }
});
