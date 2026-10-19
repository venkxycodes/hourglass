# Hourglass development guide

## Product and scope

Hourglass helps people compare extra spending with the value of time saved.
Keep this a frontend-only React and TypeScript app. Persist preferences and
comparisons in the browser; do not add accounts, backend services, analytics,
or currency conversion without a product request.

## Repository skills

Read the relevant repo-local skill before the work it covers:

- `.agents/skills/frontend-design/SKILL.md`: interface and visual design.
- `.agents/skills/code-simplification/SKILL.md`: behavior-preserving refactoring.

These skills are vendored into this repository; do not rely on sibling projects
or machine-specific paths. User instructions take precedence over skill defaults.

## Design direction

Use restrained navy and blue, clear typography, deliberate spacing, and readable
forms. Keep the interface focused on the decision and its explanation.
Do not add decorative arrows, Unicode ornaments, redundant icons, or motivational
filler. Use symbols only when they communicate an actual function or calculation.
Keep responsive layouts, keyboard access, visible focus, and reduced-motion support.

## Calculation contract

- Annual hours = workdays per week × hours per day × working weeks per year.
- Baseline hourly rate = annual compensation ÷ annual hours.
- Use the personal hourly value when the override is enabled.
- Each option has one-time cost, recurring expenses with a frequency, end-of-period resale value, and minutes per use.
- The comparison shares a duration (days/months/years) and total use count.
- Total cost = one-time cost + prorated recurring expenses − resale value.
- Total hours = minutes per use × total uses ÷ 60.
- Choose the lower total cost + total hours × hourly value.
- Signed net benefit for B = (A hours − B hours) × hourly value − (B cost − A cost).
- Break-even = extra cost ÷ hours saved only when the faster option costs more.
- Handle equal times/costs, ties, reversed option order, and cheaper/faster dominance.
- Prorate using 365 days per year and 365/12 days per month; explain this assumption.
- Preserve existing saved comparisons by migrating legacy extra-cost/time-saved inputs.
- Explain estimated time value separately from cash profit.
- Currency selection changes formatting and denomination, not numeric conversion.

Keep calculation logic in `src/calculations.ts` and cover meaningful edge cases
when changing it. Do not introduce speculative abstractions or unrelated refactors.

## Validation and delivery

Run `npm test` and `npm run build` before delivering code changes. For UI edits,
inspect the app in the browser and check mobile layout when the layout changes.
Preserve existing Git history and license. Keep documentation aligned with behavior.
Use concise conventional commit messages. The GitHub remote is
`https://github.com/venkxycodes/hourglass`.
Leave a user-requested development server running unless asked to stop it.
