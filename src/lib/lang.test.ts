import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLocale, isLocale } from "./lang.ts";

// One block per row of PLAN.md's detection order, then the ordering rules.
const rows: [string, [string[], string][]][] = [
  ["en* -> English", [[["en"], "en"], [["en-CA"], "en"], [["en-US"], "en"], [["en-GB"], "en"], [["EN_ca"], "en"]]],
  ["fr* -> French", [[["fr"], "fr"], [["fr-CA"], "fr"], [["fr-FR"], "fr"], [["fr-BE"], "fr"], [["FR_ca"], "fr"]]],
  [
    "zh-Hans, zh-CN, zh-SG, plain zh -> Simplified",
    [[["zh-Hans"], "zh-hans"], [["zh-CN"], "zh-hans"], [["zh-SG"], "zh-hans"], [["zh"], "zh-hans"], [["zh-Hans-CN"], "zh-hans"], [["zh-Hans-HK"], "zh-hans"], [["zh_CN"], "zh-hans"]],
  ],
  [
    "zh-Hant, zh-HK, zh-MO, zh-TW, yue -> Cantonese",
    [[["zh-Hant"], "zh-hk"], [["zh-HK"], "zh-hk"], [["zh-MO"], "zh-hk"], [["zh-TW"], "zh-hk"], [["yue"], "zh-hk"], [["yue-HK"], "zh-hk"], [["yue-Hant-HK"], "zh-hk"], [["zh-Hant-TW"], "zh-hk"], [["zh-Hant-HK"], "zh-hk"], [["ZH-tw"], "zh-hk"], [["zh_HK"], "zh-hk"]],
  ],
  ["anything else -> English", [[[], "en"], [["de"], "en"], [["de-DE", "es-ES", "ja"], "en"], [["ko-KR"], "en"], [[""], "en"]]],
  [
    "first recognised entry in the browser's order wins",
    [[["en-US", "zh-TW"], "en"], [["zh-TW", "en-US"], "zh-hk"], [["fr-CA", "en-CA"], "fr"], [["en-CA", "fr-CA"], "en"], [["zh-CN", "en"], "zh-hans"], [["de", "fr", "en"], "fr"], [["ja", "yue"], "zh-hk"], [["es", "zh"], "zh-hans"]],
  ],
];

for (const [row, cases] of rows) {
  for (const [input, expected] of cases) {
    test(`${row}: ${JSON.stringify(input)} -> ${expected}`, () => {
      assert.equal(detectLocale(input), expected);
    });
  }
}

test("detectLocale is self-contained, so its source can be inlined into <head>", () => {
  const inlined = new Function(`return (${detectLocale.toString()})`)() as typeof detectLocale;
  assert.equal(inlined(["zh-HK"]), "zh-hk");
  assert.equal(inlined(["fr-CA"]), "fr");
});

test("isLocale accepts the four locales only", () => {
  for (const l of ["en", "fr", "zh-hans", "zh-hk"]) assert.ok(isLocale(l), l);
  for (const l of ["", "zh", "zh-Hant", "EN", null, undefined, 1]) assert.ok(!isLocale(l), String(l));
});
