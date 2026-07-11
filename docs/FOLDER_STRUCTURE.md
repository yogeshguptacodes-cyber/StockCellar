# Folder Structure

Feature-driven layout with centralized shared code. Routes are thin; features own their
screens; everything cross-cutting lives in `core`, `theme`, `shared`, `domain`,
`infrastructure`.

```
src/
├── app/                    # Expo Router routes ONLY — thin files that re-export
│   │                       # feature screens. No logic, no styles beyond layout glue.
│   ├── _layout.tsx         # Root providers (theme, gestures, navigation bridge)
│   └── index.tsx           # Landing route
│
├── features/               # One folder per feature module (added per step)
│   └── <feature>/
│       ├── components/     # Feature-private components
│       ├── hooks/          # Feature-private hooks
│       ├── screens/        # Screen components mounted by src/app routes
│       ├── services/       # Feature-scoped orchestration
│       ├── store/          # The feature's Zustand store
│       ├── types/          # Feature-private types
│       ├── constants/
│       └── utils/
│
├── shared/                 # Cross-feature UI & hooks (added in Design System step)
│   ├── components/ui/      # Design system: atoms → molecules → organisms
│   ├── hooks/
│   └── utils/
│
├── domain/                 # Pure TypeScript. Zero React/Expo/infra imports.
│   ├── models/             # Bottle, Category, InventoryEntry, InventorySession, …
│   └── repositories/       # Repository INTERFACES (implemented in infrastructure)
│
├── infrastructure/         # Implementations of domain/application interfaces
│   ├── repositories/       # mock/ today, rest/ later
│   ├── storage/            # StorageService (AsyncStorage impl today)
│   └── analytics/          # AnalyticsProvider (console impl today)
│
├── api/                    # Future: HTTP client, DTOs, request/response contracts
│
├── core/                   # Dependency-light cross-cutting primitives
│   ├── config/             # appConfig — sole reader of env vars
│   ├── errors/             # AppError hierarchy + normalizeError
│   └── logger/             # Logger + transports
│
└── theme/                  # Design tokens & theming
    ├── tokens/             # colors (palette), typography, spacing, radius,
    │                       # elevation, animation
    ├── themes.ts           # Semantic light/dark themes (ThemeColors roles)
    ├── theme-provider.tsx  # AppThemeProvider, useTheme, useThemedStyles
    └── index.ts            # Public API — import from '@/theme' only
```

## Conventions

- **Filenames:** `kebab-case.ts(x)`. Components export PascalCase symbols.
- **Imports:** absolute via `@/` alias. Feature A never imports from feature B —
  shared code moves down into `shared/`, `domain/`, or `core/`.
- **Barrels:** each module exposes a curated `index.ts` public API; deep imports into
  another module's internals are forbidden.
- **Routes:** `src/app/*` files contain no business logic — they mount feature screens.
- **Styling:** all values from theme tokens. No hex colors, no magic numbers in components.
- **Console:** `console.*` is banned outside `core/logger/console-transport.ts`; use
  `createLogger(scope)`.
- **Env vars:** read only in `core/config`.
- **Errors:** only `AppError` subclasses cross layer boundaries.

## Root

```
assets/          # Images, fonts, app icons
docs/            # Architecture & engineering docs
android/         # Committed native project (prebuild output)
src/             # Application source (above)
```
