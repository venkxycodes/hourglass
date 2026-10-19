# Hourglass

Frontend-only React + TypeScript app for evaluating time versus money. Includes annual compensation and work schedule inputs, currency formatting, custom time value, a live tradeoff calculator, break-even exploration, and browser-local saved comparisons.

## Run

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and builds `dist/`. `npm test` verifies the calculation model. No backend, accounts, analytics, or API keys. Font files load from Google Fonts, with system fallbacks. Currency selection does not convert entered amounts. Compensation is a user-entered baseline, not tax or financial advice.
