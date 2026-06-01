# Contributing to wave-desktop

Thanks for your interest. Read this in full before opening a PR.

## License

Source is **MIT** (see `LICENSE`). By contributing you agree your contributions
are also MIT-licensed.

## License boundary — IMPORTANT

This repository ships **no vendor-licensed binaries**. The following are
deny-listed in `.gitignore` and **must never be committed**:

- `libdal.*` / Audinate Dante Application Library binaries
- `libndi.*` / `NDI Library` binaries (any version)
- `NDI Advanced` SDK headers or binaries
- `dante_activator` binary
- Any signed installer or pre-built artifact containing the above

These binaries are fetched **at install time on each operator's machine**
using their own license credentials, exactly like wave-bridge-edge fetches
the DEP container at build time.

If you accidentally `git add` one, our PR-side secret-scan + binary-pattern
gate will refuse to merge. Run `git reset HEAD <path>` and add the path to
`.gitignore`.

## Dev setup

```sh
npm install
npm run dev          # opens an Electron window in dev mode (Vite HMR)
npm run type-check   # tsc --noEmit across renderer + main
npm test             # vitest
npm run dist:mac     # build a signed .dmg (needs CI secrets)
```

## Architecture rules

1. **Renderer = untrusted side.** No Node, no Electron APIs. All OS / network /
   codec work happens in main and is invoked through `src/shared/ipc.ts`.
2. **Zod-validate every IPC payload at the main handler boundary.** A
   compromised renderer must not be able to push malformed data into main.
3. **Secrets via `safeStorage` only.** No `.env` files for operator-facing
   credentials. The renderer can only see presence flags, never raw tokens.
4. **One responsibility per file.** Target 200–500 lines per file; split
   before 800.
5. **Touch-first UI.** Minimum 44pt tap targets (`min-h-11` in Tailwind);
   every interaction has a touch path. See [WAVE UI Touch-First Standard][wts].

## PR shape

- Branch off `master`. Name: `feat/<short-thing>` or `fix/<short-thing>`.
- One concern per PR. Don't bundle a refactor and a feature.
- Update `CHANGELOG.md` under the unreleased heading.
- Self-test: `npm run type-check && npm test && npm run build` must pass.
- CodeRabbit + the foundation gate review automatically. Resolve every
  comment before requesting human review.

## Reporting security issues

Open a private GitHub Security Advisory at
<https://github.com/wave-av/wave-desktop/security/advisories/new>. Do NOT
open a public issue.

[wts]: https://github.com/wave-av/wave-foundation/blob/master/frameworks/copywriting/TOUCH_FIRST.md
