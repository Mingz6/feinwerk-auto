import { test } from "node:test";
import assert from "node:assert/strict";
import { fold, matches } from "./search.ts";

test("fold drops case and accents", () => {
  assert.equal(fold("Révision Œuvre"), "revision œuvre");
});

test("every query word must match, in any order", () => {
  assert.ok(matches("tire bc", "BC winter tires"));
  assert.ok(matches("  ", "anything"));
  assert.ok(!matches("tire brake", "BC winter tires"));
});

test("accents and Chinese text match as substrings", () => {
  assert.ok(matches("pneus d'hiver", "Pneus d'hiver en C.-B."));
  assert.ok(matches("revision", "Révision Mercedes"));
  assert.ok(matches("冬季", "卑詩省冬季輪胎"));
});
