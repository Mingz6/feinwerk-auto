import type { ClientStrings } from "../i18n";
import { describeStatus, getStatus, zonedNow } from "../lib/hours";
import { booking } from "./booking";

const strings: ClientStrings = JSON.parse(document.getElementById("i18n")!.textContent!);
const root = document.documentElement;

const store = {
  get: (k: string): string | null => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string | null) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* private mode: the choice just won't persist */
    }
  },
};

type Mode = "auto" | "light" | "dark";
// Same values as --bg in src/styles/tokens.css and THEME_COLOR in Base.astro.
const THEME_COLOR = { light: "#F9FAFC", dark: "#0C1015" };

const theme = () => {
  const btn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (!btn) return;
  const order: Mode[] = ["auto", "light", "dark"];
  const read = (): Mode => (root.dataset.theme === "light" || root.dataset.theme === "dark" ? root.dataset.theme : "auto");

  const paint = (mode: Mode) => {
    btn.setAttribute("aria-label", `${strings.theme.label}: ${strings.theme[mode]}`);
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
      const own = m.media.includes("dark") ? "dark" : "light";
      m.content = THEME_COLOR[mode === "auto" ? own : mode];
    });
  };
  const apply = (mode: Mode) => {
    if (mode === "auto") delete root.dataset.theme;
    else root.dataset.theme = mode;
    store.set("feinwerk-theme", mode === "auto" ? null : mode);
    paint(mode);
  };

  paint(read());
  btn.addEventListener("click", () => apply(order[(order.indexOf(read()) + 1) % order.length]));
};

const menus = () => {
  // A manual language choice is stored and wins over the browser's languages on the next English page.
  document.querySelector("[data-lang-menu]")?.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>("[data-set-lang]");
    if (a?.dataset.setLang) store.set("feinwerk-lang", a.dataset.setLang);
  });
  const all = [...document.querySelectorAll<HTMLDetailsElement>("[data-menu]")];
  // One menu open at a time; a click outside, a same-page link or Escape closes it.
  document.addEventListener("click", (e) => {
    for (const m of all) {
      const inside = m.contains(e.target as Node);
      if (m.open && (!inside || (e.target as Element).closest("a"))) m.open = false;
    }
  });
  for (const m of all) {
    m.addEventListener("toggle", () => {
      if (m.open) for (const o of all) if (o !== m) o.open = false;
    });
    m.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && m.open) {
        m.open = false;
        m.querySelector("summary")?.focus();
      }
    });
  }
};

/** Live open/closed chip and today's row in the hours table, on the Vancouver clock. */
const shopStatus = () => {
  const chips = document.querySelectorAll<HTMLElement>("[data-status]");
  const today = document.querySelectorAll<HTMLElement>("[data-weekday]");
  if (!chips.length && !today.length) return;
  const { hours, timeZone } = strings.shop;
  const paint = () => {
    const now = new Date();
    const s = getStatus(now, hours, timeZone);
    const [label, detail] = describeStatus(s, strings.status, strings.lang);
    chips.forEach((c) => {
      c.dataset.state = s.open ? "open" : "closed";
      c.querySelector("[data-status-label]")!.textContent = label;
      c.querySelector("[data-status-detail]")!.textContent = ` · ${detail}`;
    });
    const { weekday } = zonedNow(now, timeZone);
    today.forEach((row) => {
      const on = Number(row.dataset.weekday) === weekday;
      row.classList.toggle("is-today", on);
      if (on) row.setAttribute("aria-current", "date");
      else row.removeAttribute("aria-current");
      row.querySelector<HTMLElement>(".today-tag")?.toggleAttribute("hidden", !on);
    });
  };
  paint();
  setInterval(paint, 60_000);
};

// Demo forms (fleet request): nothing is ever sent. method="dialog" outside a <dialog> never submits,
// so without JavaScript the button does nothing; with it, a valid form swaps for the "demo" note.
const demoForms = () => {
  document.querySelectorAll<HTMLFormElement>("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const sent = form.parentElement?.querySelector<HTMLElement>("[data-demo-sent]");
      if (!sent) return;
      form.hidden = true;
      sent.hidden = false;
      sent.focus();
    });
  });
};

theme();
menus();
shopStatus();
demoForms();
booking(strings);
