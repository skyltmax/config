// Type-level checks for the vendored ts-reset in ts-reset.d.ts, loaded through reset.d.ts by tsconfig.json's `types`.
// Nothing here runs: `pnpm typecheck` is the test, and a failing assertion is a compile error. Each line documents a
// behaviour consumers of `@signmax/config/reset.d.ts` rely on, including the two entrypoints deliberately left out.

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T

declare const values: (string | number | null | undefined | 0 | "")[]
declare const response: Response
declare const literals: readonly ("a" | "b")[]
declare const widened: string
declare const anything: unknown
declare const union: Promise<string> | Promise<number>
declare const element: HTMLDivElement

const _filtered = values.filter(Boolean)
const _parsed = JSON.parse("{}")
const _json = response.json()
const _map = new Map()
const _stored = localStorage.token
const _cloned = element.cloneNode(true)

export type Checks = [
  // filter-boolean
  Expect<Equal<typeof _filtered, (string | number)[]>>,
  // json-parse, fetch
  Expect<Equal<typeof _parsed, unknown>>,
  Expect<Equal<typeof _json, Promise<unknown>>>,
  // map-constructor
  Expect<Equal<typeof _map, Map<unknown, unknown>>>,
  // storage
  Expect<Equal<typeof _stored, unknown>>,
  // clone-node
  Expect<Equal<typeof _cloned, HTMLDivElement>>,
]

// filter-boolean inline as an argument still checks the elements (ts-reset#233; 0.6.1 let this compile)
declare function pet(animals: readonly { type: string; name: string }[]): void
// @ts-expect-error — `{ type: "dog" }` is missing `name`
pet([{ type: "cat", name: "Fluffy" }, { type: "dog" }].filter(Boolean))

// array-includes: a widened value is accepted without a cast
literals.includes(widened)

// is-array narrows to unknown[], not any[]
if (Array.isArray(anything)) {
  const first: unknown = anything[0]
  // @ts-expect-error — unknown is not assignable to string; under the stock lib this would be any and compile
  const notAny: string = anything[0]
  void [first, notAny]
}

// promise-catch is NOT vendored: `.catch` on a union of promises compiles (ts-reset#209 made it TS2349)
void union.catch(() => undefined)

// map-groupby / object-groupby are NOT vendored: the ES2022 target from typescript.json still rejects them
// @ts-expect-error — TS2550, groupBy needs lib es2024
void Map.groupBy([1], n => n)
// @ts-expect-error — TS2550, groupBy needs lib es2024
void Object.groupBy([1], n => n)
