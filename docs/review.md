---
title: "Feinwerk Auto: final review (Phase 6)"
date: 2026-11-19
reviewed: "phase-5 at 643c172, local build of the same commit"
---

# Final review

Verdict: not signed off yet. The gates are green and the demo-safety layer holds, but 5 items below must be fixed first (one public text, two copy lines, two small accessibility misses). Nothing here needs a redesign; Phase 7 can close the Must list in one pass. No code was changed in this review.

## Phase 7 status

Every Must item is fixed. Five Should items are fixed, two are left with a reason in `docs/decisions.md` (Phase 7).

| # | Status | Commit or reason |
|---|---|---|
| M1 | fixed | 0f97c50: "the character class", "in Docker on a Mac", "after the diff is reviewed" |
| M2 | fixed | 0f97c50: the link is 142 × 44 in English, 93 × 44 in French, 72 × 44 in both Chinese (probe at 390 × 844) |
| M3 | fixed | 0f97c50: `.lost-search` gets `grid-template-columns: minmax(0, 1fr)`; scroll width 320 at 320 (was 329) |
| M4 | fixed | 0f97c50: 「有未經計量嘅空氣入咗引擎」 |
| M5 | fixed | 0f97c50: "avec les détails de votre voiture déjà saisis"; the English source said "with your car filled in" too and now reads "The booking opens with your car's details filled in." |
| S1 | fixed | 0f97c50: `currencyDisplay: "narrowSymbol"` in the work order, home and make pages |
| S2 | fixed | 0f97c50: `.btn-quiet` has a `--muted` outline |
| S3 | left | Home is a target of about 6 screens, not a gate; Ming's photos will change the heights, so the trim and the four-language measure wait for them |
| S4 | left | One decision each: no component sits at two widths yet (container queries), the make tiles are links (no same-page change to animate), a static demo has no real next free slot |
| S5 | fixed | 0f97c50: Flotte, point relevé, boîte de transfert, sur place, on lit ses codes d'erreur, une rangée d'ateliers, centre de service de marque typique, 2,0 L with a no-break space, "ont toutes des panneaux", "redescendues à environ ±3 %" |
| S6 | fixed, one left | 0f97c50: contact lead, review 5, vag.lead, 副水箱, 後泵把, 「裂咗條縫」, 睇下 in the posts too. 輪圈 → 呔鈴 left for the native reader, as the review said |
| S7 | fixed | 0f97c50: 汽修店 (7 places), 厢式车, 「尽头的那一间」, review 5 rewritten |
| p6 pre-review | done | English was never read in Phase 6. Read in Phase 7: Canadian spelling holds, no "dealer" or "authorized" outside key names, one line changed (M5 row). 简体中文 now has phone screenshots in both themes in `docs/screenshots/phone/` |

## How it was checked

- Build and tests on 643c172: `npm ci && npm run build && npm test` exit 0, 73 pages, same counts as the Phase 5 CI run <https://github.com/Mingz6/feinwerk-auto/actions/runs/44661616559> (e2e, 48 screenshots, axe, Lighthouse all green).
- A Playwright probe over all 73 built pages at 390 × 844, then 320 wide: head tags, sideways scroll, tap-target sizes, field labels, `autocomplete`, input font size, Latin runs on Chinese pages. Then the booking sheet end to end in French (phone, light), 廣東話 (phone, dark) and 简体中文 (desktop).
- 12 screenshots, all in `docs/review-shots/`, each one looked at.
- French read by one reviewer pass against the English; 廣東話 and 简体中文 by another. Every line quoted below was re-read in the file. This is not the native-speaker pass PLAN.md asks for.

## Must fix

| # | What | Breaks | File | Evidence |
|---|---|---|---|---|
| M1 | The public case study says "my character class" and "after I review the diff". Phase 5's own report says the text claims nothing about who typed the code; these two lines do. Reword both neutrally ("the character class", "after the diff is reviewed") until Ming decides. | PLAN.md:210 (case study), PR #8 pre-review "fix" | `docs/case-study.md:43`, `:45` | <https://github.com/Mingz6/feinwerk-auto/pull/8> |
| M2 | "Sample reviews" link on the home proof band is 142 × 20 px on a phone, in all 4 languages. | PLAN.md:40 (tap targets at least 44 px) | `src/views/Home.astro` (`.proof-side` link), `src/styles/global.css` | probe: `proof-side>a 142x20 block`; `docs/review-shots/home-zh-hk-dark-4.jpg` (示例評價) |
| M3 | The 404 page scrolls sideways by 9 px at 320 px wide. Every other page reflows. | PLAN.md:43 (WCAG 2.2 AA, 1.4.10 Reflow) | `src/pages/404.astro`, `.lost-search` in `src/styles/global.css` | probe: `overflow320 1 ['404.html:9']`, 0 of 73 at 390 |
| M4 | 廣東話 post: 「好多時係有冇計量嘅空氣入咗引擎」 reads as "whether or not"; the sentence stops making sense. Write 「有未經計量嘅空氣入咗引擎」. | PLAN.md:56 (written Cantonese), :62 | `src/content/blog/zh-hk/misfire-vacuum-leak.md:30` | the line itself |
| M5 | French: "On réserve un diagnostic avec votre voiture déjà remplie" says the car is filled. Write "avec les détails de votre voiture déjà saisis". | PLAN.md:54 (French), :62 | `src/i18n/fr.ts:193` (`svc.other.text`) | the line itself |

## Should fix

| # | What | Breaks | File | Evidence |
|---|---|---|---|---|
| S1 | Sample prices read "CA$412" in 廣東話 and 简体中文, "$412" in English and "412 $" in French. Use `currencyDisplay: "narrowSymbol"` so a Vancouver page shows "$412". | PLAN.md:164 (prices), visual consistency | the `Intl.NumberFormat` call behind the work order and `data-sample-price` | `docs/review-shots/home-zh-hk-dark-1.jpg` against `home-fr-light-2.jpg` and `home-en-dark-desktop-1.jpg` |
| S2 | The phone number next to Book and Text has no border and no underline, so it reads as plain mono text, while the header number is underlined. Give it the ghost-button outline. | PLAN.md:158-168 (one design system) | hero and `.svc-hero` phone link, `src/styles/global.css` | `docs/review-shots/bmw-fr-light-1.jpg` ("Appeler le 604-555-0148"), `home-en-dark-desktop-1.jpg` |
| S3 | Home is 7.3 phone screens in English and 7.7 in French (6.8 in both Chinese). The plan says about 6; the test allows 4.5-7.5 and only measures English. Trim, or measure all four. | PLAN.md:156 | `src/views/Home.astro`, `tests/e2e/home.spec.ts` | probe: `en:7.3 fr:7.7 zh-hans:6.8 zh-hk:6.8` |
| S4 | Planned but not built, with no decision recorded: container queries (0 `@container`), same-page view transitions on the make picker (0 `view-transition`), "next free slot" as live data. Scroll reveals and popover are covered by Phase 1 and 2b decisions. Build them or add one line each to `docs/decisions.md`. | PLAN.md:40, :86-87, :168 | `src/styles/global.css`, `docs/decisions.md` | `git grep -c` on `src`: 0, 0, 0 |
| S5 | French terms a Canadian reader would trip on: "Parc de véhicules" in booking against "Flotte" in the menu (`fr.ts:49`); "constat(s)" for findings (`:129`, `:351`); "boîtier de transfert" for boîte de transfert (`:296`, `:299`, `:499`); "attendez au salon" (`:127`); "on la scanne" (`:402`); "ateliers légers" (`:487`); "centre de service de la marque type" (`:150`); a plain space in "2,0 L" where km and mm get a no-break space. Post: "ont toutes les panneaux" reads better as "ont toutes des panneaux" (`bc-winter-tires.md:7`); "à environ 3 % de zéro" (`misfire-vacuum-leak.md:23`). | PLAN.md:54 | `src/i18n/fr.ts`, `src/content/blog/fr/` | lines quoted; `docs/review-shots/menu-fr-1.jpg` (Flotte) |
| S6 | 廣東話 lines that read as translated: 「我哋會回覆你會先檢查啲咩…同一個工作天內覆你」 (`zh-hk.ts:455`); 「輪取返嗰陣…入嚟出去只用咗四十分鐘」 (`:502`); 「慳返好多估估下嘅功夫」 (`:277`); 「爆咗條裂」 (`misfire-vacuum-leak.md:19`). Terms: 保險槓 → 泵把, 膨脹水箱 → 副水箱 (`:220`, `:430`, `:432`); 輪圈 → 呔鈴 would match the 呔 register (`:324-333`, a Phase 3c call, so leave for the native reader). The posts write 睇吓, the interface 睇下: pick one. | PLAN.md:56 | `src/i18n/zh-hk.ts`, `src/content/blog/zh-hk/` | lines quoted |
| S7 | 简体中文: 修理店 reads as a general repair shop, 汽修店 is the car word (`zh-hans.ts:464` and 6 more); 「最里面一间」 for the end unit (`:487`); 货车 for vans (`:341`); the tire review (`:501`) is stiff. | PLAN.md:55 | `src/i18n/zh-hans.ts` | lines quoted |

## What holds

- **Demo safety**: demo-safety grep 0 matches. All 73 pages carry `noindex, nofollow`, the concept strip as an `<aside>` and one `<h1>`; phone and address are the placeholders; rating, reviews, prices and the work order show a Sample tag in each language (`home-fr-light-1.jpg`, `home-zh-hk-dark-4.jpg`). No "dealer" or "authorized" in visible copy (the 19 hits in `src` are dictionary key names such as `compare.dealer`).
- **Languages**: `lang` is en-CA, fr-CA, zh-Hans, zh-HK; 72 pages have canonical plus 5 alternates, the 404 has none; each has its own `og:locale` and share card. No English run of 3 words or more on any Chinese page. French times read "8 h", "8 h 30" (`book-fr-light-step3.jpg`); 廣東話 uses 上午8:00, 简体中文 24 hours.
- **Booking**: opens on the page, focus lands inside the sheet, 4 steps with the progress line, the reminders box unticked, the privacy line with the officer's phone, "Ceci est une démo. Rien n'a été envoyé." before and after, one `.ics` link, Escape closes (`book-fr-light-step1.jpg`, `-step3.jpg`, `-step4b.jpg`, `book-zh-hk-dark-done.jpg`). No choice in the sheet is under 44 px high.
- **Accessibility**: first Tab is "Skip to content" and its target exists; focus ring visible in dark (`home-en-dark-desktop-1.jpg`); every field has a label and `autocomplete`; no input under 16 px; no sideways scroll at 390 on any page.
- **Themes and layout**: token hex values in `src/styles/tokens.css` match the PLAN table; `light-dark()` appears only in a comment; the bottom bar is slimmer in landscape (`home-en-landscape.jpg`); the French menu and tiles wrap inside their boxes (`menu-fr-1.jpg`, `home-fr-light-2.jpg`).
- **Checked and dropped**: a reviewer flagged "pneus quatre saisons" (all-season) and "pneus toutes saisons" (all-weather) as swapped. They match CAA-Québec usage and the Phase 3a decision; left as is for the native reader.

## Not reviewable here (Ming)

- Photos: the hero and tiles are line drawings with "photo slot" captions (PLAN.md:125); slots are listed in `src/assets/photos/README.md`.
- The native-speaker read of French and 廣東話 (PLAN.md:62, :234). S5 and S6 are a head start, not a replacement.
- The real-device pass and VoiceOver on the 廣東話 page (PLAN.md:192). Keyboard-only booking is covered by the e2e test, not by a person.
