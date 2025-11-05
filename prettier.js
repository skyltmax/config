/** @type {import("prettier").Options} */
export const config = {
  arrowParens: "avoid",
  bracketSameLine: false,
  bracketSpacing: true,
  embeddedLanguageFormatting: "auto",
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "css",
  insertPragma: false,
  jsxSingleQuote: false,
  printWidth: 120,
  proseWrap: "always",
  quoteProps: "as-needed",
  requirePragma: false,
  semi: false,
  singleAttributePerLine: false,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
  overrides: [
    // formatting the package.json with anything other than spaces will cause
    // issues when running install...
    {
      files: ["**/package.json"],
      options: {
        useTabs: false,
      },
    },
    {
      // leave pnpm manifests exactly as written to avoid churn from upstream tooling
      files: ["**/pnpm-lock.yaml", "**/pnpm-workspace.yaml"],
      options: {
        parser: "ignored",
      },
    },
    {
      files: ["**/*.mdx"],
      options: {
        // This stinks, if you don't do this, then an inline component on the
        // end of the line will end up wrapping, then the next save Prettier
        // will add an extra line break. Super annoying and probably a bug in
        // Prettier, but until it's fixed, this is the best we can do.
        proseWrap: "preserve",
        htmlWhitespaceSensitivity: "ignore",
      },
    },
  ],
  plugins: ["prettier-plugin-ignored", "prettier-plugin-tailwindcss"],
  tailwindAttributes: ["class", "className", ".*[cC]lassName"],
  tailwindFunctions: ["clsx", "cn", "twcn"],
}

// this is for backward compatibility
export default config
