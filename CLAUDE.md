# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Molecule is a lightweight Web IDE UI framework built with React, inspired by VSCode. It's published as `@dtinsight/molecule` on npm. The library provides a workbench layout, Monaco Editor integration, command palette, keybindings, i18n, settings, and an Extension API modeled after VSCode's.

## Commands

```bash
pnpm install          # Install dependencies (pnpm 9.7.0 required)
pnpm dev              # Dev mode with file watching (esbuild + tsc + SCSS)
pnpm build            # Production build → esm/ folder
pnpm web              # Run Storybook demo app (cd app && npm run dev)
pnpm lint             # ESLint for src/**/*.{ts,tsx}
pnpm prettier         # Format code with Prettier (printWidth: 120)
```

No test runner is currently configured in scripts (jest.config.js exists but no `test` script).

## Architecture

### Dependency Injection + Service Pattern

The core architecture uses **tsyringe** for DI with decorator-based injection. Services are the central abstraction:

```
src/
├── services/         # Business logic (25+ injectable services)
├── controllers/      # Connect UI events to service calls
├── models/           # Data models (state shapes)
├── client/           # React layer
│   ├── components/   # Reusable UI components
│   ├── slots/        # Workbench layout slots
│   ├── hooks/        # useConnector, useDynamic, etc.
│   └── context/      # React Context for DI container
├── extensions/       # Built-in extensions + extension system
├── glue/             # Base classes (BaseService, BaseAction, EventEmitter, GlobalEvent)
├── monaco/           # Monaco Editor integration & types
├── const/            # Constants (keyCodes, theme, options)
└── utils/            # Utilities (tree ops, storage, etc.)
```

### State Management

Services extend `BaseService<Model>` and use **Immer** for immutable state updates via `this.dispatch(draft => { ... })`. Components subscribe to service state using `useConnector('serviceName')` which wraps React's `useSyncExternalStore`.

### Entry Point

```typescript
const instance = create({ extensions: [], defaultLocale, defaultColorTheme, onigurumPath });
instance.render(container);
```

`create()` bootstraps the DI container, registers all services/controllers, and loads extensions.

### Path Alias

TypeScript and the build system use `mo/*` → `./src/*` path alias. All internal imports use this:
```typescript
import { EditorService } from 'mo/services/editor';
```

### Build System

Custom Node.js build script at `bin/m.cjs` using esbuild. Handles TypeScript/TSX transpilation, SCSS→CSS compilation with variable export to JS, and path alias resolution via tsc-alias.

## Conventions

- **Service method prefixes**: `add*`, `remove*`, `update*`, `get*`, `set*`, `create*`, `on*` (event listener), `find*`, `move*`, `append*`, `toggle*`
- **Props interfaces**: Named `I<ComponentName>Props`, typically extending React native element props
- **Events**: Enum-based (e.g., `EditorEvent.onChange`), emitted via `this.emit()` in services
- **Components**: Functional components with hooks; heavy use of `useConnector` and `useDynamic` for service state and dynamic component rendering
- **DnD**: Uses `@dnd-kit/core` for drag-and-drop in split panes and editor tabs
- **i18n**: Built-in LocaleService supporting zh-CN, en-US, ko-KR
- **Peer deps**: React 18 or 19, optional vscode-oniguruma + vscode-textmate for TextMate grammar support
