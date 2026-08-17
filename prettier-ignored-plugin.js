// Vendored replacement for `prettier-plugin-ignored` (1.0.0 — one release ever, 2024-08-30, single maintainer). The
// package was 20 lines of no-op parser/printer; owning them here removes a registry dependency from every consumer's
// tree without changing behaviour.
//
// Why the shape exists at all: prettier has no shareable ignore mechanism. `.prettierignore`, `--ignore-path` and
// `.gitignore` all live in the consumer's repo, so a shared config can only exclude a file by formatting it to exactly
// what it already was. The parser hands the source through untouched and the printer prints it back verbatim; an
// `overrides` entry in `prettier.js` opts a glob in via `parser: "ignored"`.

/** @type {import("prettier").SupportLanguage[]} */
export const languages = [
  {
    name: "ignored",
    parsers: ["ignored"],
  },
]

/** @type {Record<string, import("prettier").Parser<string>>} */
export const parsers = {
  ignored: {
    parse: source => source,
    astFormat: "ignored-ast",
    locStart: () => 0,
    locEnd: node => node.length,
  },
}

/** @type {Record<string, import("prettier").Printer<string>>} */
export const printers = {
  "ignored-ast": {
    print: path => path.node ?? "",
  },
}
