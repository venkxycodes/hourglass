import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, defaults } from "./calculations.ts";
test("accommodation example yields a 4000 benefit and correct break-even", () => {
  const r = calculate(defaults);
  assert.equal(r.hourly, 1250);
  assert.equal(r.net, 4000);
  assert.equal(r.threshold, 11000 / 12);
});
test("custom value changes the recommendation", () =>
  assert.equal(
    calculate({ ...defaults, custom: true, value: 500 }).net,
    -5000,
  ));
test("no hours saved has no break-even", () => {
  const r = calculate({ ...defaults, saved: 0 });
  assert.equal(r.threshold, null);
  assert.equal(r.net, -11000);
});
test("equal value and cost is neutral", () =>
  assert.equal(
    calculate({ ...defaults, custom: true, value: 1000, cost: 12000 }).net,
    0,
  ));
test("zero working hours does not produce infinity", () =>
  assert.equal(calculate({ ...defaults, hours: 0 }).hourly, 0));
