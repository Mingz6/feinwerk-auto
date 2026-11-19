# Decisions

PLAN.md's Decisions are settled; they are repeated here so each can be revisited on its own. Later entries are calls made while building.

## From PLAN.md

- **Fictional brand "Feinwerk Auto", Latin name in every language.** Removes the legal risk of a real shop's name; one Latin name avoids clashing with a Chinese trade name already in use.
- **Astro 7 on GitHub Pages, no client framework.** Same stack as HYK, so its language detection, theme and test code carry over; static output keeps JavaScript small and hosting free.
- **Four separate dictionaries, Cantonese tagged `zh-HK`.** Cantonese isn't Mandarin in other characters, so a converter would produce wrong text; `yue` isn't accepted in hreflang.
- **Explicit light and dark tokens, no `light-dark()`.** iOS Safari before 17.5 ignores it, which is inside the support range.
- **Booking ships with a `demo` provider behind an interface.** No real calendar; the interface shows how Tekmetric or a form service plugs in.

## Phase 0

- **Locale ids match the URL prefixes** (`en`, `fr`, `zh-hans`, `zh-hk`); `lang` and `hreflang` come from maps in `src/i18n/index.ts`. One id per language everywhere, no case juggling between URL and code.
- **`yue` with any script goes to 廣東話.** PLAN's row lists `yue` under Cantonese; we only have Cantonese in Traditional characters.
- **A script subtag beats a region** (`zh-Hans-HK` is Simplified, `zh-Hant-CN` is Cantonese). The script says what the reader can read.
- **The disclaimer lives in the four dictionaries, not `site.json`.** It has to be translated; `site.json` keeps name, sample contact and hours.
- **CI runs once per push.** `ci.yml` runs on every push except main and phase-*, and on pull requests; `deploy.yml` calls it as its first job on main and phase-*, so a deploy needs every gate green and nothing runs twice.
- **The `pages` concurrency group cancels in progress.** One Pages site serves main and phase-*, so only the newest push matters (HYK does the same).
- **Phone text inside `tel:` links uses non-breaking hyphens and spaces** (`nb()` in `src/lib/site.ts`). html-validate's `tel-non-breaking` rule, and it matches "phone numbers never wrap".
- **The theme button is hidden without JavaScript.** It can't work without it; the head script adds `.js` before first paint, so there is no layout shift.
- **No-flash proof in Playwright**: an init script records `data-theme` when `<body>` is created; set by then means set before first paint.
- **Lighthouse runs against `astro preview` on 127.0.0.1**, not `staticDistDir`, because every URL carries the `/feinwerk-auto/` base. Reports stay on the runner (`filesystem`), uploaded as an artifact only on failure.
- **Not in Phase 0, by PLAN's phase table**: self-hosted fonts (Phase 1 design system; token stacks already name Archivo, Inter and IBM Plex Mono with system fallbacks), screenshot baselines (Phase 4: they are platform-specific and the pages are placeholders), Open Graph image and apple-touch-icon (Phase 4 share cards).
- **The demo-safety grep is not a CI step.** Its pattern is the list of real shop names, which must never be written into a file in this public repo; it runs by hand before every push.

## Phase 1

- **Hero: split, not full-bleed.** Both are built (`src/components/home/HeroSplit.astro`, `HeroFull.astro`; `PUBLIC_HERO=full npm run build` renders the other) and were screenshotted in 4 languages, 2 themes and 2 viewports (`node scripts/hero-shots.mjs`). On a 390 × 844 phone, split shows the headline, both chips, Book and the top of the sample work order in the first screen, and the work order is the product promise (approve each line). Full-bleed needs a strong photo to earn its band, and there is none until Ming's shots exist; revisit then.
- **Fonts through Astro 7's Fonts API, local provider, files from fontsource.** Self-hosted under `/_astro/fonts/` with metric-matched fallback faces (Arial, Courier New), which keeps the swap from shifting layout. Only the latin files of Archivo and Inter are preloaded, through `fontData` in `Base.astro`: `<Font preload>` can't filter local variants by subset, and latin-ext would add about 170 KB the English page never uses. IBM Plex Mono (500 only) is not preloaded.
- **Archivo with the width axis (90 KB latin) rather than weight only (35 KB).** PLAN's design direction asks for wide cuts; headlines use `font-stretch: 110-125%`.
- **The open/closed chip asks the browser's time-zone database for America/Vancouver.** No offsets in code. Databases disagree about BC from November 2026: Node 26 (tzdata 2026a) returns to PST on 1 Nov 2026, Chromium 159 keeps UTC-7 all year. The daylight-saving tests pin the 2 Nov 2025 switch, which every version agrees on, so CI doesn't depend on the runner's tzdata.
- **Without JavaScript the chip reads "See hours" and links to the hours table.** The table is built at build time; JavaScript only highlights today (`aria-current="date"`) and fills the chip, refreshed each minute.
- **Links wait for Phase 2 pages.** Make and service tiles open `/book/?make=…` or `?service=…`; header items jump to home sections; blog cards are not links yet. The link-check gate fails on any link to a page that doesn't exist.
- **Directions link only when `site.mapsUrl` is set** (`site.private.json`). A maps link for a made-up address would send someone to a real place. The map is a drawn SVG.
- **Reviews and blog cards scroll sideways on phones** (scroll-snap rows, focusable so the keyboard can scroll them) and sit in a grid from 48rem. It keeps the home page about 6 phone screens (6.6 at 390 × 844, asserted 4.5-7.5 in `tests/e2e/home.spec.ts`).
- **Phones get Call from the bottom bar.** The header phone number shows from 40rem, the hero's phone button too; the bar hides from 64rem, where the header carries nav, Book and the number.
- **New strings have first drafts in French, 简体中文 and 廣東話** so the completeness gate stays on. Phase 3 owns them; the native-speaker pass is still open.
- **No scroll-driven section reveals yet.** Content faded by a view timeline shows half-transparent in full-page screenshots and in axe's contrast check. Only the hero drawing fades in; text never animates, so LCP isn't delayed.
- **`--ok` token for the open dot** (green, decorative: the word "Open" carries the meaning).
- **`PW_PORT` in `playwright.config.ts`.** Locally Astro 7 runs `astro preview` as one background server per project, and `reuseExistingServer` would silently test another checkout's build on 4321.
