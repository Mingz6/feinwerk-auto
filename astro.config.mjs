import { defineConfig, fontProviders } from "astro/config";

// Google Fonts' latin and latin-ext ranges, as fontsource ships them. French needs latin-ext for some accents.
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

/** Self-hosted from the fontsource packages: Astro copies the files into dist and writes metric-matched fallbacks. */
const family = (name, cssVariable, files, props) => ({
  provider: fontProviders.local(),
  name,
  cssVariable,
  options: {
    variants: [
      { src: [files.latin], unicodeRange: [LATIN], style: "normal", display: "swap", ...props },
      { src: [files.latinExt], unicodeRange: [LATIN_EXT], style: "normal", display: "swap", ...props },
    ],
  },
});

// GitHub Pages project site: https://mingz6.github.io/feinwerk-auto/
// Every URL in the site is built from import.meta.env.BASE_URL (src/lib/site.ts), never a bare leading "/".
export default defineConfig({
  site: "https://mingz6.github.io",
  base: "/feinwerk-auto",
  trailingSlash: "ignore",
  build: { inlineStylesheets: "auto" },
  devToolbar: { enabled: false },
  fonts: [
    family(
      "Archivo",
      "--font-display",
      {
        latin: "./node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
        latinExt: "./node_modules/@fontsource-variable/archivo/files/archivo-latin-ext-wdth-normal.woff2",
      },
      { weight: "100 900", stretch: "62% 125%" },
    ),
    family(
      "Inter",
      "--font-body",
      {
        latin: "./node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
        latinExt: "./node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2",
      },
      { weight: "100 900" },
    ),
    {
      ...family(
        "IBM Plex Mono",
        "--font-mono",
        {
          latin: "./node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
          latinExt: "./node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-ext-500-normal.woff2",
        },
        { weight: "500" },
      ),
      fallbacks: ["monospace"],
    },
  ],
});
