// Vendored ts-reset (the `/dom` set minus groupBy and promise-catch; see the header of ts-reset.d.ts). A path reference,
// not an import, because it bypasses module resolution: under a consumer's `nodenext`, `import "./ts-reset"` resolves
// to nothing without an error (this file is a library .d.ts), silently dropping every override.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./ts-reset.d.ts" />

import "react"

declare module "react" {
  // support css variables
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
