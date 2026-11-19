import type { Page } from "@playwright/test";

/** Every layout fault longer or wider text could cause, as a list of readable strings. Shared by the French and Chinese specs. */
export const layoutFaults = (page: Page) =>
  page.evaluate(() => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) out.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${vw}`);
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
    };
    const name = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${(el.textContent ?? "").trim().slice(0, 40)}"`;
    for (const el of document.querySelectorAll(".btn, .chip, button, .choice, .bottom-bar a, .header-nav a")) {
      if (!visible(el) || el.closest(".vh, [hidden], dialog:not([open])")) continue;
      const h = el as HTMLElement;
      if (h.scrollWidth > h.clientWidth + 1) out.push(`clipped: ${name(el)} ${h.scrollWidth} > ${h.clientWidth}`);
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) out.push(`off screen: ${name(el)} ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`);
    }
    for (const el of document.querySelectorAll('a[href^="tel:"], .phone')) {
      if (!visible(el) || el.closest(".vh, [hidden], dialog:not([open])")) continue;
      const lines = new Set([...el.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      const text = (el.textContent ?? "").trim();
      // A wrapped number shows as two line boxes, or as a single box taller than one line of its text.
      const style = getComputedStyle(el);
      const tall = el.getBoundingClientRect().height > parseFloat(style.lineHeight || "0") * 1.6 && style.display === "inline";
      if (/\d{3}.\d{4}/.test(text) && (lines.size > 1 || tall)) out.push(`phone wraps: ${name(el)}`);
    }
    return out;
  });

export const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];
