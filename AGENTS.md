# AI Agent Guide for @skyltmax/config

This document provides comprehensive guidance for AI coding agents working with the `@skyltmax/config` package.

## Table of Contents

1. [Conventions](#conventions)
2. [Package Overview](#package-overview)
3. [Getting Started](#getting-started)
4. [Development](#development)
5. [Testing](#testing)
6. [Configuration](#configuration)

---

## Conventions

- Max line length before wrapping is 120 chars.
- Don't be overly verbose, prefer brevity.
- Always put strong emphasis on idiomatic TypeScript solutions.
- Always uphold the configured linter settings - eslint, prettier.
- Avoid tautologic comments - prefer saying nothing over stating the obvious.
- Linear git history is required. Avoid cherry-picking etc.

### Commit message

Commit messages should follow a specific format:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

For example:

```
fix(middleware): Fix device key cookie initialization

The device key middleware was not setting the cookie header correctly.

Fixes #42
```

Or:

```
feat(server): Add configurable middleware options

Allow users to disable default middleware via ServeAppOptions.

Breaking change: Default middleware is now optional
```

---

## Package Overview

### Structure

This is a **dual-language configuration package** providing ESLint, Prettier, and TypeScript configs for
JavaScript/TypeScript projects, and Rubocop configs for Ruby projects:

```
@skyltmax/config/
├── lib/
│   └── skyltmax_config.rb         # Ruby gem entry point
├── eslint.js                       # ESLint configuration
├── eslint.config.js                # Example ESLint usage
├── prettier.js                     # Prettier configuration
├── typescript.json                 # TypeScript configuration
├── reset.d.ts                      # TypeScript reset types
├── rubocop.yml                     # Rubocop base config
├── rubocop.rails.yml               # Rubocop Rails config
├── index.js                        # Package entry point
├── package.json                    # npm package manifest
├── skyltmax_config.gemspec         # Ruby gem specification
├── tsconfig.json                   # TypeScript config
├── Gemfile                         # Ruby dependencies
├── Rakefile                        # Ruby tasks
└── README.md
```

### Technology Stack

**JavaScript/TypeScript:**

- ESLint 9+ (flat config)
- Prettier 3+
- TypeScript 5+
- React support
- Vitest support
- Testing Library support

**Ruby:**

- Rubocop (>= 1.81.0)
- Rubocop Performance
- Rubocop Rails

**Key Dependencies:**

- `@typescript-eslint/eslint-plugin` & `@typescript-eslint/parser`
- `eslint-plugin-react`, `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- `eslint-plugin-import-x`
- `@vitest/eslint-plugin`
- `eslint-plugin-testing-library`, `eslint-plugin-jest-dom`
- `prettier-plugin-tailwindcss`
- `@total-typescript/ts-reset`

**System Requirements:**

- Node.js >= 18.0.0
- Ruby >= 3.4 (for Rubocop configs)

---

## Getting Started

### Installation

**For JavaScript/TypeScript projects:**

```bash
npm install --save-dev @skyltmax/config
# or
pnpm add -D @skyltmax/config
```

**That's it!** All required tools (ESLint, Prettier, TypeScript, and all plugins) are bundled as dependencies. No need
to install peer dependencies separately.

**For Ruby projects:**

```ruby
# Gemfile
gem "skyltmax_config"
```

### Basic Usage

**ESLint:**

```javascript
// eslint.config.js
import { config as defaultConfig } from "@skyltmax/config/eslint"

/** @type {import("eslint").Linter.Config[]} */
export default [...defaultConfig]
```

**Prettier:**

```json
// package.json
{
  "prettier": "@skyltmax/config/prettier"
}
```

**TypeScript:**

```json
// tsconfig.json
{
  "extends": ["@skyltmax/config/typescript"],
  "include": ["**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "paths": {
      "#app/*": ["./app/*"]
    }
  }
}
```

**Rubocop:**

```yaml
# .rubocop.yml
inherit_gem:
  skyltmax_config:
    - rubocop.yml
    - rubocop.rails.yml
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Run validation
pnpm validate

# Run individual checks
pnpm format    # Format with Prettier
pnpm lint      # Lint with ESLint
pnpm typecheck # Type check with TypeScript
```

---

## Development

### File Structure

**JavaScript/TypeScript Files:**

- `eslint.js` - ESLint configuration export with all rules and plugins
- `prettier.js` - Prettier configuration with formatting options
- `typescript.json` - TypeScript compiler configuration
- `reset.d.ts` - TypeScript type reset declarations
- `index.js` - Package entry point
- `eslint.config.js` - Example ESLint configuration usage

**Ruby Files:**

- `lib/skyltmax_config.rb` - Ruby gem entry point
- `rubocop.yml` - Base Rubocop configuration
- `rubocop.rails.yml` - Rails-specific Rubocop rules
- `skyltmax_config.gemspec` - Gem specification
- `Gemfile` - Ruby dependencies
- `Rakefile` - Ruby build tasks

### ESLint Configuration (`eslint.js`)

The ESLint configuration uses the flat config format (ESLint 9+) and exports an array of configuration objects:

```javascript
export const config = [
  // Ignore patterns
  { ignores: ["**/node_modules/**", "**/build/**", ...] },

  // Base configs
  ...(await import("@eslint/js")).default.configs.recommended,
  ...(await import("eslint-plugin-prettier/recommended")).default,

  // Import rules for all files
  { plugins: { import: ... }, rules: { "import/order": ... } },

  // React/JSX specific rules
  { files: ["**/*.tsx", "**/*.jsx"], plugins: { react: ... } },

  // TypeScript specific rules
  ...(await import("typescript-eslint")).default.config({ files: ["**/*.ts?(x)"] }),

  // Test file rules (Vitest, Testing Library, Jest DOM)
  { files: testFiles, plugins: { vitest: ... } },
]
```

**Key Features:**

- React and React Hooks support
- JSX accessibility rules
- TypeScript type-aware linting
- Import ordering and deduplication
- Vitest test file support
- Testing Library rules
- Jest DOM assertions

**Common Rules:**

- `import/order` - Alphabetized, grouped imports
- `import/no-duplicates` - Prevent duplicate imports with inline types
- `@typescript-eslint/consistent-type-imports` - Prefer `type` imports
- `react/jsx-no-leaked-render` - Prevent leaked renders in JSX
- `no-warning-comments` - Disallow FIXME comments

### Prettier Configuration (`prettier.js`)

The Prettier config emphasizes readability and consistency:

```javascript
export const config = {
  printWidth: 120, // Max line length
  semi: false, // No semicolons
  singleQuote: false, // Double quotes
  trailingComma: "es5", // Trailing commas where valid in ES5
  arrowParens: "avoid", // Omit parens when possible
  // ... other options
  plugins: ["prettier-plugin-tailwindcss"],
}
```

**Tailwind Support:**

- Automatic class sorting via `prettier-plugin-tailwindcss`
- Configurable class attributes and functions
- Default: `className`, `class`, and `clsx`/`cn` functions

### TypeScript Configuration (`typescript.json`)

Base TypeScript configuration for strict type checking:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
    // ... other strict options
  }
}
```

**TypeScript Reset (`reset.d.ts`):**

- Imports `@total-typescript/ts-reset`
- Provides better type definitions for common JS APIs
- Fixes issues with `Array.includes`, `JSON.parse`, `fetch`, etc.

### Rubocop Configuration

**Base Config (`rubocop.yml`):**

- Strict Ruby style enforcement
- Performance optimizations
- Disabled cops that conflict with modern Ruby style

**Rails Config (`rubocop.rails.yml`):**

- Rails-specific linting rules
- Database conventions
- ActiveRecord best practices

### TypeScript Conventions

**Exports:**

- Use named exports for configurations
- Provide default export for backward compatibility
- Example: `export const config = {...}; export default config;`

**Imports:**

- Use dynamic imports for ESLint plugins (required for flat config)
- Example: `(await import("eslint-plugin-react")).default`

**Code Style:**

- Follow configured Prettier settings
- Max line length: 120 characters
- No semicolons
- Double quotes for strings
- Trailing commas in ES5 contexts

### Patterns

**Configuration Pattern:** All configuration files follow a similar pattern:

1. Define constants (severity levels, file patterns)
2. Export configuration object/array
3. Provide default export for compatibility
4. Add JSDoc type annotations for IDE support

Example:

```javascript
/** @type {import("prettier").Options} */
export const config = {
  /* ... */
}
export default config
```

### Making Changes

When updating configurations:

1. **ESLint:** Update `eslint.js` with new rules/plugins
2. **Prettier:** Update `prettier.js` formatting options
3. **TypeScript:** Update `typescript.json` compiler options
4. **Rubocop:** Update `rubocop.yml` or `rubocop.rails.yml`
5. **Version:** Bump version in both `package.json` AND `skyltmax_config.gemspec`
6. **Changelog:** Document changes in `CHANGELOG.md`
7. **Test:** Run `pnpm validate` to ensure configs work

---

## Testing

This package **does not include automated tests** as it primarily provides configuration files. Testing is done by:

1. **Using the configs in real projects** - The configurations are dogfooded
2. **Manual validation** - `pnpm validate` checks formatting, linting, and type-checking
3. **CI/CD validation** - GitHub Actions verify the package structure

### Validation Process

**Run all checks:**

```bash
pnpm validate
```

This runs:

- `pnpm format` - Prettier formatting
- `pnpm lint` - ESLint validation
- `pnpm typecheck` - TypeScript compilation

**Individual checks:**

```bash
pnpm format    # Auto-format all files
pnpm lint      # Check ESLint rules
pnpm typecheck # Verify TypeScript types
```

### Testing Configuration Changes

When modifying configurations:

1. **Test in a real project:**
   - Link the package locally: `pnpm link /path/to/config`
   - Verify ESLint runs without errors
   - Check Prettier formats correctly
   - Ensure TypeScript compiles

2. **Check backward compatibility:**
   - Existing projects should not break
   - New rules should be additive or opt-in
   - Document breaking changes in CHANGELOG

3. **Validate exports:**
   - Ensure all exports work: `import { config } from "@skyltmax/config/eslint"`
   - Check both named and default exports
   - Verify TypeScript definitions are correct

### Rubocop Testing

For Ruby configurations:

```bash
# Test Rubocop configs locally
bundle exec rubocop

# Test with specific config
bundle exec rubocop --config rubocop.yml
bundle exec rubocop --config rubocop.rails.yml
```

### Continuous Integration

The package uses GitHub Actions for CI/CD with two workflows:

**CI Workflow (`.github/workflows/ci.yml`)** - Runs on PRs and pushes to main:

1. **Validate JavaScript/TypeScript configs:**
   - Runs `pnpm validate` (dogfooding - lints/formats/typechecks itself)
   - Ensures ESLint, Prettier, and TypeScript configs work correctly

2. **Validate Ruby configs:**
   - Runs `bundle exec rubocop` (dogfooding - validates Rubocop configs)

3. **Version sync check:**
   - Verifies `package.json` and `lib/skyltmax_config/version.rb` versions match
   - Prevents version drift between npm and gem

4. **Package installation test:**
   - Packs the package with `pnpm pack`
   - Installs in a test project
   - Verifies all exports work (ESLint, Prettier, TypeScript, reset.d.ts)

**Release Workflow (`.github/workflows/release.yml`)** - Publishes on GitHub Release:

1. Verifies tag version matches both package.json and version.rb
2. Publishes npm package with provenance (trusted publishing)
3. Publishes RubyGems gem (trusted publishing)

**Key CI principle:** Dogfooding is the primary validation strategy. The package validates itself using its own
configurations, which ensures the configs are functional and catches issues early.

---

## Configuration

### Package Structure

This package uses a dual-publishing approach:

**NPM Package (`@skyltmax/config`):**

- Main entry: `index.js`
- Exports: `./prettier`, `./typescript`, `./eslint`, `./reset.d.ts`
- Version must match gemspec version

**Ruby Gem (`skyltmax_config`):**

- Entry point: `lib/skyltmax_config.rb`
- Provides Rubocop configurations
- Version must match package.json version

### Dependency Management

This package uses **peer dependencies** to provide all required tooling while ensuring proper editor/IDE discovery:

**Why Peer Dependencies?**

1. **Editor Discovery:** Tools like VSCode, WebStorm, and others look for `prettier`, `eslint`, and `typescript` in the
   project's root `node_modules`. When bundled as regular dependencies, they end up in
   `node_modules/@skyltmax/config/node_modules`, which editors cannot find.

2. **Automatic Installation:** Modern package managers with `autoInstallPeers` enabled (pnpm's default, npm 7+
   configurable) automatically install peer dependencies, so users get a "single install" experience.

3. **Hoisting:** Peer dependencies are hoisted to the root `node_modules`, making them discoverable by all tools and
   editors.

4. **Version Control:** This package controls the **exact** versions (no semver ranges) to ensure all consuming projects
   get identical tool versions for reproducible linting/formatting/type-checking.

**Structure:**

- **peerDependencies:** All ESLint, Prettier, TypeScript tools and plugins with **exact versions** (no semver ranges)
- **devDependencies:** Only dev-specific tools (`@types/react`, `npm-run-all`, `react`) - peer dependencies are
  auto-installed by pnpm for local development

**All tooling (declared as peer dependencies with exact versions):**

- **ESLint & Core:** `eslint`, `@eslint/js`, `typescript-eslint`
- **TypeScript ESLint:** `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/utils`
- **Prettier:** `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`, `prettier-plugin-tailwindcss`
- **TypeScript:** `typescript`, `@total-typescript/ts-reset`, `tslib`
- **Plugins:** `eslint-plugin-import-x`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`
- **Testing:** `@vitest/eslint-plugin`, `eslint-plugin-testing-library`, `eslint-plugin-jest-dom`
- **Utilities:** `globals`

**Benefits:**

**Benefits:**

- ✅ **Version control:** Consuming projects get consistent, tested versions
- ✅ **Simplified setup:** Single `npm install @skyltmax/config` gets everything (with autoInstallPeers enabled)
- ✅ **No version conflicts:** This package manages compatibility between tools
- ✅ **Updates centralized:** Bump versions here, all projects benefit
- ✅ **Editor compatibility:** Tools are hoisted to root `node_modules/` for VSCode, WebStorm, etc.

**Note:** pnpm enables `autoInstallPeers` by default. For npm 7+, you may need to enable it with
`npm config set auto-install-peers true` or install peers manually if warnings appear.

**DevDependencies (development only):**

- `@types/react` - Type definitions for development
- `npm-run-all` - Script runner
- `react` - For testing React-related rules

**Files Included in Published Package:**

The `files` field specifies what gets published to npm:

- `*.js`, `*.json`, `*.d.ts`, `*.yml` - Configuration files
- `lib/**` - Ruby gem files
- `README.md`, `LICENSE` - Documentation

### Version Management

**Critical:** Versions must be kept in sync across `package.json` and `lib/skyltmax_config/version.rb`.

The gemspec automatically reads the version from `lib/skyltmax_config/version.rb`, so you only need to update two files:

```json
// package.json
{
  "version": "0.0.5"
}
```

```ruby
# lib/skyltmax_config/version.rb
module SkyltmaxConfig
  VERSION = "0.0.5"
end
```

**Note:** The `skyltmax_config.gemspec` uses `SkyltmaxConfig::VERSION` and does not need manual version updates.

### Publishing Process

Releases are automated via GitHub Actions when a release is published:

1. **Update versions:**
   - `package.json`: `"version": "x.y.z"`
   - `lib/skyltmax_config/version.rb`: `VERSION = "x.y.z"`

2. **Update changelog:**
   - Add changes to `CHANGELOG.md`

3. **Commit and push:**

   ```bash
   git add package.json lib/skyltmax_config/version.rb CHANGELOG.md
   git commit -m "chore: bump version to x.y.z"
   git push
   ```

4. **Create release:**
   - Create Git tag: `vX.Y.Z`
   - Create GitHub Release for that tag
   - Or run "Publish release" workflow manually

**The workflow:**

- Verifies tag version matches both package.json and version.rb
- Publishes npm package with provenance
- Builds and pushes Ruby gem to RubyGems

### Adding New Configurations

When adding new linting rules or formatting options:

1. **Add to appropriate file:**
   - ESLint rules → `eslint.js`
   - Prettier options → `prettier.js`
   - TypeScript options → `typescript.json`
   - Rubocop rules → `rubocop.yml` or `rubocop.rails.yml`

2. **Document in README.md:**
   - Add usage examples
   - List new features
   - Update configuration sections

3. **Update CHANGELOG.md:**
   - Document what changed
   - Note any breaking changes
   - Provide migration guidance if needed

4. **Test locally:**
   - Run `pnpm validate`
   - Test in a real project via `pnpm link`

5. **Update version:**
   - Bump both `package.json` and `skyltmax_config.gemspec`
   - Follow semantic versioning

### Backward Compatibility

When making changes:

- ✅ Add new optional configuration options
- ✅ Add new rules as warnings first, then errors in next major
- ✅ Provide sensible defaults for all options
- ✅ Support both old and new usage patterns
- ❌ Don't remove exports without major version bump
- ❌ Don't change default behavior without documenting
- ❌ Don't introduce breaking changes in minor/patch versions

### Export Structure

The package exports are defined in `package.json`:

```json
{
  "exports": {
    ".": "./index.js",
    "./prettier": "./prettier.js",
    "./typescript": "./typescript.json",
    "./reset.d.ts": "./reset.d.ts",
    "./eslint": "./eslint.js"
  }
}
```

All exports must:

- Have valid file paths
- Export both named and default exports (JS files)
- Include proper JSDoc type annotations
- Be documented in README.md
