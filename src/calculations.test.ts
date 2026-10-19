import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculate,
  defaults,
  sanitizeInputs,
  validateNumber,
  type Inputs,
} from "./calculations.ts";
const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
test("accommodation: extra 11000 saves 12 hours", () => {
  const r = calculate(defaults);
  assert.equal(r.hourly, 1250);
  assert.equal(r.timeSaved, 12);
  assert.equal(r.costDelta, 11000);
  assert.equal(r.net, 4000);
  near(r.threshold!, 11000 / 12);
  assert.equal(r.winner, "b");
});
test("vehicle purchase, monthly operating costs and resale across three years", () => {
  const r = calculate({
    ...defaults,
    duration: 3,
    periodUnit: "year",
    totalUses: 1500,
    aCost: 0,
    bCost: 90000,
    aMinutes: 40,
    bMinutes: 10,
    bRecurring: 2000,
    bFrequency: "month",
    bResale: 40000,
  });
  near(r.bCost, 122000);
  assert.equal(r.aHours, 1000);
  assert.equal(r.bHours, 250);
  near(r.threshold!, 122000 / 750);
  assert.equal(r.winner, "b");
});
test("changing the time value can reverse the decision", () =>
  assert.equal(
    calculate({ ...defaults, custom: true, value: 500 }).winner,
    "a",
  ));
test("option order does not change the actual recommendation", () => {
  const reversed: Inputs = {
    ...defaults,
    aName: defaults.bName,
    bName: defaults.aName,
    aCost: defaults.bCost,
    bCost: defaults.aCost,
    aMinutes: defaults.bMinutes,
    bMinutes: defaults.aMinutes,
  };
  const r = calculate(reversed);
  assert.equal(r.winner, "a");
  assert.equal(r.net, -4000);
  near(r.threshold!, 11000 / 12);
});
test("both options have costs; per-use expenses scale with usage", () => {
  const r = calculate({
    ...defaults,
    aCost: 200,
    bCost: 500,
    aRecurring: 10,
    bRecurring: 20,
    aFrequency: "use",
    bFrequency: "use",
    totalUses: 5,
  });
  assert.equal(r.aCost, 250);
  assert.equal(r.bCost, 600);
  assert.equal(r.costDelta, 350);
});
test("daily, weekly, monthly and yearly expenses share a consistent period", () => {
  for (const [frequency, amount] of [
    ["day", 1],
    ["week", 7],
    ["month", 365 / 12],
    ["year", 365],
  ] as const) {
    near(
      calculate({
        ...defaults,
        duration: 1,
        periodUnit: "year",
        bCost: 0,
        bRecurring: amount,
        bFrequency: frequency,
      }).bCost,
      365,
    );
  }
});
test("equal time chooses lower cost without a threshold", () => {
  const r = calculate({ ...defaults, aMinutes: 10, bMinutes: 10 });
  assert.equal(r.threshold, null);
  assert.equal(r.winner, "a");
  assert.equal(r.dominant, "a");
});
test("faster and cheaper option needs no hourly break-even", () => {
  const r = calculate({ ...defaults, aCost: 12000, bCost: 11000 });
  assert.equal(r.dominant, "b");
  assert.equal(r.threshold, null);
  assert.equal(r.winner, "b");
});
test("identical options and zero uses produce safe ties", () => {
  const r = calculate({ ...defaults, bCost: 0, totalUses: 0 });
  assert.equal(r.net, 0);
  assert.equal(r.winner, null);
  assert.equal(r.threshold, null);
});
test("free time, zero price and net resale credit are valid", () => {
  const r = calculate({
    ...defaults,
    custom: true,
    value: 0,
    bCost: 0,
    bResale: 100,
  });
  assert.equal(r.bCost, -100);
  assert.equal(r.winner, "b");
});
test("schedule validation rejects unsupported values", () => {
  for (const raw of ["0", "8", "2.5", "-1", "", "abc", "Infinity", "1e2"])
    assert.notEqual(validateNumber("days", raw), null);
  for (const raw of ["1", "5", "7"])
    assert.equal(validateNumber("days", raw), null);
  for (const raw of ["0.5", "7.5", "24"])
    assert.equal(validateNumber("hours", raw), null);
  for (const raw of ["0", "24.5", "7.25"])
    assert.notEqual(validateNumber("hours", raw), null);
  assert.notEqual(validateNumber("duration", "0"), null);
  assert.notEqual(validateNumber("totalUses", "2.5"), null);
  assert.equal(validateNumber("bCost", "0"), null);
  assert.notEqual(validateNumber("aRecurring", "-1"), null);
});
test("stored data is validated and new fields survive reload", () => {
  assert.deepEqual(sanitizeInputs(null), defaults);
  assert.deepEqual(
    sanitizeInputs({ ...defaults, days: 8, hours: 0, aCost: -1 }),
    defaults,
  );
  const p = {
    ...defaults,
    bRecurring: 120,
    bFrequency: "year" as const,
    periodUnit: "month" as const,
  };
  assert.deepEqual(sanitizeInputs(p), p);
  assert.equal(
    sanitizeInputs({ ...defaults, bFrequency: "invalid" }).bFrequency,
    "month",
  );
});
test("legacy saved comparisons retain their monetary and time differences", () => {
  const p = sanitizeInputs({
    salary: 2400000,
    days: 5,
    hours: 8,
    weeks: 48,
    cost: 11000,
    saved: 12,
    duration: 6,
    name: "Old stay",
  });
  const r = calculate(p);
  assert.equal(r.costDelta, 11000);
  assert.equal(r.timeSaved, 12);
  assert.equal(r.net, 4000);
  assert.equal(p.bName, "Old stay");
});
