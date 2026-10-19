export type Inputs = {
  salary: number;
  days: number;
  hours: number;
  weeks: number;
  currency: string;
  custom: boolean;
  value: number;
  name: string;
  cost: number;
  duration: number;
  saved: number;
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
  cost: 11000,
  duration: 6,
  saved: 12,
};
export function calculate(p: Inputs) {
  const annualHours = p.days * p.hours * p.weeks;
  const hourly = annualHours > 0 ? p.salary / annualHours : 0;
  const rate = p.custom ? p.value : hourly;
  const timeValue = p.saved * rate;
  return {
    annualHours,
    hourly,
    rate,
    timeValue,
    net: timeValue - p.cost,
    threshold: p.saved > 0 ? p.cost / p.saved : null,
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
  cost: { min: 0, max: Number.MAX_SAFE_INTEGER },
  duration: { min: 1, max: Number.MAX_SAFE_INTEGER, step: 1 },
  saved: { min: 0, max: Number.MAX_SAFE_INTEGER },
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
  const values = raw as Record<string, unknown>;
  for (const key of Object.keys(numericRules) as NumericKey[]) {
    const value = values[key];
    if (
      typeof value === "number" &&
      validateNumber(key, String(value)) === null
    )
      result[key] = value;
  }
  if (typeof values.name === "string") result.name = values.name.slice(0, 100);
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
