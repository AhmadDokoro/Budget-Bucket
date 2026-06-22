# Budget Buckets

A mobile-first, installable **Progressive Web App** for envelope budgeting. Split each budget into buckets, record expenses and refunds, and always see your **remaining balance** front and centre. Built dark-first with a clean fintech aesthetic and a full light/dark/system theme system.

Everything is stored **locally on the device** — no backend, no accounts, no cloud.

## Features

- **Budget Scopes** — spending areas like _Malaysia Living_ or _Nigeria Savings_, each with a name, currency symbol, total budget, and buckets.
- **Buckets (categories)** — allocate portions of the budget; allocations can never exceed the scope total.
- **Transactions** — record an **expense** or an **adjustment** (refund) from a bottom-sheet modal; balances are always derived from the transaction log.
- **Transaction history** — delete any transaction and its effect is automatically reversed.
- **Reset scope** — clears all transactions and restores every bucket to its original allocation (buckets are kept).
- **Health states** — each bucket is green / amber / red based on remaining balance.
- **Theme system** — Light, Dark, and System modes via `next-themes`, persisted locally, with smooth flash-free transitions.
- **PWA** — installable on Android, offline support via a service worker, app manifest, and generated icons.

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui** primitives
- **Framer Motion** (bottom sheets, animated progress, transitions)
- **next-themes** for theming
- **LocalStorage** persistence via `useSyncExternalStore`

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

> The service worker registers in production builds only, so test installability / offline with `npm run build && npm start`.

## Project structure

```
src/
  app/                 # App Router pages (dashboard, scope/[id], settings)
  components/
    ui/                # shadcn-style primitives (button, card, sheet, …)
    budget/            # domain components (scope card, category card, sheets)
    theme-toggle.tsx   # segmented control + quick toggle
    providers.tsx      # ThemeProvider + theme-color sync
  hooks/               # useBudget, useMounted
  lib/                 # storage layer, budget math, formatting, utils
  types/               # domain types
public/
  manifest.webmanifest, sw.js, icons/
scripts/               # icon generator + headless Chrome smoke tests
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run icons` | Regenerate PWA icons |

## Deploy

Deploys to **Vercel** with zero configuration — import the repo and ship.

## License

MIT
