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

import { validateNumber, sanitizeInputs } from "./calculations.ts";
test("schedule validation rejects out-of-range and fractional workdays", () => {
  for (const raw of ["0", "8", "2.5", "-1", "", "abc", "Infinity", "1e2"]) {
    assert.notEqual(validateNumber("days", raw), null, raw);
  }
  for (const raw of ["1", "5", "7"])
    assert.equal(validateNumber("days", raw), null);
});
test("hours accept half-hour increments within a day", () => {
  for (const raw of ["0.5", "7.5", "24"])
    assert.equal(validateNumber("hours", raw), null);
  for (const raw of ["0", "24.5", "7.25"])
    assert.notEqual(validateNumber("hours", raw), null);
});
test("other numeric fields enforce nonnegative values and whole-day periods", () => {
  assert.equal(validateNumber("cost", "0"), null);
  assert.equal(validateNumber("salary", "1200000.50"), null);
  assert.notEqual(validateNumber("cost", "-1"), null);
  assert.notEqual(validateNumber("weeks", "53"), null);
  assert.notEqual(validateNumber("duration", "1.5"), null);
  assert.notEqual(validateNumber("saved", "NaN"), null);
});
test("persisted invalid values cannot bypass numeric rules", () => {
  const p = sanitizeInputs({
    ...defaults,
    days: 8,
    hours: 0,
    weeks: 2.5,
    cost: -1,
    duration: 0,
  });
  assert.deepEqual(p, defaults);
  assert.deepEqual(sanitizeInputs(null), defaults);
  assert.deepEqual(sanitizeInputs([]), defaults);
  assert.equal(sanitizeInputs({ ...defaults, hours: 7.5 }).hours, 7.5);
});
