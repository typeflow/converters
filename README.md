# @typeflowjs/converters

Converts mapping files written in other JSON mapping languages into
Typeflow's own `.typeflow` syntax, so an existing codebase can move onto
Typeflow without hand-rewriting every mapping by hand. Implemented natively
in Rust and exposed as a Node.js addon (`.node`, via napi-rs) behind a typed
TypeScript wrapper; covered by `cargo test` unit tests on the Rust
conversion logic itself (parser → emit → formatter, per source language,
plus the parallel batch entry points).

## API

```ts
import {
  convertJq,
  convertJqBatch,
  convertJsonata,
  convertJsonataBatch,
  formatTypeflow,
  typeFromSample,
} from '@typeflowjs/converters';

convertJq('{ id: .id, name: .user.name }');
// → { ok, typeflow, notes, errors }

// The batch entry points convert many sources in one native call, in
// parallel across CPU cores (Rust/rayon) — use these for multi-file work
// instead of looping over a single-source conversion function one file at
// a time.
convertJqBatch(['{ a: .x }', '{ b: .y }']);
// → ConvertResult[]
```

## Build

Requires Bun and a Rust toolchain (edition 2021).

```sh
bun run build   # napi build --platform --release (host target only),
                # then Bun.build bundles index.ts → dist/ (ESM + CJS)
cargo test      # Rust unit tests: conversion logic, formatter, sample
                # types, batch entry points — no build step needed first
```

Published npm releases cover more than the host platform:
`.github/workflows/release.yml` cross-builds a matrix of targets
(win32-x64, darwin-x64, darwin-arm64, linux-x64-gnu today — see
`napi.triples.additional` in `package.json`) via `@napi-rs/cli`, and ships
each as its own `optionalDependencies` package (e.g.
`@typeflowjs/converters-win32-x64-msvc`) so `npm install` only pulls the one
matching the consumer's platform. `index.ts`'s loader tries that platform
package first, falling back to a local `.node` file for the `bun run build`
dev loop above.

## Layout

| Path               | Role                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| `index.ts`         | Typed wrapper: loads the addon, adapts the TS option shape                             |
| `scripts/build.ts` | Bun build script (cargo + `Bun.build` ESM/CJS)                                         |
| `src/tf/`          | Rust: Typeflow lexer, parser, AST, canonical formatter                                 |
| `src/jq/`          | Rust: parser, input-type inference, and emission for one supported source language     |
| `src/jsonata/`     | Rust: parser, input-type inference, and emission for another supported source language |
| `src/sample.rs`    | Rust: `typeFromSample` (JSON sample → inline type)                                     |
| `src/util.rs`      | Rust: JS-compatible number formatting, JSON quoting                                    |

Parity notes: number formatting reproduces ECMAScript `String(number)`
(shortest round-trip plus ECMA-262 exponent layout), string quoting matches
`JSON.stringify`, inline-width decisions in the formatter measure UTF-16
lengths like JS `String.length`, and object-key iteration preserves insertion
order (serde_json `preserve_order`).
