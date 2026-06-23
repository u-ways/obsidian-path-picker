# Security

## Reporting a vulnerability

**Please do _not_ open a public GitHub issue for security vulnerabilities.**

Report them privately via GitHub's **[Report a vulnerability](https://github.com/u-ways/obsidian-insert-path/security/advisories/new)**
(repo → **Security** → **Advisories** → _Report a vulnerability_), which opens a private
advisory visible only to the maintainers. If that's unavailable, contact the maintainer
privately via their GitHub profile ([@u-ways](https://github.com/u-ways)).

This is a community project maintained on a best-effort basis — please allow reasonable
time for triage before any public disclosure.

## What the plugin can access

Knowing the plugin's blast radius helps assess risk:

- **Desktop only.** It uses Node's `fs`/`path`/`os` (declared `isDesktopOnly: true`), so it
  never runs on Obsidian mobile.
- **Reads the local filesystem.** It walks directories under the chosen root and reads the
  first lines of files to render previews. This is **read-only** — it never writes, moves,
  or deletes files outside your vault.
- **Only writes** the path string you select, inserted at your cursor in the active note.
- **No network, no code execution, no telemetry.** It makes no network requests, runs no
  shell commands or external binaries, and collects/transmits no data.

## Security measures in CI

- **SBOM + vulnerability scan** ([`.github/workflows/security.yml`](../.github/workflows/security.yml)):
  every pull request generates a CycloneDX SBOM with **syft** ([`anchore/sbom-action`](https://github.com/anchore/sbom-action))
  covering the full dependency tree (runtime **and** dev/build toolchain) and scans it with
  **grype** ([`anchore/scan-action`](https://github.com/anchore/scan-action)). The job **fails
  on findings at or above `high`** (the threshold is the `SEVERITY_CUTOFF` env in the workflow);
  lower-severity findings are printed but don't block. Both actions are SHA-pinned.
- **SBOM published with releases.** When a release is drafted, the SBOM (`sbom.cdx.json`) is
  attached to the draft so each release ships a supply-chain manifest. See
  [RELEASING.md](RELEASING.md).
- **Other gates** (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)): ESLint —
  including a rule banning raw HTML injection (`innerHTML`/`outerHTML`/`insertAdjacentHTML`) so
  the modal builds DOM only via `createEl`/`createDiv`/`createSpan` — plus type-check, tests,
  and a production build. All must pass before merge.

## Dependencies

- The shipped plugin bundles a **single runtime dependency** ([`fzf`](https://github.com/ajitid/fzf-for-js)).
  The rest of the tree is the dev/build toolchain (esbuild, vitest, TypeScript, ESLint,
  Prettier), which the security scan also covers.
- Keep dependencies current; address scan findings by **upgrading the affected package**. If a
  finding can't be fixed and is acceptable, document the rationale (e.g. a grype ignore rule)
  rather than silently lowering the threshold.

## Secrets

- The plugin requires **no secrets** to build or run.
- CI uses the built-in `GITHUB_TOKEN`. The one repository secret is **`COPILOT_GITHUB_TOKEN`**,
  used only by the agentic "Release Detailer" workflow (see [RELEASING.md](RELEASING.md)).
- Never commit secrets, tokens, or credentials. Configure them as GitHub Actions secrets.
