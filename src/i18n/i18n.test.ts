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
