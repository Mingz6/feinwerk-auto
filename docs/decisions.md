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
