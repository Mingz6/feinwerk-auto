import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POSTS, readMinutes } from "./posts.ts";

test("reading time counts words in English and characters in Chinese", () => {
  assert.equal(readMinutes("word ".repeat(400)), 2);
  assert.equal(readMinutes("字".repeat(800)), 2);
  assert.equal(readMinutes("温哥华 BMW 保养"), 1);
});

test("each 简体中文 post reads about as long as the English one", () => {
  for (const { slug } of POSTS) {
    const en = readMinutes(readFileSync(`src/content/blog/en/${slug}.md`, "utf8"));
    const zh = readMinutes(readFileSync(`src/content/blog/zh-hans/${slug}.md`, "utf8"));
    assert.ok(Math.abs(en - zh) <= 1, `${slug}: en ${en} min, zh-hans ${zh} min`);
  }
});
