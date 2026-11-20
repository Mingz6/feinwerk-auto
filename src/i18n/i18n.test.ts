import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { en } from "./en.ts";
import { fr } from "./fr.ts";
import { zhHans } from "./zh-hans.ts";
import { zhHk } from "./zh-hk.ts";

const others: Record<string, Record<string, string>> = { fr, "zh-hans": zhHans, "zh-hk": zhHk };
const enKeys = Object.keys(en).sort();
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

for (const [locale, dict] of Object.entries(others)) {
  test(`${locale} has exactly the English keys`, () => {
    const keys = Object.keys(dict).sort();
    assert.deepEqual(enKeys.filter((k) => !keys.includes(k)), [], "missing");
    assert.deepEqual(keys.filter((k) => !enKeys.includes(k)), [], "extra");
  });

  test(`${locale} {placeholders} match English`, () => {
    for (const key of enKeys) assert.deepEqual(placeholders(dict[key] ?? ""), placeholders(en[key as keyof typeof en]), key);
  });
}

test("no string is empty in any language", () => {
  for (const [locale, dict] of Object.entries({ en, ...others })) {
    for (const [key, value] of Object.entries(dict)) assert.ok(value.trim(), `${locale} ${key}`);
  }
});

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

test("every page exists in all four languages", () => {
  const pages = walk("src/pages").map((f) => relative("src/pages", f).replaceAll("\\", "/"));
  const prefixes = ["fr/", "zh-hans/", "zh-hk/"];
  const english = pages.filter((p) => p !== "404.astro" && !prefixes.some((x) => p.startsWith(x)));
  assert.ok(english.length > 0);
  for (const p of english) for (const x of prefixes) assert.ok(pages.includes(x + p), `${x}${p} is missing`);
  for (const p of pages.filter((p) => prefixes.some((x) => p.startsWith(x)))) {
    assert.ok(english.includes(p.replace(/^[^/]+\//, "")), `${p} has no English page`);
  }
});

/** Remove {expressions}, including nested ones, so only literal markup is left. */
const stripBraces = (s: string): string => {
  let out = "";
  let depth = 0;
  for (const c of s) {
    if (c === "{") depth++;
    else if (c === "}") depth = Math.max(0, depth - 1);
    else if (depth === 0) out += c;
  }
  return out;
};

test("no hard-coded words in components, views, layouts or the 404", () => {
  const files = ["src/components", "src/views", "src/layouts"].flatMap(walk).concat("src/pages/404.astro").filter((f) => f.endsWith(".astro"));
  for (const file of files) {
    let s = readFileSync(file, "utf8").replace(/^---[\s\S]*?\n---/, "");
    s = s.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "").replace(/<!--[\s\S]*?-->/g, "");
    s = stripBraces(s);
    const attrs = [...s.matchAll(/\b(aria-label|title|alt|placeholder)="([^"]*)"/g)].map((m) => m[2]).filter((v) => /\p{L}{2,}/u.test(v));
    const words = s.replace(/<[^>]*>/g, " ").split(/\s+/).filter((w) => /\p{L}{2,}/u.test(w));
    assert.deepEqual([...attrs, ...words], [], file);
  }
});

// Common characters that exist in only one script. The two Chinese sources are written separately
// (PLAN.md: no converter), so a stray character from the other script is a copy-paste slip.
const SIMPLIFIED_ONLY = /[们这说时间车预约话电务维检价钱联让还进过样点发动机为么会对现开关门问题东长书买卖认识听写读请谢应该没给轮换灯线气压节网页码号单张项质满实际签经历证报]/u;
const TRADITIONAL_ONLY = /[們這說時間車預約話電務維檢價錢聯讓還進過樣點發動機為麼會對現開關門問題東長書買賣認識聽寫讀請謝應該沒給輪換燈線氣壓節網頁碼號單張項質滿實際簽經歷證報]/u;
const CANTONESE_ONLY = /[嘅哋唔咗喺嚟冇啲嗰係佢睇揸攞搵]/u;
const posts = (locale: string) => readdirSync(join("src/content/blog", locale)).map((f) => readFileSync(join("src/content/blog", locale, f), "utf8"));

test("every post exists in all four languages", () => {
  const en = readdirSync("src/content/blog/en").sort();
  for (const locale of ["fr", "zh-hans", "zh-hk"]) assert.deepEqual(readdirSync(join("src/content/blog", locale)).sort(), en, locale);
});

test("廣東話 is Traditional written Cantonese, and 简体中文 is Simplified Mandarin, in dictionaries and posts", () => {
  const hk = [...Object.entries(zhHk), ...posts("zh-hk").map((p, i) => [`post ${i}`, p])];
  for (const [key, value] of hk) assert.doesNotMatch(value, SIMPLIFIED_ONLY, `zh-hk ${key}`);
  const hans = [...Object.entries(zhHans), ...posts("zh-hans").map((p, i) => [`post ${i}`, p])];
  for (const [key, value] of hans) {
    assert.doesNotMatch(value, TRADITIONAL_ONLY, `zh-hans ${key}`);
    assert.doesNotMatch(value, CANTONESE_ONLY, `zh-hans ${key}`);
  }
  // Mandarin grammar words have Cantonese ones on this site: 我們→我哋, 這→呢, 沒有→冇, 什麼→乜嘢/咩.
  for (const [key, value] of hk) assert.doesNotMatch(value, /我們|你們|他們|這|沒有|什麼|甚麼/u, `zh-hk ${key}`);
  for (const p of posts("zh-hk")) for (const w of ["我哋", "嘅", "唔", "係"]) assert.ok(p.includes(w), `a zh-hk post has no ${w}`);
});

test("廣東話 calls a spark plug 火嘴 everywhere, the word Hong Kong mechanics use", () => {
  const all = [...Object.values(zhHk), ...posts("zh-hk")].join("\n");
  assert.ok(zhHk["bmw.s55.job"].includes("火嘴"));
  assert.doesNotMatch(all, /火花塞/u);
});

test("one Chinese name for the mountain and snowflake symbol, on the tires page and in the post", () => {
  for (const [dict, posts_, term] of [[zhHans, posts("zh-hans"), "三峰山雪花标志"], [zhHk, posts("zh-hk"), "三峰山雪花標誌"]] as const) {
    const all = [...Object.values(dict), ...posts_].join("\n");
    assert.ok(dict["tires.rules.1"].includes(term), term);
    assert.doesNotMatch(all, /雪山雪花|三峰山同雪花|三峰山和雪花/u);
  }
});
