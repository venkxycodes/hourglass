export type PeriodUnit = "day" | "month" | "year";
export type Frequency = "use" | "day" | "week" | "month" | "year";
export const periodDays = { day: 1, month: 365 / 12, year: 365 };
export type Inputs = {
  salary: number;
  days: number;
  hours: number;
  weeks: number;
  currency: string;
  custom: boolean;
  value: number;
  name: string;
  aCost: number;
  bCost: number;
  aRecurring: number;
  bRecurring: number;
  aResale: number;
  bResale: number;
  aMinutes: number;
  bMinutes: number;
  totalUses: number;
  aName: string;
  bName: string;
  aFrequency: Frequency;
  bFrequency: Frequency;
  periodUnit: PeriodUnit;
  duration: number;
};
export const defaults: Inputs = {
  salary: 2400000,
  days: 5,
  hours: 8,
  weeks: 48,
  currency: "INR",
  custom: false,
  value: 1250,
  name: "Stay closer to work",
  aName: "Stay farther away",
  bName: "Stay closer to work",
  aCost: 0,
  bCost: 11000,
  aRecurring: 0,
  bRecurring: 0,
  aResale: 0,
  bResale: 0,
  aMinutes: 60,
  bMinutes: 0,
  totalUses: 12,
  aFrequency: "month",
  bFrequency: "month",
  periodUnit: "day",
  duration: 6,
};
export function calculate(p: Inputs) {
  const annualHours = p.days * p.hours * p.weeks;
  const hourly = annualHours > 0 ? p.salary / annualHours : 0;
  const rate = p.custom ? p.value : hourly;
  const days = p.duration * periodDays[p.periodUnit];
  const occurrences = (frequency: Frequency) =>
    frequency === "use"
      ? p.totalUses
      : days / { day: 1, week: 7, month: 365 / 12, year: 365 }[frequency];
  const aCost = p.aCost + p.aRecurring * occurrences(p.aFrequency) - p.aResale;
  const bCost = p.bCost + p.bRecurring * occurrences(p.bFrequency) - p.bResale;
  const aHours = (p.aMinutes * p.totalUses) / 60;
  const bHours = (p.bMinutes * p.totalUses) / 60;
  const timeSaved = aHours - bHours;
  const costDelta = bCost - aCost;
  const timeValue = timeSaved * rate;
  const net = timeValue - costDelta;
  const threshold =
    timeSaved !== 0 && costDelta / timeSaved > 0 ? costDelta / timeSaved : null;
  const winner: "a" | "b" | null =
    Math.abs(net) < 0.000001 ? null : net > 0 ? "b" : "a";
  const dominant: "a" | "b" | null =
    aCost <= bCost && aHours <= bHours && (aCost < bCost || aHours < bHours)
      ? "a"
      : bCost <= aCost && bHours <= aHours && (bCost < aCost || bHours < aHours)
        ? "b"
        : null;
  return {
    annualHours,
    hourly,
    rate,
    aCost,
    bCost,
    aHours,
    bHours,
    timeSaved,
    costDelta,
    timeValue,
    net,
    threshold,
    winner,
    dominant,
  };
}

export type NumericKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never;
}[keyof Inputs];
export const numericRules: Record<
  NumericKey,
  { min: number; max: number; step?: number }
> = {
  salary: { min: 0, max: Number.MAX_SAFE_INTEGER },
  days: { min: 1, max: 7, step: 1 },
  hours: { min: 0.5, max: 24, step: 0.5 },
  weeks: { min: 1, max: 52, step: 1 },
  value: { min: 0, max: Number.MAX_SAFE_INTEGER },
  aCost: { min: 0, max: Number.MAX_SAFE_INTEGER },
  bCost: { min: 0, max: Number.MAX_SAFE_INTEGER },
  aRecurring: { min: 0, max: Number.MAX_SAFE_INTEGER },
  bRecurring: { min: 0, max: Number.MAX_SAFE_INTEGER },
  aResale: { min: 0, max: Number.MAX_SAFE_INTEGER },
  bResale: { min: 0, max: Number.MAX_SAFE_INTEGER },
  aMinutes: { min: 0, max: Number.MAX_SAFE_INTEGER },
  bMinutes: { min: 0, max: Number.MAX_SAFE_INTEGER },
  totalUses: { min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
  duration: { min: 1, max: Number.MAX_SAFE_INTEGER, step: 1 },
};
export function validateNumber(key: NumericKey, raw: string): string | null {
  if (!raw.trim()) return "Enter a value.";
  if (!/^\d+(\.\d+)?$/.test(raw)) return "Enter a positive number or zero.";
  const n = Number(raw);
  const { min, max, step } = numericRules[key];
  if (!Number.isFinite(n) || n < min || n > max)
    return `Enter a value between ${min} and ${max}.`;
  if (step && Math.abs(n / step - Math.round(n / step)) > 1e-8)
    return step === 1 ? "Enter a whole number." : `Use increments of ${step}.`;
  return null;
}
export function sanitizeInputs(raw: unknown): Inputs {
  const result = { ...defaults };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;
  const values = { ...raw } as Record<string, unknown>;
  // Translate old extra-cost/time-saved scenarios into equivalent two-option totals.
  if (!("aCost" in values) && ("cost" in values || "saved" in values)) {
    Object.assign(values, {
      aCost: 0,
      bCost: values.cost,
      aMinutes: typeof values.saved === "number" ? values.saved * 60 : 0,
      bMinutes: 0,
      totalUses: 1,
      aName: "Original option",
      bName: typeof values.name === "string" ? values.name : "Alternative",
      periodUnit: "day",
    });
  }
  for (const key of Object.keys(numericRules) as NumericKey[]) {
    const value = values[key];
    if (
      typeof value === "number" &&
      validateNumber(key, String(value)) === null
    )
      result[key] = value;
  }
  if (typeof values.name === "string") result.name = values.name.slice(0, 100);
  for (const key of ["aName", "bName"] as const)
    if (typeof values[key] === "string")
      result[key] = values[key].slice(0, 100);
  for (const key of ["aFrequency", "bFrequency"] as const)
    if (["use", "day", "week", "month", "year"].includes(String(values[key])))
      result[key] = values[key] as Frequency;
  if (["day", "month", "year"].includes(String(values.periodUnit)))
    result.periodUnit = values.periodUnit as PeriodUnit;
  if (typeof values.custom === "boolean") result.custom = values.custom;
  if (
    typeof values.currency === "string" &&
    /^[A-Z]{3}$/.test(values.currency)
  ) {
    try {
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: values.currency,
      });
      result.currency = values.currency;
    } catch {}
  }
  return result;
}
