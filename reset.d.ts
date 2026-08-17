// `/dom` is the whole `recommended` set (filter-boolean, json-parse, is-array, includes/has/indexOf, promise-catch,
// map-constructor) plus the Storage overrides — importing any of those entrypoints separately is a no-op.
import "@total-typescript/ts-reset/dom"

import "react"

declare module "react" {
  // support css variables
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
