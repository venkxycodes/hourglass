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
numbers from 1–52. Comparison duration uses whole positive days. Costs, income,
and saved hours cannot be negative. Invalid drafts show an inline error and
keep the last valid calculation; leaving the field restores its valid value.
Saving is disabled while an active numeric field is invalid. Stored numeric
values are checked against the same rules when loaded.
