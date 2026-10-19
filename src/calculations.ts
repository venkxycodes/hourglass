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
