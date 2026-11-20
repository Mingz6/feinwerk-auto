// Draws the share images: a 1200x630 Open Graph card per language (public/og/{locale}.png)
// and the 180x180 apple-touch-icon. Line art and type only, no photos.
// Usage: node scripts/share-cards.mjs. Run on a Mac so the Chinese cards use PingFang; commit the PNGs.
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { en } from "../src/i18n/en.ts";
import { fr } from "../src/i18n/fr.ts";
import { zhHans } from "../src/i18n/zh-hans.ts";
import { zhHk } from "../src/i18n/zh-hk.ts";

const DICTS = { en, fr, "zh-hans": zhHans, "zh-hk": zhHk };
const CJK = { "zh-hans": '"PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei"', "zh-hk": '"PingFang HK", "Noto Sans CJK TC", "Microsoft JhengHei"' };
const font = (pkg, file) => readFileSync(new URL(`../node_modules/${pkg}/files/${file}`, import.meta.url)).toString("base64");
const ARCHIVO = font("@fontsource-variable/archivo", "archivo-latin-wght-normal.woff2");
const INTER = font("@fontsource-variable/inter", "inter-latin-wght-normal.woff2");

// Tokens from src/styles/tokens.css (dark theme): garage bg, text, muted, amber signal.
const C = { bg: "#0C1015", surface: "#171B21", text: "#E9EBEF", muted: "#A5ABB5", signal: "#F9AD26", line: "#2B3038" };
const MARK = `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="16" cy="16" r="13"/><path d="M12 23V9h9M12 16h7" stroke-linecap="square"/></svg>`;
// The "lift" drawing from src/components/Art.astro.
const LIFT = `<svg viewBox="0 0 320 180" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M96 12h128M110 12v6M210 12v6M0 172h320"/><path d="M18 36v136M302 36v136M10 36h16M294 36h16M18 128h94M302 128h-92M100 128v-14M220 128v-14"/>
<path d="M34 108v-12q0-8 10-10l40-6 32-22q6-4 16-4h68q10 0 18 6l30 20 38 6q10 2 10 12v10"/><path d="M122 62l-14 18h56V62ZM172 62v18h64l-22-18Z"/>
<circle cx="92" cy="108" r="16"/><circle cx="92" cy="108" r="6"/><circle cx="236" cy="108" r="16"/><circle cx="236" cy="108" r="6"/>
<path d="M108 108h112M34 108h42M252 108h34"/><path d="M60 172v-8M260 172v-8M150 172v-4M170 172v-4" stroke-dasharray="2 4"/></svg>`;

const head = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Archivo; src: url(data:font/woff2;base64,${ARCHIVO}) format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; }
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${INTER}) format("woff2"); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
html, body { background: ${C.bg}; color: ${C.text}; }
${body}</style>`;

const card = (locale) => {
  const t = DICTS[locale];
  const tagline = t["home.title"].split("|").pop().trim();
  const body = CJK[locale] ? `${CJK[locale]}, Inter, sans-serif` : "Inter, sans-serif";
  return `${head(`
body { width: 1200px; height: 630px; padding: 72px 80px; display: grid; grid-template-columns: 1fr 420px; gap: 48px; font-family: ${body}; overflow: hidden;
  background-image: linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px); background-size: 40px 40px; background-position: -1px -1px; }
.copy { display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 20px; font: 800 52px/1 Archivo, sans-serif; font-stretch: 125%; letter-spacing: 0.02em; text-transform: uppercase; }
.brand svg { width: 64px; height: 64px; color: ${C.signal}; flex: none; }
.eyebrow { margin-top: 56px; font-size: 26px; color: ${C.muted}; letter-spacing: 0.02em; }
h1 { margin-top: 16px; font: 700 58px/1.12 ${CJK[locale] ? body : "Archivo, sans-serif"}; ${CJK[locale] ? "" : "font-stretch: 100%;"} max-width: 15ch; text-wrap: balance; }
.tag { align-self: flex-start; padding: 10px 18px; border: 2px solid ${C.signal}; border-radius: 6px; color: ${C.signal}; font-size: 24px; font-weight: 600; letter-spacing: 0.04em; }
.art { align-self: center; color: ${C.muted}; background: ${C.bg}; padding: 24px 0; }
.art svg { width: 420px; height: auto; display: block; }
`)}<body><div class="copy"><div><div class="brand">${MARK}<span>Feinwerk Auto</span></div>
<p class="eyebrow">${t["hero.eyebrow"]}</p><h1>${tagline}</h1></div>
<p class="tag">${t["strip.label"]}</p></div><div class="art">${LIFT}</div></body></html>`;
};

const icon = `${head(`body { width: 180px; height: 180px; display: grid; place-items: center; }
svg { width: 120px; height: 120px; color: ${C.text}; }`)}<body>${MARK}</body></html>`;

mkdirSync(new URL("../public/og/", import.meta.url), { recursive: true });
const browser = await chromium.launch();
const shoot = async (html, size, path) => {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(`../public/${path}`, import.meta.url).pathname, type: "png" });
  await page.close();
  console.log(path);
};
for (const locale of Object.keys(DICTS)) await shoot(card(locale), { width: 1200, height: 630 }, `og/${locale}.png`);
await shoot(icon, { width: 180, height: 180 }, "apple-touch-icon.png");
await browser.close();
