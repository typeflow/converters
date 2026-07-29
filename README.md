# @typeflowjs/converters

Converts mapping files written in other JSON mapping languages into Typeflow's own `.typeflow` syntax, so an existing
codebase can move onto Typeflow without hand-rewriting every mapping by hand. Implemented natively in Rust and exposed
as a Node.js addon (`.node`, via napi-rs) behind a typed TypeScript wrapper; covered by `cargo test` unit tests on the
Rust conversion logic itself (parser → emit → formatter, per source language, plus the parallel batch entry points).

## Install

```sh
npm install @typeflowjs/converters
```

`npm install` pulls in only the prebuilt native binary matching the current platform (see [Build](#build)) — no Rust
toolchain required to consume the package.

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

convertJsonata('a.b');
// → { ok, typeflow, notes, errors }

formatTypeflow('map{x:1}');
// → { ok, formatted: "map {\n  x: 1,\n}\n" }

typeFromSample({ id: 1, tags: ['a'] });
// → "{ id: number, tags: string[] }"
```

`ConvertOptions` (second argument to `convertJq`/`convertJsonata` and their batch variants) controls how the generated
`input` declaration is produced:

```ts
convertJq('.user.name', { input: 'none' }); // omit the input declaration
convertJq('.user.name', { input: { sample: { user: { name: 'a' } } } }); // derive it from a sample
convertJq('.user.name', { inputName: 'payload' }); // name the binding (default: "data")
```
