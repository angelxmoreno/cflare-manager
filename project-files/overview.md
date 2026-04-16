# cf-manager (cfm) Project Overview

## Description
`cf-manager` is a CLI tool (invoked via `cfm`) designed to interact with Cloudflare's API using the official TypeScript SDK. The goal is to provide a streamlined command-line interface for managing Cloudflare resources.

## Immediate Requirements
- **Command:** `cfm route:add <name> <target>`
  - Example: `cfm route:add koko http://localhost:3000`
  - Purpose: Quickly add routes to Cloudflare.

## Tech Stack
- **Runtime:** Bun
- **Language:** TypeScript
- **SDK:** Cloudflare TypeScript SDK (`cloudflare` package)
- **Validation:** Zod (for configuration and input validation)
- **Tooling:** Biome (linting/formatting), Lefthook (git hooks)

## Project Structure
- `src/index.ts`: Entry point for the CLI.
- `src/config.ts`: Configuration management and environment validation.
- `project-files/`: Project documentation and metadata.
