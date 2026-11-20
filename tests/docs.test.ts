// PLAN.md's Decisions are settled; docs/decisions.md repeats each one so it can be revisited on its own.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const plan = readFileSync("PLAN.md", "utf8");
const decisions = readFileSync("docs/decisions.md", "utf8");
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

test("every Decision in PLAN.md is in docs/decisions.md, under From PLAN.md", () => {
  const fromPlan = decisions.split("## From PLAN.md")[1]?.split(/\n## /)[0] ?? "";
  const titles = [...plan.matchAll(/^> \*\*Decision\*\*: (.+?) \*\*Why\*\*/gm)].map((m) => norm(m[1]));
  assert.equal(titles.length, 5, "PLAN.md's Decisions section");
  const mirrored = [...fromPlan.matchAll(/^- \*\*(.+?)\*\*/gm)].map((m) => norm(m[1]));
  for (const t of titles) assert.ok(mirrored.includes(t), `missing from docs/decisions.md: ${t}`);
});
