# cf-manager (cfm)

`cf-manager` is a CLI tool (invoked via `cfm`) designed to interact with Cloudflare's API using the official TypeScript SDK. The goal is to provide a streamlined command-line interface for managing Cloudflare resources.

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

Optional: install Git hooks and commit validation.

```bash
bun run prepare
```

### Configuration

You can provide values in three layers (highest priority first):

1. CLI flags (`--api-token`, `--account-id`, `--tunnel-id`)
2. JSON config files (if `--config` is not set):
   - `./cfm.config.json` (current working directory)
   - `<directory of the cfm executable>/cfm.config.json`
   - `~/.cfm/config.json`
3. `.env` (`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_TUNNEL_ID`, `CF_ZONE_ID`)

Example `cfm.config.json`:

```json
{
  "apiToken": "your_api_token_here",
  "accountId": "your_account_id_here",
  "tunnelId": "your_tunnel_id_here",
  "zoneId": "your_zone_id_here"
}
```

You can copy the provided template:

```bash
cp config.example.json cfm.config.json
```

Optional `.env` fallback:

```env
CF_API_TOKEN=your_api_token_here
CF_ACCOUNT_ID=your_account_id_here
CF_TUNNEL_ID=your_tunnel_id_here
CF_ZONE_ID=your_zone_id_here
```

Recommended `.env` file permissions:

```bash
chmod 600 .env
chown "$USER" .env
```

This keeps secrets readable only by your user. Also keep `.env` in `.gitignore`.

### Usage

Run locally:

```bash
bun run dev -- <command> [options]
```

Link globally:

```bash
bun link
```

Then run:

```bash
cfm <command> [options]
```

### Install Globally

Choose one of these install modes:

1. Development link from this repo (best while iterating):

```bash
bun link
cfm --help
```

2. Global install from this local folder (no manual link step):

```bash
bun install -g .
cfm --help
```

3. Global install from a published package (what you saw in other projects):

```bash
bun install -g <published-package-name>
```

This works only after publishing to npm (or another registry). Right now this package is marked `"private": true`, so registry publish/install is intentionally disabled.

### Compile to a Native Binary

Build a standalone binary:

```bash
bun run build:compile
```

Install the binary so it can run from anywhere:

```bash
install -m 755 ./dist/cfm "$HOME/.bun/bin/cfm"
cfm --help
```

If `cfm` is not found, ensure your PATH includes `~/.bun/bin`:

```bash
export PATH="$HOME/.bun/bin:$PATH"
```

If you install the compiled binary in a custom PATH directory (for example `~/bin/cfm`), keep shared defaults in:

```text
~/.cfm/config.json
```

This lets `cfm` work consistently from any current working directory.

## Commands

### `ingress:add`

Add an ingress route (hostname -> service) to a Cloudflare tunnel.

```bash
cfm ingress:add <hostname> <service> [options]
```

Arguments:

- `<hostname>`: Public hostname (example: `app.example.com`)
- `<service>`: Origin service URL/protocol target (example: `http://localhost:3000`)

Options:

- `--tunnel-id <tunnelId>`: Tunnel UUID to target (required unless provided in `cfm.config.json`, `~/.cfm/config.json`, or `CF_TUNNEL_ID`)
- `--api-token <token>`: Override Cloudflare API token
- `--account-id <id>`: Override Cloudflare account ID
- `--config <path>`: Use a specific JSON config file

Examples:

```bash
cfm ingress:add app.347.buzz http://localhost:3000 --tunnel-id f70ff985-a4ef-4643-bbbc-4a0ed4fc8415
cfm ingress:add app.347.buzz http://localhost:3000 --config=2719.json
```

### `ingress:list`

List tunnel ingress routes (hostname -> service mappings).

```bash
cfm ingress:list [options]
```

Options:

- `--tunnel-id <tunnelId>`: Filter ingress routes to one tunnel
- `--api-token <token>`: Override Cloudflare API token
- `--account-id <id>`: Override Cloudflare account ID
- `--config <path>`: Use a specific JSON config file

Examples:

```bash
cfm ingress:list --tunnel-id f70ff985-a4ef-4643-bbbc-4a0ed4fc8415
cfm ingress:list --config=2719.json
```

### `tunnel:list`

List Cloudflare tunnels.

```bash
cfm tunnel:list [options]
```

Options:

- `--api-token <token>`: Override Cloudflare API token
- `--account-id <id>`: Override Cloudflare account ID
- `--config <path>`: Use a specific JSON config file

Examples:

```bash
cfm tunnel:list
cfm tunnel:list --config=2719.json
```

## Resolution Order

For `apiToken`, `accountId`, and `tunnelId`, values resolve in this order:

1. Command flags (for example `--api-token`)
2. JSON config files:
   - `--config <path>` if provided
   - otherwise `./cfm.config.json` -> `<executable-dir>/cfm.config.json` -> `~/.cfm/config.json`
3. Environment variables (`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_TUNNEL_ID`)

If a required value is missing after resolution, the command exits with an explicit error.

## Scripts

Use these during development:

- `bun run dev`: Run CLI entrypoint (`src/index.ts`)
- `bun run test`: Run tests
- `bun run test:coverage`: Run tests with coverage report
- `bun run check:types`: Run TypeScript checks (`tsc --noEmit`)
- `bun run lint`: Run Biome checks
- `bun run lint:fix`: Apply Biome fixes
- `bun run check:dups`: Run duplication checks (`jsinspect` + `jscpd`)
- `bun run check`: Run types + lint + duplication checks

## Current Command Set

```text
ingress:add
ingress:list
tunnel:list
```
