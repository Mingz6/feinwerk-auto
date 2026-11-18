---
title: "Feinwerk Auto: website demo plan"
date: 2026-11-18
status: plan
type: demo (fictional business)
baseline: "/website skill (brain copilot/skills/website); reference build ~/code/playground/hyk-restaurant"
---

# Feinwerk Auto: website demo plan

Plan: a demo site for a fictional European car repair shop in Vancouver: mobile first, 4 languages, Auto/Light/Dark themes, a demo booking flow → CI (continuous integration) gates on every push plus a pass on a real iPhone and Android phone → nothing from any real business ships; name, copy, photos, contact details and reviews are original or sample.

## What this is

A design concept and portfolio piece, built to the bar a FAANG (Facebook, Apple, Amazon, Netflix, Google) front-end team would ship. There is no client and no client conversation.
The product thinking comes from a scan of the Lower Mainland market in Nov 2026 (private notes in `research/`, gitignored): of six local European specialists checked, one had real online booking and sticky mobile Call/Book buttons; the rest relied on the phone, a mailto link or a request form.
So the demo is built around three things: book in under a minute on a phone, honest proof (inspection photos, warranty in writing, reviews), and pages per make and engine that answer real questions.

## Demo safety

Every item here is a requirement, checked before anything is pushed to a public repo.

| Risk | Rule |
|---|---|
| Name or brand confusion | Fictional name **Feinwerk Auto** (German for precision mechanics); no auto shop of that name found in Canada (web search, 18 Nov 2026, not a trademark search). The Latin name stays in every language and only the descriptor is translated ("Feinwerk 欧洲车专修"). 精匠汽车 was dropped: a Wuhan repair company uses it |
| Someone calls or visits a real place | Phone `+1 604-555-0148` (the 555-0100 to 555-0199 range is reserved for fiction) and a made-up address, "88 Sample Way, Vancouver, BC" |
| Copied content | All copy written for this demo. Nothing from any real shop's site, blog or reviews |
| Photo rights | Only photos Ming took himself, with maker badges and plates blurred, or SVG (Scalable Vector Graphics) line drawings made for the demo. No stock, no AI-generated images, nothing downloaded |
| Fake reviews | Reviews and the rating are labelled "Sample" on screen and in the code |
| Mistaken for a real business | A "Design concept" strip at the top (an `<aside>` landmark) and a footer disclaimer: fictional business, not affiliated with any company or vehicle manufacturer. `noindex, nofollow` on every page |
| Manufacturer trademarks | Make names as plain text that describes the service ("BMW repair"). No manufacturer logos, no "authorized" or "dealer" wording |
| Real details leaking into the repo | Real contact details, if ever needed for an in-person showing, go only in `src/data/site.private.json` (gitignored, never deployed; the HYK pattern). The repo name and every public file stay free of real business names |

## Baseline requirements

These come from the `/website` skill, so every demo site Ming builds gets the same baseline. This plan adds the auto-shop specifics on top.

| Area | Requirement |
|---|---|
| Mobile first | Base CSS (Cascading Style Sheets) is written for a 360-390 px phone; `min-width` queries and container queries add larger layouts. Bottom action bar on phones (Call · Text · Book) with safe-area insets, slimmer in landscape. Tap targets at least 44 px. Inputs at 16 px so iOS doesn't zoom. Phone numbers never wrap |
| Themes | Auto (follows the system), Light, Dark. One button cycles them and the choice is remembered. Set by an inline script before first paint, so no flash. Tokens written out for both themes (no `light-dark()`, which iOS Safari before 17.5 ignores, a bug fixed in HYK). `theme-color` meta follows the theme. Print always uses light |
| Languages | English, Français, 简体中文, 廣東話. Picked from the browser's language list on the first visit; a manual choice is remembered and wins; explicit language URLs never redirect; without JavaScript the English page simply stays |
| Accessibility | WCAG (Web Content Accessibility Guidelines) 2.2 AA: skip link, landmarks, visible focus, 4.5:1 text contrast in both themes, labels and `autocomplete` on every field, motion off under `prefers-reduced-motion`, axe at zero violations |
| Performance | No client-side framework. JavaScript under 15 KB gzipped per page. First view under 500 KB on the homepage. Self-hosted Latin fonts, preloaded; Chinese uses system fonts (PingFang, Noto Sans CJK, Microsoft YaHei/JhengHei) |
| Works without JavaScript | Every page reads and navigates; booking falls back from the sheet to the `/book/` page |
| Sharing and print | Open Graph card per language, apple-touch-icon, SVG favicon; print stylesheet for hours, address and the booking summary |
| Demo hygiene | Concept strip, disclaimer, `noindex`, placeholder contact details, private override file (table above) |

## Languages

| Language | URL prefix | `lang` and `hreflang` | Source | Notes |
|---|---|---|---|---|
| English (Canada) | `/` | `en-CA` / `en` | Written first | Canadian spelling: colour, centre, tire |
| Français (Canada) | `/fr/` | `fr-CA` / `fr` | Its own dictionary | Canadian usage (courriel, pneus d'hiver); times as "8 h 30" through `Intl`; strings run about 20-30% longer, so every button and chip is tested with the French text |
| 简体中文 | `/zh-hans/` | `zh-Hans` | Its own dictionary | Written Mandarin |
| 廣東話 (Traditional characters) | `/zh-hk/` | `zh-HK` | Its own dictionary | Written Cantonese (我哋, 嘅, 唔使), not standard written Chinese. Google's hreflang accepts only ISO 639-1 language codes, so `yue` is out and `zh-HK` is the tag (Google localized-versions docs). `zh-HK` should also pick the Cantonese voice in Apple's screen reader: check with VoiceOver in Phase 4 |

- **Detection order**, first match in `navigator.languages`: `en*` → English; `fr*` → French; `zh-Hans`, `zh-CN`, `zh-SG` or plain `zh` → 简体中文; `zh-Hant`, `zh-HK`, `zh-MO`, `zh-TW` or `yue` → 廣東話; anything else → English. Taiwan readers get Cantonese text in Traditional characters, an accepted trade-off for a Vancouver audience.
- **Why four dictionaries and no converter for Chinese**: HYK generated Simplified from Traditional with OpenCC because both were standard written Chinese. Cantonese and Mandarin differ in words and grammar, not just characters, so each gets its own source.
- **Tests** fail the build if any key is missing in any language, if `{placeholders}` differ between languages, if a page or blog post lacks one of its four versions, or if a hard-coded English string shows up in a component.
- **Fonts**: Archivo and Inter load the `latin` and `latin-ext` subsets (French needs œ, which is in Latin Extended-A); Chinese text uses the system stacks above, set per `:lang()`.
- **Native check**: Ming proofreads 简体中文; the French and Cantonese text needs a native speaker's pass before the demo is shown to anyone (Open below).

## Themes and colour

Light and dark tokens, written out twice in CSS (system preference, then the manual `data-theme` choice), with the hex value next to each OKLCH (a perceptual colour space) source. Every text pair below was computed against WCAG.

| Token | Light | Dark | Contrast (light / dark) |
|---|---|---|---|
| `--bg` | paper `oklch(0.985 0.003 260)` #F9FAFC | garage `oklch(0.17 0.012 260)` #0C1015 | |
| `--surface` | `oklch(0.955 0.006 260)` #EEF0F4 | `oklch(0.22 0.014 260)` #171B21 | |
| `--text` | ink `oklch(0.20 0.012 260)` #13161C | `oklch(0.94 0.005 260)` #E9EBEF | 17.3 / 16.0 on bg |
| `--muted` | steel `oklch(0.47 0.02 260)` #545B66 | `oklch(0.74 0.015 260)` #A5ABB5 | 6.5 / 8.3 on bg, 6.0 / 7.5 on surface |
| `--link` | blue `oklch(0.52 0.19 264)` #2D5ED4 | `oklch(0.74 0.13 264)` #81A9FD | 5.5 / 8.2 on bg |
| `--button` | #2D5ED4 with white text | same | 5.5 / 5.7 |
| `--signal` | not used on light | amber `oklch(0.80 0.16 75)` #F9AD26 | 9.1 on surface |

The light theme has dark "garage" bands for the proof sections; the dark theme flips the whole page. SVG drawings use `currentColor` so they follow the theme.

## Browser support

Safari and iOS 16.4+, Chrome, Edge, Firefox and Samsung Internet (last two versions). Everything else is progressive enhancement:

| Feature | Status (webstatus.dev, 18 Nov 2026) | Use |
|---|---|---|
| Container queries, OKLCH, `:has()` | Baseline widely available | Core layout and colour |
| Same-page view transitions | Baseline since 14 Oct 2025 | Make picker and gallery |
| `@starting-style`, popover | Baseline since 2024 / Jan 2025 | Menus, booking sheet entrance |
| Scroll-driven animations | Baseline since 27 Oct 2026 | Section reveals; off on older browsers |
| Cross-page view transitions, anchor positioning | Not in every browser | Extras only, never needed to use the page |

## Information architecture

Each page exists in all four languages (19 pages × 4 = 76).

| Page | Path (English) | What it shows |
|---|---|---|
| Home | `/` | Section order below |
| BMW & MINI | `/bmw-mini/` | Engine and model blocks (N20, N55, B58, S55): what fails, what we check, typical range; a Book button per block |
| Mercedes-Benz & AMG | `/mercedes-amg/` | M274, M276, M177, Airmatic |
| VW, Audi & Porsche | `/vw-audi-porsche/` | EA888, DSG/S tronic, Cayenne and Macan |
| Tires | `/tires/` | Seasonal swaps, storage, BC winter tire dates (1 Oct to 30 Apr on signed highways) |
| Fleet | `/fleet/` | Fleet account request |
| CarPlay retrofit | `/carplay-retrofit/` | What gets installed, what stays factory, time and warranty |
| Pre-purchase inspection | `/pre-purchase-inspection/` | Checklist and a sample report |
| Book | `/book/` | The full booking flow; also the no-JavaScript fallback |
| Contact and quote | `/contact/` | "Not sure what's wrong?" form, map image, hours |
| About | `/about/` | The (fictional) team, how to find the unit, parking |
| Reviews | `/reviews/` | Sample reviews with dates, labelled |
| Warranty | `/warranty/` | 12-month parts and labour terms (sample) |
| Privacy | `/privacy/` | Template written to BC PIPA (Personal Information Protection Act) ss.3 and 10 |
| Blog | `/blog/` + 3 posts | Original posts: a real-job diagnosis story, a Mercedes service A/B explainer, a winter tire guide |
| 404 | `/404` | Search box, Call and Book; no redirects or alternates |

Navigation: Services (menu by make, plus Tires, Fleet, CarPlay, Inspection) · Blog · About · Reviews · language menu · theme button · **Book**.

## Homepage, top to bottom

```text
┌──────────────────────────────┐
│ Design concept · fictional   │  concept strip (aside landmark)
├──────────────────────────────┤
│ FEINWERK  EN▾  ◐  (604)…  ☰  │  header: language menu, theme button, phone
├──────────────────────────────┤
│ [photo: car on the lift]     │  1 HERO: own photo (AVIF image ≤120 KB, the largest first paint)
│ European car specialists     │     H1, localized
│ in Vancouver                 │
│ ★4.8 · sample reviews        │     chips: rating (labelled sample),
│ ● Open · closes 6:00         │     live open/closed in Vancouver time
│ [Book online]  [Text us]     │
├──────────────────────────────┤
│ START A WORK ORDER  FW-0142  │  2 MAKE PICKER: bento tiles with photos or SVG
│ [BMW·MINI] [Mercedes·AMG]    │     tap → service list → booking with the make filled in
│ [VW·Audi·Porsche] [Other]    │
│ [Tires] [Fleet] [CarPlay]    │
├──────────────────────────────┤
│ 1 Book → 2 Photos sent       │  3 HOW IT WORKS: we inspect and send photos,
│ → 3 You approve each line    │     you approve each line from your phone
├──────────────────────────────┤
│ Proof: annotated photo ·     │  4 PROOF (garage band): one inspection photo with
│ 3 reviews · 12-month warranty│     numbered callouts, 3 dated reviews, warranty line
├──────────────────────────────┤
│ Independent vs dealer        │  5 Three rows: price, who you talk to, parts choice
├──────────────────────────────┤
│ From the shop (3 posts)      │  6 BLOG
├──────────────────────────────┤
│ Visit: map image, hours,     │  7 VISIT: static map image, hours with today
│ entrance and parking         │     highlighted, directions link
├──────────────────────────────┤
│ footer + disclaimer          │  8 FOOTER: sample address, hours, links, disclaimer
├──────────────────────────────┤
│ [Call]   [Text]   [Book]     │  bottom bar, phones only
└──────────────────────────────┘
```

Target: about 6 phone screens. Before building it out, Phase 1 makes two hero variants (full-bleed photo vs split photo and work-order card) and picks one from screenshots in all four languages and both themes.

## Design direction: "precision workshop"

| Part | Choice |
|---|---|
| Display type | Archivo variable (width and weight axes): wide cuts for headlines, like motorsport livery |
| Body | Inter variable |
| Data labels | IBM Plex Mono for work-order numbers, specs, prices |
| Imagery | Own photos in one colour grade, cropped to 16:9 (hero), 4:3 (tiles), 1:1 (reviews); inspection photos with numbered callouts as the signature visual; SVG line drawings of parts where there's no photo |
| Shape | 4 px radius, 1 px hairlines, a 12-column grid with bento tiles |
| Motion | Native CSS only (table above). Nothing animates on load except the hero fade; nothing blocks a tap |
| What makes it 2026 | Live data on the page (open now, next free slot), booking as the main interaction rather than a contact form, native CSS motion instead of a script library, real photos instead of stock |

## Booking flow (demo)

1. "Book online" opens a sheet (`<dialog>` with a popover-style entrance) on the current page, or `/book/` without JavaScript.
2. Four steps: make and model → service (prefilled when started from a tile) → day and time → contact details. Times come from the sample hours in Vancouver time; a unit test covers slot generation across days, closing time and the end of daylight saving.
3. Confirmation screen in the visitor's language, with an add-to-calendar file (`.ics`) and a clear line: "This is a demo. Nothing was sent."
4. The flow sits behind a small `BookingProvider` interface with three implementations: `demo` (in the browser, no network; the one that ships), `tekmetric` (opens a shop's Tekmetric Online Booking link or iframe overlay) and `form` (posts to a form service). A real shop would swap one line of config.
5. The privacy line under the form and the unticked "service reminders" box follow BC PIPA s.10 and CASL (Canada's Anti-Spam Legislation) ss.6(6) and 10(10), so the template is launch-ready.

## Quality bar

Every item is an automated gate in CI unless marked manual.

| Gate | Bar |
|---|---|
| Type check | `astro check` with TypeScript strict, zero errors |
| Unit tests | `node --test`: language detection, translation completeness and placeholders, open/closed status, booking slots, `BookingProvider` contract |
| End to end | Playwright: booking flow in each language; theme cycles and persists; language choice persists and beats the browser; explicit language URLs never redirect; no-JavaScript run of `/book/` |
| Screenshots | Home, a make page and Book in 4 languages × 2 themes × 2 viewports (390 × 844, 1440 × 900): 48 baselines, diff reviewed on every change |
| Accessibility | axe at zero violations on the same 48 combinations; keyboard-only booking (manual, once per phase) |
| Lighthouse (mobile) | Performance, Accessibility and Best Practices 100 on Home and Book; SEO not gated, since `noindex` caps it on purpose |
| Speed (lab, Slow 4G, 4× CPU) | LCP (Largest Contentful Paint) ≤ 1.8 s, CLS (Cumulative Layout Shift) ≤ 0.05, total blocking time ≤ 100 ms; homepage first view ≤ 500 KB |
| HTML | `html-validate` clean; every internal link resolves in all four languages |
| Real devices (manual) | iPhone with iOS 16 or 17 and a current Android: themes, language menu, bottom bar, booking sheet, VoiceOver on the Cantonese page |

## Engineering

- **Stack**: Astro 7 (static output), TypeScript strict, no client framework, Astro `<Image />` for AVIF/WebP with `srcset`. Hosted on GitHub Pages, deployed by the same `withastro/action` workflow as HYK.
- **Repo layout**: `src/data/site.json` (name, sample contact, hours, disclaimer), `src/i18n/{en,fr,zh-hans,zh-hk}.ts`, `src/lib/` (lang detection, time, booking), `src/content/blog/{locale}/` for posts, `src/styles/` with tokens in a `@layer`, `tests/e2e/`.
- **CI on every push and pull request**: type check, unit tests, build, Playwright end to end and screenshots, axe, Lighthouse CI, HTML validation, link check. `main` deploys only when every gate passes.
- **Decision records**: the Decisions below go in `docs/decisions.md` so each one can be revisited on its own.

## Phases (solo, evenings)

| Phase | Effort | Done when |
|---|---|---|
| 0. Foundations | 6-8 h | Repo, Astro 7, CI with every gate (on placeholder pages), GitHub Pages deploy, tokens, theme system, 4-language routing, demo-safety layer |
| 1. Design system and home (English) | 12-16 h | Header, bottom bar, bento tiles, buttons, chips, cards; homepage with both hero variants; one picked from the screenshot set |
| 2. All pages (English) | 14-18 h | The 19 pages above, booking flow with the `demo` provider, 3 posts, 404 |
| 3. Four languages | 10-14 h | French, 简体中文 and Cantonese dictionaries and posts; completeness tests green; French-length fixes |
| 4. Hardening | 6-8 h | 48-combination screenshot and axe sets green; Lighthouse 100s; print; share cards; no-JavaScript run; the real-device pass |
| 5. Ship and show | 3-4 h | README with a "not a real business" notice, screenshots, Lighthouse numbers; case study for mingz.dev through `/showcase` |

Total: about 51-68 hours.

## Decisions

> **Decision**: fictional brand "Feinwerk Auto", Latin name in every language. **Why**: it removes the legal risk of using a real shop's name, and keeping one Latin name avoids clashing with a Chinese trade name already in use.

> **Decision**: Astro 7 on GitHub Pages, no client framework. **Why**: same stack as HYK, so its language detection, theme and test code carry over. Static output keeps JavaScript under 15 KB and the site free to host.

> **Decision**: four separate dictionaries, Cantonese tagged `zh-HK`. **Why**: Cantonese isn't Mandarin in other characters, so a converter would produce wrong text. `yue` isn't accepted in hreflang.

> **Decision**: explicit light and dark tokens, no `light-dark()`. **Why**: iOS Safari before 17.5 ignores it, which is inside the support range; HYK hit this and fixed it the same way.

> **Decision**: the booking flow ships with a `demo` provider behind an interface. **Why**: the demo has no real calendar, and the interface shows how it plugs into Tekmetric or a form service without changing the UI.

## Assumed, correct me

- "Chinese" means Simplified (written Mandarin) and "Cantonese" means written Cantonese in Traditional characters. Standard written Traditional (for Taiwan readers) isn't a fifth language.
- Photos come from Ming's own camera roll; if there aren't enough, the gaps become SVG drawings rather than stock.
- GitHub Pages under `mingz6.github.io/feinwerk-auto/`, public repo, like HYK.

## Open

- Native-speaker check of the French and Cantonese text before the demo is shown to anyone.
- A trademark search on "Feinwerk" (Canadian Intellectual Property Office database) if the demo is ever used beyond a portfolio.

## Sources

- Baseline patterns: `~/code/playground/hyk-restaurant` (README, `src/lib/lang.ts`, `src/layouts/Base.astro`, `src/scripts/ui.ts`, `src/i18n/`, commit f5844aa for the `light-dark()` fix)
- hreflang rules (ISO 639-1 only, script subtags allowed): <https://developers.google.com/search/docs/specialty/international/localized-versions>
- Browser support: <https://webstatus.dev> API, 18 Nov 2026
- INP and Core Web Vitals thresholds: <https://web.dev/articles/inp>
- BC PIPA: <https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03063_01>
- CASL: <https://laws-lois.justice.gc.ca/eng/acts/E-1.6/FullText.html>
- Tekmetric Online Booking (for the `tekmetric` provider): <https://www.tekmetric.com/feature/scheduling>
- Market scan and the source-site audit: `research/` (private, gitignored)
