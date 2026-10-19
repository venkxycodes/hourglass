import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  calculate,
  defaults,
  sanitizeInputs,
  validateNumber,
  numericRules,
  type NumericKey,
  type Inputs,
  type Frequency,
  type PeriodUnit,
} from "./calculations";
import "./styles.css";
function read<T>(key: string, fallback: T): T {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
const currencyCodes = (
  Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
).supportedValuesOf?.("currency") || [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AED",
  "CAD",
  "AUD",
  "SGD",
];
function App() {
  const [p, setP] = useState<Inputs>(() =>
    sanitizeInputs(read<unknown>("hourglass-inputs", defaults)),
  );
  const [saved, setSaved] = useState<Inputs[]>(() => {
    const raw = read<unknown>("hourglass-saved", []);
    return Array.isArray(raw)
      ? raw
          .filter((v) => v && typeof v === "object" && !Array.isArray(v))
          .slice(0, 12)
          .map(sanitizeInputs)
      : [];
  });
  const [drafts, setDrafts] = useState<Partial<Record<NumericKey, string>>>({});
  const hasInvalid = Object.entries(drafts).some(
    ([key, value]) =>
      (key !== "value" || p.custom) &&
      validateNumber(key as NumericKey, value!) !== null,
  );
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("compare");
  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    const next = { ...p, [key]: value };
    setP(next);
    try {
      localStorage.setItem("hourglass-inputs", JSON.stringify(next));
    } catch {
      setNotice(
        "Browser storage is unavailable. Changes work for this session.",
      );
    }
  };
  const r = calculate(p);
  const money = (v: number, precise = false) => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: p.currency,
        maximumFractionDigits: precise ? 2 : 0,
      }).format(v);
    } catch {
      return `${p.currency} ${v.toFixed(2)}`;
    }
  };
  const field = (
    label: string,
    key: NumericKey,
    options: {
      suffix?: string;
      min?: number;
      max?: number;
      step?: number;
    } = {},
  ) => {
    const raw = drafts[key] ?? String(p[key]);
    const error = validateNumber(key, raw);
    return (
      <label className="field">
        <span>{label}</span>
        <div className="input-wrap">
          <input
            type="text"
            inputMode={numericRules[key].step === 1 ? "numeric" : "decimal"}
            value={raw}
            aria-invalid={!!error}
            aria-describedby={error ? `${key}-error` : undefined}
            onChange={(e) => {
              const value = e.target.value;
              setDrafts((previous) => ({ ...previous, [key]: value }));
              if (validateNumber(key, value) === null)
                update(key, Number(value));
            }}
            onBlur={() => {
              setDrafts((previous) => {
                const next = { ...previous };
                delete next[key];
                return next;
              });
            }}
          />
          {options.suffix && <span>{options.suffix}</span>}
        </div>
        {error && (
          <span className="field-error" id={`${key}-error`}>
            {error} The last valid value is used.
          </span>
        )}
      </label>
    );
  };
  const store = () => {
    if (hasInvalid) return;
    const next = [{ ...p }, ...saved].slice(0, 12);
    setSaved(next);
    try {
      localStorage.setItem("hourglass-saved", JSON.stringify(next));
      setNotice("Comparison saved on this device.");
    } catch {
      setNotice("Saved for this session. Browser storage is unavailable.");
    }
  };
  const optionName = (side: "a" | "b") =>
    p[`${side}Name`].trim() || `Option ${side.toUpperCase()}`;
  const faster = r.timeSaved >= 0 ? optionName("b") : optionName("a");
  const cheaper = r.costDelta >= 0 ? optionName("a") : optionName("b");
  const winnerName = r.winner ? optionName(r.winner) : "Both options";
  const loadExample = (vehicle: boolean) => {
    setDrafts({});
    const next: Inputs = {
      ...defaults,
      salary: p.salary,
      days: p.days,
      hours: p.hours,
      weeks: p.weeks,
      currency: p.currency,
      custom: p.custom,
      value: p.value,
    };
    if (vehicle)
      Object.assign(next, {
        name: "Vehicle or walking",
        aName: "Walk",
        bName: "Buy a vehicle",
        aMinutes: 40,
        bMinutes: 10,
        bCost: 90000,
        bRecurring: 2000,
        bFrequency: "month",
        bResale: 40000,
        duration: 3,
        periodUnit: "year",
        totalUses: 1500,
      });
    setP(next);
    try {
      localStorage.setItem("hourglass-inputs", JSON.stringify(next));
    } catch {}
    setNotice(
      `${vehicle ? "Vehicle" : "Accommodation"} example loaded. Replace the illustrative amounts with your estimates.`,
    );
  };
  const maxRate = Math.max(
    r.hourly * 2,
    (r.threshold ?? 0) * 2,
    p.custom ? p.value : 0,
    1,
  );
  return (
    <>
      <header>
        <a href="#" className="brand">
          hourglass
          <span className="brand-dot">.</span>
        </a>
        <span className="header-note">
          A little clarity for life's tradeoffs
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <h1>Make informed decisions</h1>
            <p>Choose between time and money, backed by data.</p>
          </div>
        </div>
        <div className="workspace">
          <aside>
            <section className="profile">
              <div className="section-heading">
                <h2>Your time, valued</h2>
              </div>
              <p className="muted">Start with your working life.</p>
              <label className="field">
                <span>Currency</span>
                <select
                  value={p.currency}
                  onChange={(e) => update("currency", e.target.value)}
                >
                  {currencyCodes.map((c) => (
                    <option key={c} value={c}>
                      {c}{" "}
                      {(
                        {
                          INR: "— Indian rupee",
                          USD: "— US dollar",
                          GBP: "— British pound",
                          EUR: "— Euro",
                        } as Record<string, string>
                      )[c] || ""}
                    </option>
                  ))}
                </select>
              </label>
              {field("Annual compensation", "salary")}
              <div className="two-fields">
                {field("Workdays / week", "days", { min: 1, max: 7, step: 1 })}
                {field("Hours / day", "hours", {
                  min: 0.5,
                  max: 24,
                  step: 0.5,
                })}
              </div>
              {field("Working weeks / year", "weeks", {
                min: 1,
                max: 52,
                step: 1,
              })}
              <p className="input-note">
                48 weeks allows for about 4 weeks of leave and holidays. Use
                gross or take-home pay consistently.
              </p>
              <div className="rate-block">
                <span>Your baseline hourly rate</span>
                <strong>
                  {money(r.hourly, true)}
                  <small>/ hr</small>
                </strong>
                <span>
                  {r.annualHours.toLocaleString()} working hours per year
                </span>
              </div>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={p.custom}
                  onChange={(e) => update("custom", e.target.checked)}
                />
                <span>Set my own time value</span>
              </label>
              {p.custom &&
                field("Personal hourly value", "value", { suffix: "/ hr" })}
              <p className="input-note">
                Your free time can be worth more than your salary. You decide.
              </p>
            </section>
          </aside>
          <div className="main-column">
            <nav className="tabs" aria-label="Workspace">
              <button
                className={tab === "compare" ? "active" : ""}
                onClick={() => setTab("compare")}
              >
                The comparison
              </button>
              <button
                className={tab === "saved" ? "active" : ""}
                onClick={() => setTab("saved")}
              >
                Saved comparisons <span>{saved.length}</span>
              </button>
            </nav>
            {tab === "saved" ? (
              <section className="card saved-list">
                <h2>Your past what-ifs</h2>
                <p className="muted">Saved locally, ready to revisit.</p>
                {saved.length === 0 ? (
                  <p className="empty">
                    Your first decision starts with a comparison.
                    <button onClick={() => setTab("compare")}>
                      Create a comparison
                    </button>
                  </p>
                ) : (
                  saved.map((s, i) => (
                    <div className="saved-row" key={i}>
                      <div>
                        <strong>{s.name}</strong>
                        <p>
                          {s.aName} vs {s.bName} · {s.duration} {s.periodUnit}
                          {s.duration === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        className="saved-open"
                        aria-label={`Open ${s.name}`}
                        onClick={() => {
                          setDrafts({});
                          setP(s);
                          setTab("compare");
                          try {
                            localStorage.setItem(
                              "hourglass-inputs",
                              JSON.stringify(s),
                            );
                          } catch {}
                        }}
                      >
                        Open
                      </button>
                      <button
                        aria-label={`Delete ${s.name}`}
                        onClick={() => {
                          const next = saved.filter((_, j) => i !== j);
                          setSaved(next);
                          try {
                            localStorage.setItem(
                              "hourglass-saved",
                              JSON.stringify(next),
                            );
                          } catch {}
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </section>
            ) : (
              <>
                <section className="card scenario">
                  <div className="card-title">
                    <div>
                      <h2>Compare your options</h2>
                      <p className="muted">
                        Account for the money and time required on both sides.
                      </p>
                    </div>
                  </div>
                  <div className="example-buttons">
                    <span>Try an example</span>
                    <button
                      className="text-button"
                      onClick={() => loadExample(false)}
                    >
                      Accommodation
                    </button>
                    <button
                      className="text-button"
                      onClick={() => loadExample(true)}
                    >
                      Vehicle vs walking
                    </button>
                  </div>
                  <label className="field">
                    <span>Decision name</span>
                    <input
                      value={p.name}
                      maxLength={100}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </label>
                  <div className="period-inputs">
                    {field("Evaluation period", "duration")}
                    <label className="field">
                      <span>Period unit</span>
                      <select
                        value={p.periodUnit}
                        onChange={(e) =>
                          update("periodUnit", e.target.value as PeriodUnit)
                        }
                      >
                        <option value="day">Days</option>
                        <option value="month">Months</option>
                        <option value="year">Years</option>
                      </select>
                    </label>
                    {field("Total uses over this period", "totalUses")}
                  </div>
                  <p className="input-note">
                    Count one-way trips separately. For example, 2 trips a day
                    for 6 days = 12 uses. Both options use this same count.
                  </p>
                  <div className="option-grid">
                    {(["a", "b"] as const).map((side) => (
                      <section
                        className="option-panel"
                        key={side}
                        aria-label={`Option ${side.toUpperCase()}`}
                      >
                        <h3>Option {side.toUpperCase()}</h3>
                        <label className="field">
                          <span>Option {side.toUpperCase()} name</span>
                          <input
                            value={p[`${side}Name`]}
                            maxLength={100}
                            onChange={(e) =>
                              update(`${side}Name`, e.target.value)
                            }
                          />
                        </label>
                        {field("One-time cost", `${side}Cost`, {
                          suffix: p.currency,
                        })}
                        {field("Time per use", `${side}Minutes`, {
                          suffix: "min",
                        })}
                        <details className="option-extras">
                          <summary>Recurring costs & resale</summary>
                          {field("Recurring expenses", `${side}Recurring`, {
                            suffix: p.currency,
                          })}
                          <label className="field">
                            <span>Expense frequency</span>
                            <select
                              value={p[`${side}Frequency`]}
                              onChange={(e) =>
                                update(
                                  `${side}Frequency`,
                                  e.target.value as Frequency,
                                )
                              }
                            >
                              <option value="use">Per use</option>
                              <option value="day">Per day</option>
                              <option value="week">Per week</option>
                              <option value="month">Per month</option>
                              <option value="year">Per year</option>
                            </select>
                          </label>
                          {field(
                            "Resale value at end of period",
                            `${side}Resale`,
                            { suffix: p.currency },
                          )}
                          <p className="input-note">
                            Combine expenses with the same frequency, or convert
                            them to one frequency first. Resale value reduces
                            total cost.
                          </p>
                        </details>
                        {(p[`${side}Recurring`] > 0 ||
                          p[`${side}Resale`] > 0) && (
                          <p className="expense-summary">
                            Includes {money(p[`${side}Recurring`])} per{" "}
                            {p[`${side}Frequency`]} in expenses;{" "}
                            {money(p[`${side}Resale`])} resale value deducted.
                          </p>
                        )}
                        <div className="option-totals">
                          <span>
                            Total cost{" "}
                            <strong>
                              {money(side === "a" ? r.aCost : r.bCost)}
                            </strong>
                          </span>
                          <span>
                            Total time{" "}
                            <strong>
                              {(side === "a"
                                ? r.aHours
                                : r.bHours
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}{" "}
                              hr
                            </strong>
                          </span>
                        </div>
                      </section>
                    ))}
                  </div>
                  <p className="period-note">
                    Recurring costs are prorated over the full period. A year is
                    365 days; a month is 1/12 of a year. Estimates exclude
                    financing, inflation, and the timing of payments.
                  </p>
                </section>
                <section className="result">
                  <div className="result-heading">
                    <span className="result-tag">
                      {r.dominant
                        ? "Lower cost and time"
                        : r.winner
                          ? "Estimated best value"
                          : "An even trade"}
                    </span>
                    <span>At {money(r.rate, true)} / hr</span>
                  </div>
                  <h2>
                    {r.winner
                      ? `${winnerName} offers better overall value.`
                      : "Both options balance out."}
                  </h2>
                  <p>
                    {r.dominant
                      ? `${optionName(r.dominant)} costs no more and takes no longer over this period; at least one is lower.`
                      : "Total cost plus the value of time spent determines the result."}
                  </p>
                  <div className="comparison-results">
                    <div>
                      <span>{optionName("a")} · cost + time value</span>
                      <strong>{money(r.aCost + r.aHours * r.rate)}</strong>
                    </div>
                    <div>
                      <span>{optionName("b")} · cost + time value</span>
                      <strong>{money(r.bCost + r.bHours * r.rate)}</strong>
                    </div>
                  </div>
                  <div className="result-differences">
                    <p>
                      {Math.abs(r.timeSaved) < 0.000001
                        ? "Both take the same time."
                        : `${faster} saves ${Math.abs(r.timeSaved).toLocaleString(undefined, { maximumFractionDigits: 2 })} hours.`}{" "}
                      {Math.abs(r.costDelta) < 0.000001
                        ? "Both cost the same."
                        : `${cheaper} costs ${money(Math.abs(r.costDelta))} less.`}
                    </p>
                    <strong>
                      {money(Math.abs(r.net))} estimated net benefit
                      {r.winner ? ` with ${winnerName}` : ""}
                    </strong>
                  </div>
                  <div className="result-foot">
                    An estimate of value, not cash profit. Saved time earns
                    money only if you use it to earn more.
                  </div>
                </section>
                <section className="card threshold">
                  <div className="card-title">
                    <div>
                      <h2>Where does it become worth it?</h2>
                      <p className="muted">
                        Your break-even point, at a glance.
                      </p>
                    </div>
                  </div>
                  {r.threshold === null ? (
                    <p>
                      {r.timeSaved === 0
                        ? "Both options take the same time. Compare their total costs."
                        : `${faster} is also no more expensive. There is no positive hourly break-even point.`}
                    </p>
                  ) : (
                    <>
                      <div className="threshold-copy">
                        {faster} costs {money(Math.abs(r.costDelta))} more and
                        saves{" "}
                        {Math.abs(r.timeSaved).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        hours. It becomes worth the extra spend when your time
                        is valued at{" "}
                        <strong>{money(r.threshold, true)}/hr</strong> or more.
                      </div>
                      <div
                        className="chart"
                        role="img"
                        aria-label={`Break-even ${money(r.threshold, true)} per hour. Your time ${money(r.rate, true)} per hour.`}
                      >
                        <div
                          className="chart-zone"
                          style={{ left: `${(r.threshold / maxRate) * 100}%` }}
                        />
                        <div className="chart-line" />
                        <div
                          className="threshold-marker"
                          style={{ left: `${(r.threshold / maxRate) * 100}%` }}
                        >
                          <span>Break-even</span>
                          <i />
                          <small>{money(r.threshold)}</small>
                        </div>
                        <div
                          className="you-marker"
                          style={{ left: `${(r.rate / maxRate) * 100}%` }}
                        >
                          <span>Your time</span>
                          <i />
                          <small>{money(r.rate)}</small>
                        </div>
                      </div>
                      <div className="chart-labels">
                        <span>{cheaper}</span>
                        <span>{faster}</span>
                      </div>
                      <label className="slider-label" htmlFor="time-slider">
                        Explore your hourly time value{" "}
                        <strong>{money(r.rate, true)}</strong>
                      </label>
                      <input
                        id="time-slider"
                        className="slider"
                        type="range"
                        min="0"
                        max={Math.ceil(maxRate)}
                        step="1"
                        value={r.rate}
                        onChange={(e) => {
                          const next = {
                            ...p,
                            custom: true,
                            value: Number(e.target.value),
                          };
                          setDrafts((previous) => {
                            const next = { ...previous };
                            delete next.value;
                            return next;
                          });
                          setP(next);
                          try {
                            localStorage.setItem(
                              "hourglass-inputs",
                              JSON.stringify(next),
                            );
                          } catch {}
                        }}
                      />
                    </>
                  )}
                  <div className="actions">
                    <span>Comfort, energy, and peace of mind count, too.</span>
                    <button
                      className="primary"
                      disabled={hasInvalid}
                      onClick={store}
                    >
                      Save comparison
                    </button>
                  </div>
                </section>
              </>
            )}
            <div className="notice" role="status">
              {notice}
            </div>
          </div>
        </div>
        <footer>
          <span>
            hourglass. <span>Thoughtful decisions, more living.</span>
          </span>
          <details>
            <summary>How the math works</summary>
            <p>
              Hourly rate = annual compensation ÷ (workdays × hours per day ×
              working weeks). Total cost = one-time cost + recurring expenses −
              resale value. Total time = minutes per use × total uses ÷ 60.
              Choose the lower total of cost + time × hourly value. Break-even =
              extra cost ÷ hours saved, when the faster option costs more.
              Currency selection changes the denomination; it does not convert
              amounts. All data stays in this browser.
            </p>
          </details>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
