import { test } from "node:test";
import assert from "node:assert/strict";
import { MAKES, SERVICES, bookQuery, parseBookQuery } from "./book.ts";

test("bookQuery carries make, service and model in a fixed order", () => {
  assert.equal(bookQuery({ make: "bmw-mini", service: "repair", model: "n20" }), "?make=bmw-mini&service=repair&model=n20");
  assert.equal(bookQuery({ service: "tires" }), "?service=tires");
  assert.equal(bookQuery({}), "");
});

test("parseBookQuery round-trips every make and service", () => {
  for (const make of MAKES) for (const service of SERVICES) assert.deepEqual(parseBookQuery(bookQuery({ make, service, model: "b58" })), { make, service, model: "b58" });
});

test("parseBookQuery drops unknown or malformed values", () => {
  assert.deepEqual(parseBookQuery("?make=tesla&service=detailing&model=<script>"), {});
  assert.deepEqual(parseBookQuery("make=BMW-MINI&service=tires"), { service: "tires" });
  assert.deepEqual(parseBookQuery("?model=" + "a".repeat(25)), {});
  assert.deepEqual(parseBookQuery(""), {});
});

test("parseBookQuery keeps the first value when a key repeats", () => {
  assert.deepEqual(parseBookQuery("?make=mercedes-amg&make=bmw-mini"), { make: "mercedes-amg" });
});
