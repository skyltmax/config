# Upgrade runbook

How we keep every dependency in this repo current. Two layers:

- **Layer 1 — Renovate (mechanical):** detects pins, opens bump PRs, refreshes lockfiles, dumps changelogs. Config:
  [`renovate.json5`](../../renovate.json5). Zero awareness of our usage.
- **Layer 2 — the impact brief:** per-PR research grounded in this repo + [`INTERACTIONS.md`](INTERACTIONS.md). This is
  what decides what merges. Manual: have a Claude session read the PR diff + release notes against `INTERACTIONS.md`,
  dependency by dependency.

**Merging is NOT deploying, and one release is two artifacts.** A merged PR only changes `main`; consumers get it when a
GitHub Release publishes `@signmax/config` to npm and `skyltmax_config` to RubyGems (INTERACTIONS §5). The brief gates
`main`; the release is the consumer-facing gate.

Scope:

| manager        | files                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| npm            | both `package.json` + `pnpm-lock.yaml` pairs (root and `fixture/`)               |
| bundler        | `Gemfile` + `Gemfile.lock` — **not** `skyltmax_config.gemspec` (INTERACTIONS §6) |
| github-actions | `.github/workflows/{ci,release}.yml`, including `with:` toolchain versions (§9)  |
| docker-compose | the harbor devcontainer image pin in `.devcontainer/docker-compose.yml` (§1)     |

No `# renovate:` annotations are needed anywhere. Everything resolves from public registries except harbor: anonymous
tag listing is rejected (401), so the devcontainer image lookup relies on the harbor hostRule (pull robot) already in
the CE server config — local dry-runs fail that one lookup silently.

---

## One-time setup

Renovate runs self-hosted (Mend Renovate CE, see skyltmax/infra `docs/learnings/renovate-selfhosted.md`) and reads
config from the **default branch only**, so the order matters:

1. Merge `renovate.json5` to `main` — config on `main` means no onboarding PR.
2. Widen the CE discovery filter in skyltmax/infra: `terraform/main/renovate.tf` → `local.renovate_repos`, add
   `skyltmax/config`, apply.
3. Install the dedicated Renovate GitHub App (`skyltmax-renovate[bot]` — not the Mend cloud app, not `skyltmax-devbot`)
   on `skyltmax/config`. Filter **and** installation are both required; either alone discovers nothing.
4. Validate config after any edit (no argument — validates as _repo_ config):
   ```
   npx --yes --package renovate renovate-config-validator
   ```
5. CI gate: `ci.yml`'s four jobs (`validate`, `rubocop`, `version-sync`, `fixture`) are the green floor before a human
   merges anything.
6. Expected one-time first-run PRs: a digest pin for `rubygems/configure-rubygems-credentials` (the only non-SHA-pinned
   action); "Pin dependencies" (`react`, `npm-run-all`, `@types/react` → exact); a digest pin on the harbor devcontainer
   image; and the `npm-run-all` → `npm-run-all2` replacement (a rename, not a bump). The dashboard also flags
   **abandoned** packages (no release in a year); at setup time: `npm-run-all` (the replacement PR is the fix),
   `@total-typescript/ts-reset`, `prettier-plugin-ignored`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react` — a prompt
   to check, not a verdict. Those four have standing verdicts in INTERACTIONS §11 (two kept and muted in
   `renovate.json5`, one vendored away, one replaced in 4.0.0); a **new** name on that list is the only one that needs
   research.

## The gate: brief every PR before merging

**Version numbers don't decide safety.** A `1.x` minor can break us, a `0.x` minor is often trivial, maintainers
under-label breaking changes, and "breaking" here also depends on how _consumers_ use the thing — the plugin roster is
the product (§3). The config carries no risk heuristics beyond major-gating; the brief is the gate.

- **Early Monday (00:00–03:59, Europe/Tallinn):** the batch arrives, one PR per dependency. The only groups are the
  preset monorepo sets (eslint + `@eslint/js`; react + `@types/react` + `eslint-plugin-react-hooks`;
  `typescript-eslint`; `vitest`) and `harbor images`. Majors — including `engines` floor-raises, which only surface as
  majors — queue on the Dependency Dashboard. Default rate limits (2 PRs/hour in the 4-hour window) can spill a big week
  to next Monday; the dashboard's checkboxes force-create.
- **No automerge, anywhere.** Every PR — including lockfile maintenance — waits for a brief + a human.

### Working a batch

1. Brief each PR, dependency by dependency: release notes vs the surface we use (`eslint.js`, `prettier.js`,
   `rubocop*.yml`, `tests/`), the dep's role (peer = consumer contract; `dependencies` = shipped to consumers;
   `devDependencies` = ours), and `INTERACTIONS.md`. Verdict: merge clean / merge with steps / hold with a reason.
2. Merge lowest blast radius first: dev tooling and actions → devcontainer image → the roster (`dependencies`) →
   anything touching peers or gemspec floors.
3. Update `CHANGELOG.md` → `### Unreleased` as you go (§5).
4. Release when the batch warrants it: bump `package.json` and `lib/skyltmax_config/version.rb` together, tag. For risky
   batches, prerelease first (`v<base>-<pre>.<n>` → npm `canary` + prerelease gem), try in a consumer.
5. Clear the dashboard: approve what the briefs cleared; hold the rest with the reason written down.

## Verification

1. **Detection:** the local platform does not auto-read `renovate.json5` — point at it or it runs default config:
   ```
   RENOVATE_CONFIG_FILE=renovate.json5 LOG_LEVEL=debug \
     npx --yes --package renovate renovate --platform=local --dry-run=extract
   ```
   Confirm all dependency blocks + `engines` extract from both `package.json` files, `Gemfile` extracts (the gemspec
   does not — §6), the workflows yield actions _and_ `uses-with` versions, and the devcontainer pin extracts.
2. **Grouping:** `--dry-run=lookup` prints a branch per update. Expected shape: eslint + `@eslint/js` + fixture pin on
   one `eslint-monorepo` branch (the major variant also carries the peer widen); a `typescript` major carries both pins
   plus the peer widen with no custom rule (same-name deps always share a branch per update type); each plugin on its
   own branch. A same-version pair (eslint/`@eslint/js`, react/`@types/react`) arriving split means a preset group
   stopped matching.
3. **Peer ranges:** peers widen, so peer-CLI minors raise no PR — they flow via `lockFileMaintenance`. A PR that narrows
   or raises a peer floor is a breaking release, never routine (§2).
4. **Ruby:** no per-gem PRs at all — every gem, including the gemspec-declared ones, moves inside the weekly
   `lockFileMaintenance` PR within its gemspec range. Review that PR's `Gemfile.lock` diff. A rubocop major will never
   appear by any Renovate path (§6).
5. **Harbor:** confirm the CE hostRule authenticates (a local dry-run logs `Failed to look up docker package …`) and the
   regex versioning orders rebuild suffixes — `rails-4.0.6-31` must show as an update to `rails-4.0.6-30`; a wrong match
   shows "no update" while new images keep publishing. `docker:pinDigests` appends `@sha256:…` on the first server-side
   run.
6. **Advisories:** Renovate raises no `[SECURITY]` PRs (`osvVulnerabilityAlerts` is off; the CE app lacks
   `security-events` for the GitHub path) — check the Dependabot alerts tab with each batch, and act on a mid-week
   advisory manually.
