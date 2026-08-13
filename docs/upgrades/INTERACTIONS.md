# Upgrade interactions

The landmines a version bump in this repo can step on. The impact brief (`RUNBOOK.md`) checks every Renovate PR against
this file; when an upgrade goes sideways for a reason not listed here, add the entry.

## 1. The devcontainer image is built in skyltmax/infra; Renovate bumps the pin here

`.devcontainer/docker-compose.yml` points at `harbor.signmax.cloud/public/devcontainer` with `rails-<upstream>-<N>`
rebuild-suffix tags built in skyltmax/infra. Renovate tracks the pin (regex versioning for the `-N` suffix); three
things stay manual on an image PR:

- bump `CHANGELOG_DISPLAYED_<N>` in `.devcontainer/boot.sh`, or the new image's changelog never prints;
- on a Ruby change, bump `GEMS_ALREADY_RESET_<N>` too — the `/usr/local/bundle` volume outlives the image, and gems
  built against the old Ruby must be wiped;
- the version choice originates in infra: a stale image is fixed by an infra build, not a pin edit here.

## 2. peerDependencies are the consumer contract

`eslint ^9.30.0`, `prettier ^3.6.0` and `typescript >=5.9 <6.1` are the whole peer surface. Renovate widens peer ranges
instead of bumping them, so in-range minors raise no PR — they arrive only through `lockFileMaintenance` — and a major
surfaces as a widen (`^9.30.0` → `^9.30.0 || ^10.0.0`) on the same branch as the root + fixture pin bumps.

**Raising a floor or narrowing a range is a breaking change of this package** (2.0.0 shipped one as a major with
`feat!:` entries), never routine maintenance. A peer-CLI major is only mergeable once the whole plugin roster declares
support for it — the widen PR carries just the CLI and fails CI until the plugins catch up; the actual move is a
coordinated bump across the roster (§3).

## 3. The plugin roster is the product, and it is loaded by export path

The 14 exact pins in `dependencies` resolve from this package (since 2.0.0), so a bump changes what every consumer lints
with. `eslint.js` reads a specific export path from most of them:

| package                         | path `eslint.js` depends on                                 |
| ------------------------------- | ----------------------------------------------------------- |
| `@eslint/js`                    | `.configs.recommended`                                      |
| `eslint-plugin-prettier`        | `eslint-plugin-prettier/recommended` (subpath export)       |
| `eslint-plugin-react`           | `.configs.flat.recommended`, `.configs.flat["jsx-runtime"]` |
| `eslint-plugin-jsx-a11y`        | `.flatConfigs.recommended`                                  |
| `eslint-plugin-testing-library` | `.configs["flat/react"]`, `.configs["flat/dom"]`            |
| `eslint-plugin-jest-dom`        | `.configs["flat/recommended"]`                              |
| `@vitest/eslint-plugin`         | `.configs.recommended.rules`                                |
| `typescript-eslint`             | `.config()`, `.configs.recommended`, `.parser`              |

The rest — `eslint-plugin-import-x`, `eslint-plugin-react-hooks`, `globals` — are used via their default export with
rules named individually, so a renamed or removed **rule** is the failure mode there.

A major that moves one of those paths **fails the config load**: every consumer's `eslint .` exits with a config error,
not a rule warning. Same failure when a plugin's own `eslint` peer no longer matches the eslint we resolve.
`tests/configs.test.js` asserts the exact roster (name **and** loaded object) — `pnpm test` is the cheap check, the
`ci.yml` fixture job the expensive one.

Each plugin arrives in its own PR for every update type — deliberately no roster group: each can only break the config
load on its own, and a group lets one broken plugin block the rest. Two cross-checks for the brief: on a `typescript`
bump, the TS range the current `typescript-eslint` supports (an unsupported TS only prints a warning, but can change
rule behaviour); on an eslint major, every plugin's eslint peer range (§2).

## 4. Prettier plugins are resolved from this package, not the consumer

`prettier.js` resolves `prettier-plugin-ignored` and `prettier-plugin-tailwindcss` via `import.meta.resolve` — `file://`
URLs into this package's `node_modules`. Bare names would resolve from the consumer's context, the phantom-dependency
setup 2.0.0 removed. `tests/configs.test.js` asserts both are `file://` URLs and importable.

The `prettier-plugin-tailwindcss` version decides which Tailwind major it can sort classes for, and consumers sit on
both majors. Check its supported Tailwind range on a major; the formatting churn lands in consumers, not here.

## 5. Merging ≠ releasing, and one release is two artifacts

A merged PR only changes `main`. Consumers get it when a GitHub Release is cut: `release.yml` publishes
`@signmax/config` to npm **and** `skyltmax_config` to RubyGems; `ci.yml`'s `version-sync` job keeps `package.json` and
`lib/skyltmax_config/version.rb` equal, and `release.yml` verifies both match the tag. Renovate touches neither version,
so:

- keep `CHANGELOG.md` → `### Unreleased` current as PRs merge (hand-maintained — which is also why dependency commits
  are `chore(deps):`, leaving `fix:` to mean a config behaviour fix);
- a bump that changes lint/format output for consumers is a release note, not silent maintenance;
- validate risky batches with a prerelease: tag `v<base>-<pre>.<n>` → npm `canary` dist-tag + prerelease gem, try in a
  consumer, then release stable.

## 6. The gemspec is invisible to Renovate

The bundler manager only reads `Gemfile` — it has no gemspec support — so the gemspec's floors
(`rubocop >= 1.84.2, < 2`, `rubocop-performance >= 1.26.0, < 2`, `rubocop-rails >= 2.33.0, < 3`, `rake ~> 13.0`) are
tracked by nothing. The Gemfile's own entries are version-less, and with the blanket `rangeStrategy: replace` there is
nothing to rewrite, so no individual gem PRs exist at all.

The only Renovate path for the Ruby side is the weekly `lockFileMaintenance` PR (`bundler lock --update` — a full
re-resolution including the `gemspec` directive): every gem moves within its declared range, and the constraints
themselves never move except by hand. Consequences:

- **rubocop 2.0 will never open a PR.** The `< 2` caps hold silently — watch rubocop releases yourself, or the gem
  quietly caps consumers out of the next major.
- **Floors are the consumer contract.** Raise one deliberately — when the configs reference a cop the floor version
  lacks, or to force a bugfix onto consumers (0.0.14/0.0.15 did, over rubocop#14867) — and put it in the CHANGELOG: it
  forces every consumer to upgrade.
- `NewCops: disable` keeps new cops inert, so a rubocop bump in the lock-maintenance PR is about behaviour changes to
  existing cops; `bundle exec rubocop` in CI is the check. Review that PR's `Gemfile.lock` diff — all gem movement hides
  there.
- If a **versioned** Gemfile entry is ever added, per-gem PRs return and the rubocop set must move together (extensions
  pin their own rubocop floors). Re-add
  `{ matchManagers: ["bundler"], matchPackageNames: ["rubocop", "rubocop-performance", "rubocop-rails"], groupName: "rubocop stack" }`.

## 7. The fixture is a second workspace root whose pins must match the root's

`fixture/` has its own `pnpm-workspace.yaml`, lockfile and `allowBuilds`; it consumes this package as `file:..` (skipped
by Renovate) and pins `eslint`, `prettier` and `typescript` at the same exact versions as the root. The `ci.yml` fixture
job asserts specific lint/type errors are still reported, so pin drift means CI verifies a different toolchain than the
one the package ships against.

Renovate updates a dependency across every file it appears in on one branch (per update type), so a toolchain PR touches
both `package.json` files and both lockfiles with no rule needed — but check it on every such PR; `fixture/` is
`.prettierignore`d and easy to forget. The fixture's expected errors are _deliberate failures_: a plugin bump that stops
reporting one fails CI, and the fix is usually the fixture source, not the dependency.

## 8. pnpm build-script allowlist

Both `pnpm-workspace.yaml` files carry `allowBuilds` — the allowlist of packages whose install scripts may run; pnpm
fails the install otherwise. A bump that introduces or renames a build-script dependency must update the allowlist in
the same PR.

## 9. CI toolchain versions in `with:` blocks are tracked, and need a cross-check

The github-actions manager extracts `with:` values as depType `uses-with` — `node-version: "24"`, `ruby-version: "4.0"`,
pnpm/action-setup's `version: 11` — and raises ordinary bump PRs for them (a lookup proposed `ruby 4.0 -> 4.0.6`). All
three mirror something owned elsewhere: the devcontainer image (§1) provides the local toolchain, and `engines.node` is
the floor consumers must satisfy. The brief's question is "does this match what the image ships?" — a CI Ruby patch the
image doesn't ship makes CI test something local dev doesn't run.

An `engines` floor-raise only ever surfaces as a major (in-range releases satisfy the range), so it queues on the
dashboard; raising it drops consumers on older Node and is a breaking release. Untracked entirely: `TargetRubyVersion`
in `rubocop.yml`, `TargetRailsVersion` in `rubocop.rails.yml`, `required_ruby_version` in the gemspec — hand-edit these
consumer-facing claims when the floor moves.
