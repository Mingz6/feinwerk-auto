// Every internal link, asset and same-page anchor in dist/ must resolve, in all four languages.
// Internal means root-relative under the base path, or an absolute URL on the Pages site.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const BASE = "/feinwerk-auto/";
const SITE = "https://mingz6.github.io";

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const pages = walk(DIST).filter((f) => f.endsWith(".html"));
const ids = new Map(pages.map((p) => [p, new Set([...readFileSync(p, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

const resolve = (path) => {
  const rel = decodeURIComponent(path.slice(BASE.length));
  for (const c of [rel, join(rel, "index.html"), `${rel}.html`]) {
    const f = join(DIST, c);
    if (existsSync(f) && statSync(f).isFile()) return f;
  }
  return null;
};

const broken = [];
let checked = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const m of html.matchAll(/<meta property="og:url" content="([^"]+)"/g)) refs.push(m[1]);
  for (let ref of refs) {
    if (/^(mailto|tel|sms|data|javascript):/.test(ref)) continue;
    if (ref.startsWith(SITE)) ref = ref.slice(SITE.length);
    else if (/^[a-z]+:\/\//i.test(ref)) continue; // external
    checked++;
    const [pathAndQuery, hash] = ref.split("#");
    const path = pathAndQuery.split("?")[0];
    let target = page;
    if (path) {
      if (!path.startsWith(BASE)) {
        broken.push(`${relative(DIST, page)}: ${ref} is not under ${BASE}`);
        continue;
      }
      target = resolve(path);
      if (!target) {
        broken.push(`${relative(DIST, page)}: ${ref} does not resolve`);
        continue;
      }
    }
    if (hash && target.endsWith(".html") && !ids.get(target)?.has(hash)) broken.push(`${relative(DIST, page)}: ${ref} has no #${hash}`);
  }
}

if (broken.length) {
  console.error(`Link check: ${broken.length} broken of ${checked}\n${broken.join("\n")}`);
  process.exit(1);
}
console.log(`Link check: ${checked} internal links across ${pages.length} pages, 0 broken`);
