import { config as baseConfig } from "./eslint.js"

const repoOnlyIgnores = [
  {
    ignores: ["fixture/**"],
  },
]

/** @type {import("eslint").Linter.Config[]} */
const config = [...repoOnlyIgnores, ...baseConfig]

export default config
