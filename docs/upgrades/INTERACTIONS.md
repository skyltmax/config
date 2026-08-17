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

| package                         | path `eslint.js` depends on                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `@eslint/js`                    | `.configs.recommended`                                         |
| `eslint-plugin-prettier`        | `eslint-plugin-prettier/recommended` (subpath export)          |
| `@eslint-react/eslint-plugin`   | `.configs["recommended-type-checked"]`, `.configs.recommended` |
| `eslint-plugin-jsx-a11y`        | `.flatConfigs.recommended`                                     |
| `eslint-plugin-testing-library` | `.configs["flat/react"]`, `.configs["flat/dom"]`               |
| `eslint-plugin-jest-dom`        | `.configs["flat/recommended"]`                                 |
| `@vitest/eslint-plugin`         | `.configs.recommended.rules`                                   |
| `typescript-eslint`             | `.config()`, `.configs.recommended`, `.parser`                 |

The rest — `eslint-plugin-import-x`, `eslint-plugin-react-hooks`, `globals` — are used via their default export with
rules named individually, so a renamed or removed **rule** is the failure mode there.

A plugin can also break on the **eslint** side: eslint 10 removed the deprecated `context` methods, and
`eslint-plugin-react` 7.37.5 still called `context.getFilename()` while detecting the React version
(jsx-eslint/eslint-plugin-react#4018 — fixed upstream, never released). 2.0.0 shimmed around it by resolving the React
version here; 4.0.0 removed both the shim and the plugin (§11). `@eslint-react` detects the version the same way the
shim did — `createRequire(process.cwd())("react")` with a fallback — so a consumer without React installed still loads
the config. `eslint-plugin-jsx-a11y` is now the only plugin declaring a peer range that stops at eslint 9; verified by
probe that its rules run correctly under 10, so the declaration is stale metadata, not breakage — pnpm warns, nothing
fails.

A major that moves one of those paths **fails the config load**: every consumer's `eslint .` exits with a config error,
not a rule warning. Same failure when a plugin's own `eslint` peer no longer matches the eslint we resolve.
`tests/configs.test.js` asserts the exact roster (name **and** loaded object) — `pnpm test` is the cheap check, the
`ci.yml` fixture job the expensive one.

Each plugin arrives in its own PR for every update type — deliberately no roster group: each can only break the config
load on its own, and a group lets one broken plugin block the rest. Two cross-checks for the brief: on a `typescript`
bump, the TS range the current `typescript-eslint` supports (an unsupported TS only prints a warning, but can change
rule behaviour); on an eslint major, every plugin's eslint peer range (§2).

## 4. Prettier plugins are resolved from this package, not the consumer

`prettier.js` resolves both its plugins via `import.meta.resolve` — `file://` URLs anchored on this package. Bare names
would resolve from the consumer's context, the phantom-dependency setup 2.0.0 removed. `tests/configs.test.js` asserts
both are `file://` URLs and importable.

The two resolve differently now: `prettier-plugin-tailwindcss` is a pin in `dependencies`, while the `ignored` parser is
**vendored** as `./prettier-ignored-plugin.js` (§11). A relative specifier means it must stay inside the published
tarball — `files: ["*.js"]` covers it, and `npm pack --dry-run` is the check if that list is ever narrowed. It bypasses
the `exports` map (prettier `import()`s the URL directly), so it needs no export entry.

The globs routed to `parser: "ignored"` are `**/pnpm-lock.yaml` and `**/pnpm-workspace.yaml`; a manifest that prettier's
yaml parser rewrites is exactly the churn this avoids, so the round-trip is asserted in `tests/configs.test.js` rather
than assumed.

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

`file:..` is materialized as a **snapshot copy**, not a live symlink: after changing anything in the root package, run
`pnpm install` in `fixture/` before its checks mean anything locally (CI installs fresh, so it always sees the change).

Renovate updates a dependency across every file it appears in on one branch (per update type), so a toolchain PR touches
both `package.json` files and both lockfiles with no rule needed — but check it on every such PR; `fixture/` is
`.prettierignore`d and easy to forget. The fixture's expected errors are _deliberate failures_: a plugin bump that stops
reporting one fails CI, and the fix is usually the fixture source, not the dependency.

## 8. pnpm build-script allowlist

Both `pnpm-workspace.yaml` files carry `allowBuilds` — the allowlist of packages whose install scripts may run; pnpm
fails the install otherwise. A bump that introduces or renames a build-script dependency must update the allowlist in
the same PR.

## 9. CI toolchain versions in `with:` blocks are tracked, and need a cross-check

The github-actions manager extracts `with:` values as depType `uses-with` — `node-version: "24"` and
`ruby-version: "4.0"` — and raises ordinary bump PRs for them. (pnpm is not among them: pnpm/action-setup carries no
`version` input and reads the `packageManager` field, which Renovate tracks as a normal npm dep — §10.) Both mirror
something owned elsewhere: the devcontainer image (§1) provides the local toolchain, and `engines.node` is the floor
consumers must satisfy. The brief's question is "does this match what the image ships?".

`ruby-version` stays at minor precision on purpose: `"4.0"` makes ruby/setup-ruby install the latest 4.0.x, so CI floats
patches with the image instead of pinning one — `renovate.json5` disables patch updates for it (Renovate would rewrite
it to `4.0.6`). A minor still PRs, proposed as a full version; trim it back to `X.Y` on the branch.

An `engines` floor-raise only ever surfaces as a major (in-range releases satisfy the range), so it queues on the
dashboard; raising it drops consumers on older Node and is a breaking release. Untracked entirely: `TargetRubyVersion`
in `rubocop.yml`, `TargetRailsVersion` in `rubocop.rails.yml`, `required_ruby_version` in the gemspec — hand-edit these
consumer-facing claims when the floor moves.

## 10. Renovate's settle time does not govern lockfile maintenance — pnpm's does

Renovate's `minimumReleaseAge` only filters the update candidates Renovate itself proposes. Lockfile maintenance is
performed by the package manager, so the weekly PR can pull a transitive published hours ago — and pnpm's own
supply-chain check (24h `minimumReleaseAge` by default in v11, re-applied to every lockfile entry on install) then fails
CI on it. PR #22 was exactly this: the worker resolved `get-tsconfig@4.14.2` at ~21h old, and both pnpm jobs died with
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. That class of failure is transient (entries only age), but the fix is to
enforce the policy where resolution happens:

- both `pnpm-workspace.yaml` files set `minimumReleaseAge: 4320` (3 days, matching Renovate's npm settle) — any pnpm ≥11
  resolving this workspace, including Renovate's worker, refuses younger versions outright;
- `trustLockfile: true` skips re-verification of committed entries on install — entries resolved before the policy can
  be younger than the cutoff, and every commit lands via a reviewed PR, so the lockfile is the trusted base;
- `packageManager: "pnpm@<version>"` in both `package.json` files pins the resolver: CI's pnpm/action-setup reads it (no
  `version` input — the action errors when both disagree) and Renovate's worker installs it, so the same pnpm applies
  the same policy everywhere. Renovate tracks the field as an ordinary npm dep; keep the two copies on one branch like
  every other root+fixture pair (§7).

Consequence to remember: a release younger than 3 days is invisible to the whole pipeline — Renovate won't propose it
and pnpm won't resolve it. For a deliberate early adoption (e.g. an urgent fix), add a temporary
`minimumReleaseAgeExclude` entry rather than lowering the global cutoff.

## 11. Abandonment flags are a prompt, and each one of ours has a standing verdict

The dashboard's **Abandoned Dependencies** list is release-inactivity detection (`abandonmentThreshold`, 1 year), not a
deprecation notice: nothing is wrong with the installed version, and npm carries no notice for any of these. Re-check a
flag with the registry and the upstream default branch, not the flag itself:

```sh
npm view <pkg> time.modified dist-tags versions            # was there a release, or only commits?
gh api repos/<owner>/<repo>/compare/<latest-tag>...HEAD -q .ahead_by
```

Verdicts as of 2026-08-17, one per flagged package. `renovate.json5` mutes the two settled _keeps_ with a 10-year
threshold so the next genuinely new flag is visible; drop the entry to reopen the question.

| package                      | upstream state                                                      | verdict                       |
| ---------------------------- | ------------------------------------------------------------------- | ----------------------------- |
| `prettier-plugin-ignored`    | 1 release ever (2024-08-30), 3 stars, single maintainer, 20 LOC     | **vendored**, dependency gone |
| `@total-typescript/ts-reset` | 0.7.0 bumped on `main` but never published; npm stuck at 0.6.1      | **keep** the pin              |
| `eslint-plugin-jsx-a11y`     | 22 months, 18 unreleased commits (13 dev-deps/docs)                 | **keep** — no replacement     |
| `eslint-plugin-react`        | 16 months, 38 unreleased commits incl. the eslint-10 fix we shimmed | **replaced** in 4.0.0         |

**`@total-typescript/ts-reset` — keep.** Types-only, zero runtime, so a stale pin ships no code to consumers. Probed
every augmentation against our own TS 6.0.3: `.filter(Boolean)` still doesn't narrow, `JSON.parse` still returns `any`,
`Array.isArray` still widens to `any[]`, `includes`/`has`/`indexOf` still reject widened literals, `catch` reason is
still `any`, `localStorage.x` is still `any`, `new Map()` is still `Map<any, any>`. Stale, not obsolete. `reset.d.ts`
imports only `/dom`, which _is_ `recommended` + the Storage overrides — the other entrypoints are no-ops on top of it.
The exit path, if publishing never resumes, is vendoring ~60 lines of interface augmentation the way §4's prettier
plugin was done; that also picks up the unpublished 0.7.0 changes (a `.filter(Boolean)` fix for inline function
arguments, and `promise-catch` dropped from `recommended` over `Promise<A> | Promise<B>`).

**`eslint-plugin-jsx-a11y` — keep.** Its rules verifiably run under eslint 10 (§3); only the peer range is stale
metadata. Nothing else covers JSX a11y at this depth: `eslint-plugin-jsx-a11y-x` (es-tooling fork, peers `^9 || ^10`) is
the fallback if a future eslint major does break it — note it exports `configs.recommended`, not the
`flatConfigs.recommended` `eslint.js` reads, so the swap is a call-site edit — and `@htmlacademy/eslint-plugin-jsx-a11y`
is a single-release fork. The only other option is moving a11y linting to another linter entirely, which is not a
dependency decision.

**`eslint-plugin-react` — replaced by `@eslint-react/eslint-plugin` in 4.0.0** (#36). Rule IDs changed, so consumers'
inline `eslint-disable` comments break: it shipped as `feat!:`, never as a Renovate PR. How `eslint.js` wires it, and
what a future bump has to preserve:

- **the configs carry no `files` key**, so each one is scoped at the call site. `**/*.ts?(x)` gets
  `recommended-type-checked`, `**/*.jsx` gets `recommended` — the difference is `no-leaked-conditional-rendering`, the
  one rule needing type information, and `projectService` is only wired for `**/*.ts?(x)`. **`.jsx` therefore has no
  leaked-render check**; wiring `projectService` for `.jsx` would mean requiring `allowJs` from every consumer.
- **one plugin key, `@eslint-react`**, for all six rule families — the `dom-`, `web-api-`, `jsx-` and
  `naming-convention-` prefixes are rule-name prefixes, not separate plugins. The roster test asserts that single key.
- **`rules-of-hooks` and `exhaustive-deps` are turned `OFF`** because `eslint-plugin-react-hooks` (React's own, still
  actively released) owns them here; both enabled reports the same line twice. Ignore
  `disable-conflict-eslint-plugin- react-hooks` — it disables the wrong side, silencing react-hooks in favour of
  eslint-react.
- **three rules are enabled by hand** because `recommended` omits them: `dom-no-missing-button-type`,
  `dom-no-unknown-property`, `dom-no-unsafe-target-blank`. A version that finally folds them into `recommended` makes
  those lines redundant, not wrong.
- **the rule count roughly tripled** (~22 → 65+): `recommended` brings the React-correctness set the old config never
  had (`purity`, `set-state-in-render`, `static-components`, `use-memo`, `web-api-no-leaked-*`, `naming-convention-*`).
  Consumer noise from those is a config decision, not a bug in the swap.
- **gone with no replacement:** `jsx-boolean-value`, `no-unescaped-entities`, `require-render-return`, and the
  `formComponents`/`linkComponents` settings — nothing else read them, so custom `<Link>` components are no longer
  checked for unsafe `target="_blank"`. `prop-types` is absent by design, which matched our `OFF`.
- `fixture/src/ui/card.tsx` carries one deliberate violation per migrated rule, and the `ci.yml` fixture job asserts
  both a plain rule and the type-aware one — that pair is what proves the parser-services wiring above.
