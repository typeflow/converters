# Contributing

## Prerequisites

- [Bun](https://bun.sh)
- A Rust toolchain (edition 2021), with the `rustfmt` component

```sh
bun install --frozen-lockfile
```

## Workflow

```sh
cargo fmt --check   # required by CI — run `cargo fmt` first if this fails
cargo test          # Rust unit tests: parser/emit/formatter per source
                     # language, sample types, batch entry points
bun run build       # builds the native addon for your host platform and
                     # bundles index.ts → dist/ (ESM + CJS); needed to
                     # exercise index.ts's loader or dist/ output directly
```

`cargo test` runs against the Rust source directly — no build step needed first. CI (`.github/workflows/ci.yml`) runs
`cargo fmt --check` and
`cargo test` on every push to `main` and every pull request; both must pass.

## Project layout

| Path               | Role                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| `index.ts`         | Typed wrapper: loads the addon, adapts the TS option shape                             |
| `scripts/build.ts` | Bun build script (cargo + `Bun.build` ESM/CJS)                                         |
| `src/tf/`          | Rust: Typeflow lexer, parser, AST, canonical formatter                                 |
| `src/jq/`          | Rust: parser, input-type inference, and emission for one supported source language     |
| `src/jsonata/`     | Rust: parser, input-type inference, and emission for another supported source language |
| `src/sample.rs`    | Rust: `typeFromSample` (JSON sample → inline type)                                     |
| `src/util.rs`      | Rust: JS-compatible number formatting, JSON quoting                                    |

A few pointers for common changes:

- **Fixing/extending an existing source language** (`src/jq/`,
  `src/jsonata/`): each has its own `parser.rs` (source → its own AST),
  `infer.rs` (input-type inference), and `emit.rs` (AST → Typeflow AST). Add unit tests alongside the code you change,
  not just at the `lib.rs`
  entry-point level.
- **Adding a new source language**: mirror the shape of `src/jq/` or
  `src/jsonata/` (parser → infer → emit), then wire `convert_<lang>` and
  `convert_<lang>_batch` entry points into `src/lib.rs` following the existing `convert_jq`/`convert_jq_batch` pattern,
  and export a matching pair from `index.ts`.
- **Typeflow syntax/formatting itself** (`src/tf/`): changes here affect every source language's output, since all of
  them emit into the same
  `tf` AST and go through the same canonical formatter.
- **Output parity with the TypeScript `typeflow` package**: number formatting, string quoting, inline-width measurement,
  and key ordering all intentionally match JS semantics — don't "fix" these to be more idiomatic Rust without checking
  they still round-trip identically.

## Commit style

This repo uses [Conventional Commits](https://www.conventionalcommits.org/), lowercase, imperative mood:
`feat(jq): ...`, `fix(tf): ...`, `ci: ...`,
`docs: ...`, `chore: ...`. Look at `git log` for examples before opening a PR.

## Pull requests

- Keep PRs scoped to one change; avoid bundling unrelated cleanups.
- Add or update tests for any behavior change — this codebase is differentially tested against the TypeScript
  implementation it replaced, so silent output changes are easy to miss without a test.
- Don't hand-edit generated/versioned files (`package.json` version,
  `Cargo.toml` version, the `npm/*/` platform packages) — those are maintained by `.github/workflows/release.yml`.

## Releasing

Releases are handled by maintainers via the `Release converters` GitHub Actions workflow (`workflow_dispatch`, choose a
version bump). It bumps the version, cross-builds native binaries for every supported target, and publishes both the
platform packages and the main package to npm. Contributors don't need to run `npm publish` locally.
