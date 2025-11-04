import globals from "globals"

const ERROR = "error"
const WARN = "warn"
const OFF = "off"

const vitestFiles = ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"]
const testFiles = ["**/tests/**", "**/#tests/**", ...vitestFiles]
const playwrightFiles = ["**/e2e/**"]

/** @type {import("eslint").Linter.Config[]} */
export const config = [
  {
    ignores: [
      "**/.cache/**",
      "**/node_modules/**",
      "**/build/**",
      "**/public/build/**",
      "**/playwright-report/**",
      "**/server-build/**",
      "**/dist/**",
      "**/coverage/**",
    ],
  },

  (await import("@eslint/js")).default.configs.recommended,
  (await import("eslint-plugin-prettier/recommended")).default,

  // all files
  {
    plugins: {
      import: (await import("eslint-plugin-import-x")).default,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unexpected-multiline": ERROR,
      "no-warning-comments": [ERROR, { terms: ["FIXME"], location: "anywhere" }],
      "import/no-duplicates": [WARN, { "prefer-inline": true }],
      "import/order": [
        WARN,
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [{ pattern: "#*/**", group: "internal" }],
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        },
      ],
    },
  },

  // JSX/TSX files
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      react: (await import("eslint-plugin-react")).default,
    },
    languageOptions: {
      parser: (await import("typescript-eslint")).parser,
      parserOptions: {
        jsx: true,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        {
          name: "Link",
          linkAttribute: "to",
        },
        {
          name: "NavLink",
          linkAttribute: "to",
        },
      ],
    },
    rules: {
      ...(await import("eslint-plugin-react")).default.configs.flat.recommended.rules,
      ...(await import("eslint-plugin-react")).default.configs.flat["jsx-runtime"].rules,
      "react/jsx-key": WARN,
      "react/prop-types": OFF,
      "react/button-has-type": ERROR,
      "react/jsx-boolean-value": WARN,
      "react-hooks/exhaustive-deps": ERROR,

      "react/jsx-no-leaked-render": [
        WARN,
        {
          validStrategies: ["ternary"],
        },
      ],
    },
  },

  {
    files: ["**/*.tsx", "**/*.jsx"],
    ...(await import("eslint-plugin-jsx-a11y")).default.flatConfigs.recommended,
  },

  // react-hook rules are applicable in ts/js/tsx/jsx, but only with React as a dep
  {
    files: ["**/*.ts?(x)", "**/*.js?(x)"],
    plugins: {
      "react-hooks": (await import("eslint-plugin-react-hooks")).default,
    },
    rules: {
      "react-hooks/rules-of-hooks": ERROR,
      "react-hooks/exhaustive-deps": WARN,
    },
  },

  // JS and JSX files
  {
    files: ["**/*.js?(x)"],
    rules: {
      "no-undef": ERROR,

      // most of these rules are useful for JS but not TS because TS handles these better
      // if it weren't for https://github.com/import-js/eslint-plugin-import/issues/2132
      // we could enable this :(
      // 'import/no-unresolved': ERROR,
      "no-unused-vars": [
        ERROR,
        {
          vars: "all",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^ignored",
        },
      ],
    },
  },

  // TS and TSX files
  ...(await import("typescript-eslint")).default.config({
    files: ["**/*.ts?(x)"],
    extends: [(await import("typescript-eslint")).default.configs.recommended],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        WARN,
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          varsIgnorePattern: "^ignored",
        },
      ],
      "import/consistent-type-specifier-style": OFF,
      "@typescript-eslint/consistent-type-imports": [
        WARN,
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-misused-promises": [ERROR, { checksVoidReturn: false }],
      "@typescript-eslint/no-floating-promises": ERROR,
    },
  }),

  // This assumes test files are those which are in the test directory or have *.test.* or *.spec.* in the filename.
  // If a file doesn't match this assumption, then it will not be allowed to import test files.
  {
    files: ["**/*.ts?(x)", "**/*.js?(x)"],
    ignores: testFiles,
    rules: {
      "no-restricted-imports": [
        ERROR,
        {
          patterns: [
            {
              group: testFiles,
              message: "Do not import test files in source files",
            },
          ],
        },
      ],
    },
  },

  {
    files: testFiles,
    ignores: [...playwrightFiles],
    plugins: {
      "testing-library": (await import("eslint-plugin-testing-library")).default,
    },
    rules: {
      ...(await import("eslint-plugin-testing-library")).default.configs["flat/react"].rules,
      ...(await import("eslint-plugin-testing-library")).default.configs["flat/dom"].rules,
      "testing-library/no-unnecessary-act": [ERROR, { isStrict: false }],
      "testing-library/no-wait-for-side-effects": ERROR,
      "testing-library/prefer-find-by": ERROR,
    },
  },

  {
    files: testFiles,
    ignores: [...playwrightFiles],
    plugins: {
      "jest-dom": (await import("eslint-plugin-jest-dom")).default,
    },
    ...(await import("eslint-plugin-jest-dom")).default.configs["flat/recommended"],
  },

  {
    files: testFiles,
    ignores: [...playwrightFiles],
    plugins: {
      vitest: (await import("@vitest/eslint-plugin")).default,
    },
    rules: {
      ...(await import("@vitest/eslint-plugin")).default.configs.recommended.rules,
      // you don't want the editor to autofix this, but we do want to be made aware of it
      "vitest/no-focused-tests": [WARN, { fixable: false }],
    },
  },
].filter(Boolean)

// this is for backward compatibility
export default config
