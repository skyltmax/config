# 👮 Skyltmax Config

[![CI](https://github.com/skyltmax/config/actions/workflows/ci.yml/badge.svg)](https://github.com/skyltmax/config/actions/workflows/ci.yml)

**Reasonable ESLint, Prettier, TypeScript, and Rubocop configs.**

Based on <a href="https://github.com/epicweb-dev/config">@epic-web/config</a>.

## Installation

### JavaScript/TypeScript

```bash
npm install --save-dev @signmax/config
# or
pnpm add -D @signmax/config
```

Once the package is in place, sync the tooling versions we pin:

```bash
npx signmax-config-peers --dry-run # inspect the command (optional)
npx signmax-config-peers
```

The helper installs the exact ESLint, Prettier, TypeScript, and plugin versions we dogfood with. It currently supports
`npm`, `pnpm`, and `bun`. If you prefer to manage things yourself, install each entry from
[`peerDependencies`](package.json) with the version locked there.

> After installation the package runs a lightweight audit and will warn if any peer is missing or pinned to a different
> version. When that happens, rerun `npx signmax-config-peers` to sync everything.

### Ruby

Include the gem in your `Gemfile`:

```rb
gem "skyltmax_config"
```

## Usage

### Rubocop

Inherit the configs from the gem in your `.rubocop.yml`:

```yml
inherit_gem:
  skyltmax_config:
    - rubocop.yml
    - rubocop.rails.yml
```

### Prettier

The easiest way to use this config is in your `package.json`:

```json
"prettier": "@signmax/config/prettier"
```

<details>
  <summary>Customizing Prettier</summary>

If you want to customize things, you should probably just copy/paste the built-in config. But if you really want, you
can override it using regular JavaScript stuff.

Create a `.prettierrc.js` file in your project root with the following content:

```js
import defaultConfig from "signmax/config/prettier"

/** @type {import("prettier").Options} */
export default {
  ...defaultConfig,
  // .. your overrides here...
}
```

</details>

### TypeScript

Create a `tsconfig.json` file in your project root with the following content:

```json
{
  "extends": ["@signmax/config/typescript"],
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "compilerOptions": {
    "paths": {
      "#app/*": ["./app/*"],
      "#tests/*": ["./tests/*"]
    }
  }
}
```

Create a `reset.d.ts` file in your project with these contents:

```typescript
import "@signmax/config/reset.d.ts"
```

<details>
  <summary>Customizing TypeScript</summary>

Learn more from [the TypeScript docs here](https://www.typescriptlang.org/tsconfig/#extends).

</details>

### ESLint

Create a `eslint.config.js` file in your project root with the following content:

```js
import { config as defaultConfig } from "@signmax/config/eslint"

/** @type {import("eslint").Linter.Config[]} */
export default [...defaultConfig]
```

<details>
  <summary>Customizing ESLint</summary>

Learn more from
[the Eslint docs here](https://eslint.org/docs/latest/extend/shareable-configs#overriding-settings-from-shareable-configs).

</details>

There are endless rules we could enable. However, we want to keep our configurations minimal and only enable rules that
catch real problems (the kind that are likely to happen). This keeps our linting faster and reduces the number of false
positives.

## Publishing

This repo publishes a Ruby gem (skyltmax_config) and an npm package (@signmax/config) whenever a GitHub Release is
published. A manual run is also available.

Setup (one-time):

- In rubygems and npmjs configure trusted publishing.
- Ensure package and gem versions match. The workflow verifies that the git tag version equals both versions.

How to release:

1. Update versions:
   - `package.json`: `"version": "x.y.z"`
   - `lib/skyltmax_config/version.rb`: `VERSION = "x.y.z"`
2. Commit and push changes.
3. Create a Git tag vX.Y.Z and a GitHub Release for that tag (or run the "Publish release" workflow with that ref).

What the workflow does:

- Verifies tag version matches package.json and version.rb
- Publishes the npm package with provenance enabled
- Builds and pushes the gem to RubyGems

## License

MIT
