# Change Log

### Unreleased

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
