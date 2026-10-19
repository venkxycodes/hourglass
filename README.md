# Hourglass

Frontend-only React + TypeScript app for evaluating time versus money. Includes annual compensation and work schedule inputs, currency formatting, custom time value, a live tradeoff calculator, break-even exploration, and browser-local saved comparisons.

## Run

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and builds `dist/`. `npm test` verifies the calculation model. No backend, accounts, analytics, or API keys. Font files load from Google Fonts, with system fallbacks. Currency selection does not convert entered amounts. Compensation is a user-entered baseline, not tax or financial advice.

## Development guidance

See [AGENTS.md](AGENTS.md). Repo-local skills are in [.agents/skills](.agents/skills):

- `frontend-design`, copied from the almamater project with its Apache 2.0 license.
- `code-simplification`, copied from the memoir project.

The interface uses a restrained navy and blue palette. Decorative arrows and
ornaments are intentionally omitted; calculation and chart symbols convey meaning.

Numeric fields support direct typing. Workdays are whole numbers from 1–7;
hours per day use half-hour increments from 0.5–24; working weeks are whole
numbers from 1–52. Evaluation duration uses whole positive days, months, or years; total uses is a nonnegative whole number. Costs, income,
resale inputs, and minutes per use cannot be negative. Invalid drafts show an inline error and
keep the last valid calculation; leaving the field restores its valid value.
Saving is disabled while an active numeric field is invalid. Stored numeric
values are checked against the same rules when loaded.

## Comparing two options

Name both options and choose a shared evaluation period and total number of uses.
Each option includes one-time cost and minutes per use. Expand **Recurring costs &
resale** to add operating expenses per use/day/week/month/year and the expected
resale value at the end of the period. Combine recurring expenses into the selected
frequency (for example, monthly fuel plus annual maintenance divided by 12).

Total cost is one-time cost plus recurring costs minus resale value. Total time is
minutes per use times uses, divided by 60. The recommendation minimizes total cost
plus time multiplied by your hourly value. Monetary cost and time differences are
shown separately. A positive hourly break-even exists when the faster option costs
more; if one option is no more expensive and no slower, it dominates the other.

Recurring costs are prorated continuously, using 365 days/year and 365/12 days/month;
per-use costs scale with the entered use count. This is an estimate, without financing,
inflation, or discounted cash flows. One-way trips count as separate uses. Zero-cost
and zero-time options are supported. Older saved scenarios migrate to equivalent
cost and time totals (one use representing all previously saved hours).

The accommodation example compares an extra 11,000 for 12 hours saved over six days.
The illustrative vehicle example compares 40-minute walks with 10-minute trips over
1,500 uses in three years, including a 90,000 purchase, 2,000/month running costs,
and 40,000 resale value. All example amounts use the currently selected currency;
replace them with your estimates.
