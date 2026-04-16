# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## Features

- **🚀 Bun:** Fast all-in-one JavaScript runtime, package manager, and test runner.
- **🛡️ TypeScript:** Strongly typed development.
- **💎 Biome:** Fast formatter and linter.
- **🪝 Lefthook:** Fast git hooks manager.
- **🔍 Code Quality:** Integrated duplication checks with `jscpd` and `jsinspect`.
- **✅ Commitlint:** Enforce conventional commits.

## Getting Started

### Prerequisites

You need to have [Bun](https://bun.sh) installed.

### Installation

Clone this repository and install dependencies:

```bash
bun install
```

### Git Hooks Setup

To set up git hooks, run:

```bash
bun run prepare
```

## Available Scripts

- `bun start`: Run the application.
- `bun dev`: Run the application in watch mode.
- `bun test`: Run tests using Bun's native test runner.
- `bun test:coverage`: Run tests with coverage report.
- `bun run check`: Run all quality checks (lint, types, duplication).
- `bun run lint`: Run Biome linter.
- `bun run lint:fix`: Run Biome linter and fix issues.
- `bun run check:types`: Run TypeScript type checking.
- `bun run check:dups`: Run code duplication checks.

## Project Structure

```text
├── .github/          # CI/CD workflows
├── src/              # Source code
│   └── index.ts      # Entry point
├── biome.json        # Biome configuration
├── lefthook.yml      # Git hooks configuration
└── package.json      # Project configuration
```

## License

MIT
