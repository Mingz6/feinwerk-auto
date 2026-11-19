import type { ClientStrings } from "../i18n";

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

const languageMenu = () => {
  const menu = document.querySelector<HTMLDetailsElement>("[data-lang-menu]");
  if (!menu) return;
  // A manual choice is stored and wins over the browser's languages on the next English page.
  menu.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>("[data-set-lang]");
    if (a?.dataset.setLang) store.set("feinwerk-lang", a.dataset.setLang);
  });
  document.addEventListener("click", (e) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }
  });
};

theme();
languageMenu();
