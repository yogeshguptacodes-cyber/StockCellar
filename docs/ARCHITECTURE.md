# StockCellar — Architecture

Wine & Liquor Inventory Management. React Native (Expo SDK 54), TypeScript, Expo Router.
**v1 is frontend-only**; a Node.js backend arrives later. The architecture's central promise:
backend integration, AI extraction, real analytics, and real Excel export are **implementation
swaps behind existing interfaces**, not refactors.

## Layers & the Dependency Rule

Dependencies point strictly downward. A layer may only import from layers below it.

```
┌─────────────────────────────────────────────────────────┐
│ Presentation   src/app (routes), design-system UI       │  How it looks
├─────────────────────────────────────────────────────────┤
│ Feature        src/features/* (screens, components,     │  What the user does
│                feature hooks)                            │
├─────────────────────────────────────────────────────────┤
│ Application    Zustand stores, services, use-cases      │  Orchestration & state
├─────────────────────────────────────────────────────────┤
│ Domain         src/domain (models, repository           │  What the business IS
│                interfaces, domain rules)                 │
├─────────────────────────────────────────────────────────┤
│ Infrastructure repositories impls (mock → REST),        │  How data is obtained
│                storage, analytics providers, logger      │
│                transports                                 │
├─────────────────────────────────────────────────────────┤
│ API            HTTP client, DTOs, contract types         │  Wire format
└─────────────────────────────────────────────────────────┘
```

Hard rules:

1. **No business logic in UI.** Components render props and dispatch intents. Rules about
   inventory live in domain/services.
2. **No API/repository calls from screens.** Screens talk to stores/hooks; stores talk to
   services; services talk to repository *interfaces*.
3. **Domain is dependency-free.** `src/domain` imports nothing from React, Expo, or
   infrastructure. It is pure TypeScript — trivially unit-testable.
4. **Infrastructure is swappable.** Every external capability (persistence, analytics, AI
   extraction, export, HTTP) is defined as an interface in domain/application and implemented
   in infrastructure. v1 ships mock implementations; production implementations register
   later without touching consumers.

## Cross-cutting primitives (`src/core`)

| Module | Responsibility | Future |
|---|---|---|
| `core/logger` | Leveled, scoped, transport-based logging. Only sanctioned `console.*` lives in its ConsoleTransport. | Sentry/Crashlytics transport |
| `core/errors` | `AppError` hierarchy with stable `code`s; `normalizeError` at every layer boundary. | — |
| `core/config` | Typed, frozen `appConfig`; sole reader of `EXPO_PUBLIC_*` env vars. | staging/production envs |

## Theming (`src/theme`)

Two-tier token system:

- **Primitive tokens** (`theme/tokens`): raw scales — palette, type ramp, 4pt spacing, radius,
  elevation, motion. Never imported by feature code for colors.
- **Semantic themes** (`theme/themes.ts`): map primitives to *roles* (`surface`,
  `textSecondary`, `primaryPressed`…). Components style against roles only, which is what
  makes dark mode (and any future theme) a data change, not a code change.

Access via `useTheme()` / `useThemedStyles(factory)` from `@/theme`.

## State management

Zustand, **one store per concern** (inventory, scanner, history, analytics, settings, UI,
offline-queue, auth) — no god store. Stores are the only place that calls services; selectors
keep re-renders narrow. (Stores land with their features.)

## Error handling strategy

- Throw/reject with `AppError` subclasses only across boundaries.
- `normalizeError(unknown)` converts foreign errors at the edge (repositories, services).
- UI maps `error.code` → user copy; a global Error Boundary catches render-time bugs.
- `isOperational` distinguishes expected failures (offline, validation) from bugs — the
  future crash reporter only pages on the latter.

## Future backend integration

The seam is the repository layer: `InventoryRepository` (interface, domain) ←
`MockInventoryRepository` (v1) / `RestInventoryRepository` (v2, calls `src/api` client with
DTO↔domain mappers). Screens, stores, and services never change. The same seam pattern covers
`InventoryExtractionService` (mock → Gemini), `ExcelExportService` (mock → ExcelJS),
`AnalyticsProvider` (console → Firebase/Mixpanel), and storage (AsyncStorage → SQLite/MMKV).

## Verification gates

- `npm run typecheck` — strict TS (`noUncheckedIndexedAccess`, `noImplicitOverride`, …)
- `npm run lint`
- Jest + React Native Testing Library (test infra lands in the Testing step)
