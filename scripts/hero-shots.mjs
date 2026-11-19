// Screenshots of both hero variants (PLAN.md Phase 1): 4 languages x 2 themes x 2 viewports each,
// plus a full-page phone shot of each. Usage: node scripts/hero-shots.mjs [outDir]. Rebuilds dist/ with the default hero at the end.
import { execSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const OUT = process.argv[2] ?? "shots";
const PORT = 4330;
const URL = `http://localhost:${PORT}/feinwerk-auto/`;
const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const LANGS = { en: "", fr: "fr/", "zh-hans": "zh-hans/", "zh-hk": "zh-hk/" };
mkdirSync(OUT, { recursive: true });

const up = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(URL)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("preview did not start");
};

for (const hero of ["full", "split"]) {
  execSync("npx astro build", { stdio: "ignore", env: { ...process.env, PUBLIC_HERO: hero } });
  // Astro 7 runs one preview per project in the background locally; stop it so this one gets PORT.
  try {
    execSync("npx astro preview stop", { stdio: "ignore" });
  } catch {}
  const server = spawn("npx", ["astro", "preview", "--port", String(PORT)], { stdio: "ignore" });
  try {
    await up();
    const browser = await chromium.launch();
    for (const [lang, prefix] of Object.entries(LANGS)) {
      for (const theme of ["light", "dark"]) {
        for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
          const ctx = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: "reduce", locale: "en-CA" });
          await ctx.addInitScript(() => localStorage.setItem("feinwerk-lang", "en"));
          const page = await ctx.newPage();
          await page.goto(URL + prefix);
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: `${OUT}/hero-${hero}-${lang}-${theme}-${vp}.png` });
          if (lang === "en" && vp === "phone") await page.screenshot({ path: `${OUT}/home-${hero}-en-${theme}-phone-full.png`, fullPage: true });
          await ctx.close();
        }
      }
    }
    await browser.close();
  } finally {
    server.kill();
  }
}
execSync("npx astro build", { stdio: "ignore" });
console.log(`screenshots in ${OUT}/`);
