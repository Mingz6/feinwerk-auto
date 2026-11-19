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

## Phase 2a

- **One view and one dynamic route per language for the seven service pages.** `src/views/Service.astro` renders any of them from `src/data/services.ts`; `src/pages/[service].astro` and its three twins list the slugs. The i18n twin test still fails if a language is missing.
- **The booking contract is `make`, `service` and `model`** (`src/lib/book.ts`, with unit tests). Every Book button carries it twice: in its `/book/?…` href (works without JavaScript) and in `data-book-make`, `data-book-service`, `data-book-model` for the Phase 2b sheet. `parseBookQuery` drops unknown values. `model` is the block id (n20, airmatic, dsg), a hint for booking step 1.
- **"Model" blocks must carry a make; tire and inspection blocks carry only a service.** Those fit any make, and the visitor picks it in step 1. `tests/dist.test.ts` enforces both.
- **Home tiles now open the make and service pages**, PLAN's "tap → service list → booking". "Other European" has no page and opens booking with `make=other&service=diagnosis`.
- **No "dealer" wording anywhere, the home comparison included.** PLAN's wireframe calls section 5 "Independent vs dealer", but its Demo safety rule bans the wording; the rule wins, and the copy now says "brand service centre" in all four languages. The test scans visible text and meta, title, alt and aria-label values on every page.
- **Logo test by allowlist.** The favicon is the only image file in dist/; inline SVGs must be `aria-hidden` and hold no `<text>`, `<image>` or `<use>`. A photo gets added to the allowlist only after a look that badges and plates are blurred.
- **Prices are sample ranges, formatted by `Intl` in the page language**, each with the Sample tag (`data-sample-price`, tested). Field name `samplePrice` in code.
- **The fleet request form is `method="dialog"` outside a dialog**, so it can never submit anywhere, with or without JavaScript. With JavaScript a valid form swaps for "This is a demo. Nothing was sent." Without it, a `<noscript>` line gives the phone number. Labels and `autocomplete` on every field, inputs at 16 px.
- **Engine facts are written as tendencies** ("can slip", "on early engines") and the page says prices vary by car. They come from general workshop knowledge, not a cited source: a real shop should review them before launch.
- **BC winter tire dates are shown as PLAN states them** (1 October to 30 April on signed highways) with a note to check the signs and DriveBC.
- **Services menu is a `<details>` dropdown** like the language menu (same one-open-at-a-time script); on phones the menu lists the seven pages first.

## Phase 2b

- **One flow, two hosts.** `src/components/BookingFlow.astro` sits in a `<dialog>` sheet on every page except `/book/`, and inline on `/book/`. Any link to this language's `/book/` opens the sheet (a Cmd/Ctrl/Shift click still navigates), so Book buttons keep working without JavaScript.
- **No-JavaScript booking sends nothing.** On `/book/` the form sits in an open, non-modal `<dialog>`. `method="dialog"` closes it on a valid submit (the browser still runs `required` and type checks), and CSS shows the confirmation. A GET form to a "thanks" page would have put name, phone and email in a URL on GitHub's servers, which would make "Nothing was sent" untrue. Without JavaScript the day is a date field and the time a list; the page says we call to confirm.
- **The sheet opens at the first step that isn't filled in.** From a make page's engine block (make and service known) that is step 3, day and time; from the header or bottom bar it is step 1. Back keeps every choice. The model field takes the block's name (the Book button's hidden text) or the `model` id in capitals.
- **Slots: every 30 minutes, the last drop-off an hour before closing, today only from two hours out.** Weekdays 08:00 to 17:00, Saturday 09:00 to 14:00, the next 6 open days. Days are stepped as calendar dates and slots are wall-clock times in America/Vancouver; only the `.ics` file turns a slot into an instant (`zonedToUtc`, which asks Intl). So a daylight-saving change can't move a slot or drop a day.
- **The 1 Nov 2026 tests hold under either time-zone rule.** Phase 1 found Node 26 ending daylight saving on 1 Nov 2026 while Chromium 159 keeps UTC-7. The tests check what never changes (Monday 2 Nov keeps 08:00 to 17:00, every slot reads back as its own date and time, the repeated hour still leads to Monday) and pin the instants on 2025, which every database agrees on.
- **The `.ics` file is written in UTC** (no VTIMEZONE block needed, valid RFC 5545), one hour long, built in the browser as a Blob link. It carries "This is a demo. Nothing was sent." in its description.
- **BookingProvider** (`src/lib/booking.ts`): `submit(request)` resolves `confirmed` (demo, nothing sent), `sent` (form) or `handoff` (tekmetric), and rejects with the bad field names before any side effect. `kind: "external"` (Tekmetric) leaves Book links alone so a shop can point them at its Tekmetric page; nothing personal goes in that URL. The config is one line in `src/data/booking.ts`; the contract tests run all three with spies on `fetch` and `window.open`.
- **Privacy and consent (PLAN: BC PIPA s.10, CASL ss.6(6) and 10(10)).** Under the fields: what we collect, why (this visit only) and who answers questions (privacy officer, the sample phone), PIPA s.10's purpose and contact. The reminders box is optional and unticked, and its label names the shop, its address and phone and says you can unsubscribe, which CASL asks of an express-consent request. The booking confirmation itself is a transactional message, so it needs no consent box. A template, not legal advice: a real shop's privacy officer should read it.
- **Page JavaScript is measured over dist in CI** (`tests/dist.test.ts`): inline scripts plus each module and its imports, gzipped. Largest page 5.3 KB against the 15 KB bar. The i18n JSON block isn't counted: it is data, not code.
- **Day and time chips hide the radio dot.** The input stays (keyboard, screen readers, form data); the chip fills with the button colour when picked. A visible dot made "10:30 a.m." wrap on a 390 px phone.
- **`.btn` resets its background.** Until now every `.btn` was a link; a `<button class="btn">` showed the browser's grey in dark theme (axe: 4.46:1).
- **The sheet's axe test runs with reduced motion.** It slides in over 0.25 s, and axe reads half-faded text as low contrast mid-animation (the same reason Phase 1 has no scroll reveals).
- **No new photo slots.** The booking flow uses no images.
