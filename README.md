# StockCellar

Wine & Liquor Inventory Management for shop owners — scan or manually record stock, track
inventory history, view analytics, and export to Excel.

Built with React Native (Expo SDK 54), TypeScript (strict), and Expo Router.

## Status

**v1 — frontend only, under active development.** The Node.js backend arrives later; every
external capability (persistence, analytics, AI extraction, export) sits behind a swappable
interface with a mock implementation, so backend integration is an implementation swap — not
a refactor.

Foundation layer (design tokens, theming, logger, typed errors, config) is in place.
Feature modules land step by step: core services → domain models → design system → app
shell → manual entry → scanner → history → analytics → export/settings/auth.

## Getting started

```bash
npm install
npm start          # Expo dev server (press w for web, a for Android)
```

Other scripts:

```bash
npm run typecheck  # strict TypeScript check
npm run lint       # ESLint via expo lint
npm run android    # native Android build (requires Android SDK)
npm run web        # web only
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — layers, dependency rule, swappable seams
- [Folder structure](docs/FOLDER_STRUCTURE.md) — module layout and conventions

## Engineering conventions (short version)

- All styling from theme tokens (`@/theme`) — no hardcoded colors or magic numbers
- Logging via `createLogger(scope)` — raw `console.*` is banned outside the console transport
- Only typed `AppError`s cross layer boundaries
- Environment variables are read exclusively in `src/core/config`
- Routes in `src/app` stay thin; logic lives in feature modules and services
