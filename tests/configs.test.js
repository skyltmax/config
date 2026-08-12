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

describe("eslint config", () => {
  test("exports a flat config array with every plugin loaded from our own dependencies", () => {
    expect(Array.isArray(eslintConfig)).toBe(true)
    expect(eslintConfig.length).toBeGreaterThan(0)

    const pluginNames = new Set(eslintConfig.flatMap(entry => Object.keys(entry.plugins ?? {})))

    for (const expected of ["import", "react", "react-hooks", "testing-library", "prettier", "@typescript-eslint"]) {
      expect(pluginNames, `plugin "${expected}" should be loaded`).toContain(expected)
    }
  })
})
