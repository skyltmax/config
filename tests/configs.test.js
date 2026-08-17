import { format } from "prettier"
import { describe, expect, test } from "vitest"

import { config as eslintConfig } from "../eslint.js"
import { config as prettierConfig } from "../prettier.js"

describe("prettier config", () => {
  test("plugins are resolved to URLs inside this package, not bare names", async () => {
    expect(prettierConfig.plugins).toHaveLength(2)

    for (const plugin of prettierConfig.plugins) {
      expect(plugin).toMatch(/^file:\/\//)
      // a bare name would make prettier resolve from the consumer's context; a URL is import()-able from anywhere
      await expect(import(plugin)).resolves.toBeDefined()
    }
  })

  // The vendored `ignored` parser (prettier-ignored-plugin.js) is how the shared config excludes files without a
  // .prettierignore in the consumer's repo — it has to return the source byte for byte, whitespace included.
  test("the ignored parser formats a file to exactly its input", async () => {
    const source = "packages:\n  - 'apps/*'\n\n\n   trailing spaces   \n"

    await expect(format(source, { parser: "ignored", plugins: prettierConfig.plugins })).resolves.toBe(source)
  })

  test("the pnpm manifests are the globs routed to the ignored parser", () => {
    const ignoredGlobs = prettierConfig.overrides
      .filter(override => override.options.parser === "ignored")
      .flatMap(override => override.files)

    expect(ignoredGlobs).toEqual(["**/pnpm-lock.yaml", "**/pnpm-workspace.yaml"])
  })
})

// Every plugin eslint.js loads, alphabetically. All of them resolve from this package's own dependencies, so a missing
// entry means a dependency or an import in eslint.js broke — never a consumer misconfiguration.
const EXPECTED_ESLINT_PLUGINS = [
  "@eslint-react",
  "@typescript-eslint",
  "import",
  "jest-dom",
  "jsx-a11y",
  "prettier",
  "react-hooks",
  "testing-library",
  "vitest",
]

describe("eslint config", () => {
  test("exports a flat config array with every plugin loaded from our own dependencies", () => {
    expect(Array.isArray(eslintConfig)).toBe(true)
    expect(eslintConfig.length).toBeGreaterThan(0)

    const plugins = new Map(eslintConfig.flatMap(entry => Object.entries(entry.plugins ?? {})))

    for (const expected of EXPECTED_ESLINT_PLUGINS) {
      // The value, not just the key: a failed import leaves the name in place with nothing behind it.
      expect(plugins.get(expected), `plugin "${expected}" should be loaded`).toBeInstanceOf(Object)
    }

    // Exact roster, so adding or dropping a plugin has to be a deliberate edit to the list above.
    expect([...plugins.keys()].sort()).toEqual(EXPECTED_ESLINT_PLUGINS)
  })
})
