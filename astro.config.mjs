import { defineConfig } from "astro/config";

// GitHub Pages project site: https://mingz6.github.io/feinwerk-auto/
// Every URL in the site is built from import.meta.env.BASE_URL (src/lib/site.ts), never a bare leading "/".
export default defineConfig({
  site: "https://mingz6.github.io",
  base: "/feinwerk-auto",
  trailingSlash: "ignore",
  build: { inlineStylesheets: "auto" },
  devToolbar: { enabled: false },
});
