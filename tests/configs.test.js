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
})

// Every plugin eslint.js loads, alphabetically. All of them resolve from this package's own dependencies, so a missing
// entry means a dependency or an import in eslint.js broke — never a consumer misconfiguration.
const EXPECTED_ESLINT_PLUGINS = [
  "@typescript-eslint",
  "import",
  "jest-dom",
  "jsx-a11y",
  "prettier",
  "react",
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
