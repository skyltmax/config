import "@total-typescript/ts-reset/dom"
import "@total-typescript/ts-reset/filter-boolean"

import "react"

declare module "react" {
  // support css variables
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
