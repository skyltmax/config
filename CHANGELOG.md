# Change Log

### Unreleased

### [4.0.1] - 2026-11-11

- fix: `.filter(Boolean)` narrows arrays of objects again. 4.0.0 vendored ts-reset 0.7.0's `filter` override verbatim,
  and its `NonFalsy<NoInfer<S>>` return type left any array with object members un-narrowed (`(Obj | null)[]` stayed
  `NoInfer<Obj | null>[]`), rejected correct `.filter(Boolean)` arguments, and broke generic `(U | null)[]`. The
  vendored override now returns `NoInfer<NonFalsy<S>>[]`, which narrows every element type and keeps the inline argument
  check 4.0.0 added. Hovers show `NoInfer<Obj>[]`; it is assignable to `Obj[]`.

### [4.0.0] - 2026-11-11

Upgrade guide: [docs/migrations/4.0.0.md](docs/migrations/4.0.0.md).

- feat!: Replace `eslint-plugin-jsx-a11y` with `eslint-plugin-jsx-a11y-x`, its maintained `eslint-community` fork with
  eslint 10 support. Rule IDs and the `settings` key move from `jsx-a11y` to `jsx-a11y-x`, so `eslint-disable` comments
  and rule overrides naming `jsx-a11y/*` must be renamed. The enabled rules, severities and options are unchanged.
- chore: Drop ~100 transitive packages (the polyfill tree `eslint-plugin-jsx-a11y` pulled in).
- feat!: Vendor `@total-typescript/ts-reset` as `ts-reset.d.ts` and drop the dependency; npm is stuck at 0.6.1 because
  upstream's 0.7.0 publish failed. `reset.d.ts` now carries 0.7.0's `/dom` set: `.catch()`/`.then()` on a
  `Promise<A> | Promise<B>` union compiles again (the `reason` parameter is `any` again), `.filter(Boolean)` inline in a
  call argument now type-checks its elements, and `cloneNode()` keeps the element type. 0.7.0's `Map.groupBy`/
  `Object.groupBy` overrides are left out, since they would make `groupBy` typecheck under the ES2022 lib.

### [3.0.1] - 2026-11-11

- chore: dependency updates

### [3.0.0] - 2026-08-17

- feat!: React 19
- feat!: Replace `eslint-plugin-react`with `@eslint-react/eslint-plugin`.
- chore: Vendor the `ignored` prettier parser as `prettier-ignored-plugin.js` and drop the `prettier-plugin-ignored`
  dependency.

### [2.0.0] - 2026-08-12

- feat!: Support eslint 10 (`peerDependencies` widened to `^9.30.0 || ^10.0.0`); the pinned eslint plugins are all
  eslint-10 compatible, and `@eslint/js` moved to 10.
- fix: Resolve the React version for `eslint-plugin-react` in this config instead of using its `version: "detect"`,
  which crashes on eslint 10 (it calls the removed `context.getFilename()` — jsx-eslint/eslint-plugin-react#4018).
  Detection is anchored on the linted project, so consumers keep version-accurate react rules.
- feat!: Move all eslint/prettier plugins (and `@total-typescript/ts-reset`) from `peerDependencies` to `dependencies`;
  they now resolve from this package and consumers stop declaring them.
- feat!: Shrink `peerDependencies` to ranged CLIs: `eslint ^9.30.0`, `prettier ^3.6.0`, `typescript >=5.9 <6.1`.
- feat!: Drop support for eslint 10 (1.0.0 pinned `eslint 10.1.0`). The pinned `eslint-plugin-react-hooks`,
  `eslint-plugin-jsx-a11y`, and `eslint-plugin-jest-dom` only declare support through eslint 9, so consumers on eslint
  10 must move to `^9.30.0`. Support returns once those plugins ship eslint 10 peer ranges.
- feat!: Remove the `skyltmax-config-peers` bin and the peer install/audit scripts.
- fix: Resolve prettier plugins via `import.meta.resolve` instead of bare names, so resolution is anchored to this
  package instead of the consumer's context.

### [1.0.0] - 2026-03-31

- chore: Release stable version.
- chore: Bump peer dependencies.

### [0.0.15] - 2026-03-31

- feat: Change ignored vars pattern.
- chore: Lock rubocop version to one with bugfix https://github.com/rubocop/rubocop/pull/14867
- chore: Update ruby and node versions.

### [0.0.14] - 2026-02-10

- fix: Lock rubocop version to avoid version with bug https://github.com/rubocop/rubocop/pull/14867

### [0.0.13] - 2026-02-10

- build: Switched to official package registries.

### [0.0.12] - 2025-11-11

- feat: Detect pnpm workspace for peer config script.

### [0.0.11] - 2025-11-06

- fix: Ignore pnpm lockfile and workspace config.

### [0.0.10] - 2025-11-05

- fix: Handle symlinked execution in peer-deps scripts.

### [0.0.9] - 2025-11-05

- feat: Add helper CLI for syncing peer dependencies.
- chore: Warn consumers about missing or mismatched peer dependencies on postinstall.

### [0.0.8] - 2025-11-05

- fix: Move dependencies to peer dependencies.

### [0.0.7] - 2025-11-05

- feat: Make prettier tailwind plugin optional.

### [0.0.6] - 2025-11-05

- fix: Add missing eslint-config-prettier dependency.

### [0.0.5] - 2025-11-04

- Fix rubygems attestation.

### [0.0.4] - 2025-11-04

- Fix rubygems release.

### [0.0.3] - 2025-11-04

- Fix rubygems release.

### [0.0.2] - 2025-11-04

- First public release.
