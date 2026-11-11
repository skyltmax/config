// Vendored from @total-typescript/ts-reset (https://github.com/mattpocock/ts-reset), `src/entrypoints/` at commit
// 81b3b2614a32e47948cd4b8d5468879c07c2b361 — the unpublished 0.7.0 on `main`; npm `latest` is stuck at 0.6.1 because
// the 2026-04-01 publish failed. This is the `/dom` entrypoint (`recommended` + `storage` + `clone-node`) minus:
//
// - `map-groupby` and `object-groupby`: they declare `Map.groupBy`/`Object.groupBy` outright, so under this config's
//   ES2022 lib they typecheck instead of reporting TS2550 — they would widen the target check, not just refine a type.
// - `promise-catch`, which 0.7.0 itself drops from `recommended`: its extra overload makes `.catch()`/`.then()` on a
//   `Promise<A> | Promise<B>` union a hard TS2349 error (ts-reset#209).
//
// One deliberate deviation from upstream: `filter-boolean` returns `NoInfer<NonFalsy<S>>[]` instead of 0.7.0's
// `NonFalsy<NoInfer<S>>[]` — see the comment on that section.
//
// Must stay a global script (no top-level import/export): every declaration here merges into a lib interface.
// docs/upgrades/INTERACTIONS.md §11 has the provenance and the way back to the package.
//
// Copyright 2023 Matthew Pocock
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
// Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars --
   these are merges into lib interfaces: signatures mirror the lib's `any`, and type parameters (`Map<K, V>`) must match
   the lib's declarations exactly, used or not. */

// --- utils ---
declare namespace TSReset {
  type NonFalsy<T> = T extends false | 0 | "" | null | undefined | 0n ? never : T

  type WidenLiteral<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends bigint
          ? bigint
          : T extends symbol
            ? symbol
            : T
}

// --- fetch: `res.json()` returns unknown instead of any ---
interface Body {
  json(): Promise<unknown>
}

// --- filter-boolean: `.filter(Boolean)` removes falsy members from the element type ---
// NoInfer stops contextual typing from flowing backward into S when .filter(Boolean) is used inline as a function
// argument, which would silently skip structural checks on array elements (ts-reset#233). The <S extends T> generic
// keeps overload resolution correct so non-Boolean predicates on union arrays fall through to the built-in.
//
// DEVIATION from upstream 0.7.0, which returns `TSReset.NonFalsy<NoInfer<S>>[]`: TS keeps the NoInfer wrapper on object
// types, so NonFalsy never distributes over it — `(Obj | null)[]` stayed `NoInfer<Obj | null>[]`, and correct inline
// calls and generic `(U | null)[]` were rejected (only primitive unions narrowed). Wrapping the whole result keeps the
// #233 inference block and lets NonFalsy resolve; the only visible difference is hovers reading `NoInfer<Obj>[]`.
// tests/reset.types.ts covers both. Upstream has no issue filed for this as of 2026-11-11.
interface Array<T> {
  filter<S extends T>(predicate: BooleanConstructor, thisArg?: any): NoInfer<TSReset.NonFalsy<S>>[]
}

interface ReadonlyArray<T> {
  filter<S extends T>(predicate: BooleanConstructor, thisArg?: any): NoInfer<TSReset.NonFalsy<S>>[]
}

// --- is-array: `Array.isArray` narrows to unknown[] instead of any[] ---
interface ArrayConstructor {
  isArray(arg: any): arg is unknown[]
}

// --- json-parse: `JSON.parse` returns unknown instead of any ---
interface JSON {
  /**
   * Converts a JavaScript Object Notation (JSON) string into an object.
   * @param text A valid JSON string.
   * @param reviver A function that transforms the results. This function is called for each member of the object.
   * If a member contains nested objects, the nested objects are transformed before the parent object is.
   */
  parse(text: string, reviver?: (this: any, key: string, value: any) => any): unknown
}

// --- array-includes: `.includes` accepts the widened type of a literal-typed array ---
interface ReadonlyArray<T> {
  includes(searchElement: T | (TSReset.WidenLiteral<T> & {}), fromIndex?: number): boolean
}

interface Array<T> {
  includes(searchElement: T | (TSReset.WidenLiteral<T> & {}), fromIndex?: number): boolean
}

// --- set-has ---
interface Set<T> {
  has(value: T | (TSReset.WidenLiteral<T> & {})): boolean
}

interface ReadonlySet<T> {
  has(value: T | (TSReset.WidenLiteral<T> & {})): boolean
}

// --- map-constructor: `new Map()` is Map<unknown, unknown> instead of Map<any, any> ---
interface MapConstructor {
  new <K = unknown, V = unknown>(): Map<K, V>
}

// --- map-has ---
interface Map<K, V> {
  has(value: K | (TSReset.WidenLiteral<K> & {})): boolean
}

interface ReadonlyMap<K, V> {
  has(value: K | (TSReset.WidenLiteral<K> & {})): boolean
}

// --- array-index-of ---
interface ReadonlyArray<T> {
  lastIndexOf(searchElement: T | (TSReset.WidenLiteral<T> & {}), fromIndex?: number): number
  indexOf(searchElement: T | (TSReset.WidenLiteral<T> & {}), fromIndex?: number): number
}

interface Array<T> {
  lastIndexOf(searchElement: T | (TSReset.WidenLiteral<T> & {}), fromIndex?: number): number
  indexOf(searchElement: T | (TSReset.WidenLiteral<T> & {}), fromIndex?: number): number
}

// --- storage (dom): unknown keys on `localStorage`/`sessionStorage` read as unknown instead of any ---
interface Storage {
  [name: string & {}]: unknown
}

// --- clone-node (dom): `el.cloneNode()` keeps the element type instead of widening to Node ---
interface Node {
  cloneNode(subtree?: boolean): this
}
