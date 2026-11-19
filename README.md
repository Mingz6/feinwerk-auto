# Feinwerk Auto (design concept)

**Not a real business.** Feinwerk Auto is a fictional European car repair shop in Vancouver, built as a design concept and portfolio piece. The phone number (604-555-0148, a range reserved for fiction), the address, reviews, ratings and prices are samples. Make names only describe the cars serviced; nothing here is affiliated with any company or vehicle manufacturer.

Live: <https://mingz6.github.io/feinwerk-auto/> · Plan: [PLAN.md](PLAN.md) · Decisions: [docs/decisions.md](docs/decisions.md)

## Run it

```sh
npm ci
npm run build      # astro check && astro build
npm test           # unit tests and the demo-safety checks over dist/
npm run test:e2e   # Playwright: theme and language behaviour
npm run test:axe   # axe on every page, both themes, phone and desktop
npm run validate:html && npm run check:links
npm run lhci       # Lighthouse CI, mobile
```

Languages: English at `/`, French at `/fr/`, 简体中文 at `/zh-hans/`, 廣東話 at `/zh-hk/`. The English pages pick a language from the browser on the first visit; a choice in the language menu is remembered and wins; the other language URLs never redirect.

Real contact details for an in-person showing go in `src/data/site.private.json` (gitignored, merged over `site.json` at build), so CI always publishes the placeholders.
