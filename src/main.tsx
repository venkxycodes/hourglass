import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { calculate, defaults, type Inputs } from "./calculations";
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
  const [p, setP] = useState<Inputs>(() => {
    const raw = read<Inputs>("hourglass-inputs", defaults);
    return {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(raw).filter(
          ([key, v]) =>
            typeof v === typeof defaults[key as keyof Inputs] &&
            (typeof v !== "number" || (Number.isFinite(v) && v >= 0)),
        ),
      ),
    } as Inputs;
  });
  const [saved, setSaved] = useState<Inputs[]>(() =>
    read<Inputs[]>("hourglass-saved", []),
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
    key: keyof Inputs,
    options: {
      suffix?: string;
      min?: number;
      max?: number;
      step?: number;
    } = {},
  ) => (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type="number"
          min={options.min ?? 0}
          max={options.max}
          step={options.step ?? "any"}
          value={p[key] as number}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n))
              update(
                key,
                Math.max(
                  options.min ?? 0,
                  Math.min(options.max ?? Number.MAX_SAFE_INTEGER, n),
                ) as never,
              );
          }}
        />
        {options.suffix && <span>{options.suffix}</span>}
      </div>
    </label>
  );
  const store = () => {
    const next = [{ ...p }, ...saved].slice(0, 12);
    setSaved(next);
    try {
      localStorage.setItem("hourglass-saved", JSON.stringify(next));
      setNotice("Comparison saved on this device.");
    } catch {
      setNotice("Saved for this session. Browser storage is unavailable.");
    }
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
          <span className="brand-icon">◷</span> hourglass
          <span className="brand-dot">.</span>
        </a>
        <span className="header-note">
          A little clarity for life's tradeoffs
        </span>
        <span className="local-badge">
          <i /> Private by design
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">Your time. Your call.</div>
            <h1>Make room for what matters.</h1>
            <p>Put a value on your time. Make the tradeoff with confidence.</p>
          </div>
          <div className="intro-mark" aria-hidden="true">
            ↗
          </div>
        </div>
        <div className="workspace">
          <aside>
            <section className="profile">
              <div className="section-heading">
                <span className="small-icon">◷</span>
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
            <div className="aside-note">
              <span>✧</span>
              <p>
                Money comes back.
                <br />
                Your time is a little different.
              </p>
            </div>
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
                          {s.currency} {s.cost.toLocaleString()} extra ·{" "}
                          {s.saved} hours saved
                        </p>
                      </div>
                      <button
                        onClick={() => {
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
                      <h2>What are you weighing up?</h2>
                      <p className="muted">
                        Compare spending a little more with getting time back.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setP({
                          ...p,
                          name: defaults.name,
                          cost: 11000,
                          duration: 6,
                          saved: 12,
                        });
                        setNotice("Accommodation example loaded.");
                      }}
                    >
                      Load example ↺
                    </button>
                  </div>
                  <label className="field">
                    <span>Give your decision a name</span>
                    <input
                      value={p.name}
                      maxLength={100}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Stay closer to work"
                    />
                  </label>
                  <div className="scenario-inputs">
                    {field("Extra cost for the whole stay", "cost", {
                      suffix: p.currency,
                    })}
                    {field("Total time saved", "saved", { suffix: "hours" })}
                    {field("Over how many days?", "duration", {
                      min: 1,
                      step: 1,
                    })}
                  </div>
                  <div className="scenario-summary">
                    <span>⇄</span>
                    <p>
                      Spend <strong>{money(p.cost)}</strong> more to get{" "}
                      <strong>{p.saved} hours</strong> back over{" "}
                      <strong>{p.duration} days</strong>.<br />
                      <span>
                        That's {(p.saved / p.duration).toFixed(1)} hours saved
                        per day. Include both commute directions.
                      </span>
                    </p>
                  </div>
                </section>
                <section className={`result ${r.net < 0 ? "negative" : ""}`}>
                  <div className="result-heading">
                    <span className="result-tag">
                      {r.net > 0
                        ? "Time well bought"
                        : r.net < 0
                          ? "Keep the savings"
                          : "An even trade"}
                    </span>
                    <span>At {money(r.rate, true)} / hr</span>
                  </div>
                  <h2>
                    {r.net > 0
                      ? "The extra spend is worth your time."
                      : r.net < 0
                        ? "The savings are worth the extra time."
                        : "Both options balance out."}
                  </h2>
                  <p>
                    {r.net > 0
                      ? "The value of the time you get back exceeds the extra cost."
                      : r.net < 0
                        ? "At your current time value, the extra cost exceeds the time saved."
                        : "The time saved has the same estimated value as the extra cost."}
                  </p>
                  <div className="result-math">
                    <div>
                      <span>Value of {p.saved} hours saved</span>
                      <strong>{money(r.timeValue)}</strong>
                    </div>
                    <b>−</b>
                    <div>
                      <span>Extra cost</span>
                      <strong>{money(p.cost)}</strong>
                    </div>
                    <b>=</b>
                    <div className="net">
                      <span>
                        Estimated net {r.net < 0 ? "cost" : "benefit"}
                      </span>
                      <strong>{money(Math.abs(r.net))}</strong>
                    </div>
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
                    <span className="chart-icon">⌁</span>
                  </div>
                  {r.threshold === null ? (
                    <p>
                      No time is saved. Add saved hours to calculate a
                      break-even point.
                    </p>
                  ) : (
                    <>
                      <div className="threshold-copy">
                        The extra spend pays off when your time is worth{" "}
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
                        <span>Keep the savings</span>
                        <span>Buy back your time</span>
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
                    <button className="primary" onClick={store}>
                      Save comparison <span>＋</span>
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
              working weeks). Net benefit = hours saved × hourly time value −
              extra cost. Break-even = extra cost ÷ hours saved. Currency
              selection changes the denomination; it does not convert amounts.
              All data stays in this browser.
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
