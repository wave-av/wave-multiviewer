# Changelog

All notable changes documented here.

## [Unreleased]

### Changed

- CI: the skill-frontmatter gate now runs on Python 3.14 instead of 3.12
  (`.github/workflows/_checks.yml`). Toolchain bump only — the gate's own
  logic is untouched.

### Fixed

- `pr-agent` lane: fork-triggered `/` commands are now refused, and the AI
  call's budget fits inside its step. Three defects, one of them only visible
  once the first was fixed.

  The job-level `if:` refused forks on the `pull_request` arm and could not on
  `issue_comment` — fork status is absent from that payload, so there was never
  an expression to write. A `fork gate` step now asks the pulls endpoint and
  fails closed: only a literal `false` proceeds, so a 404, a rate limit or a
  deleted fork all skip. The lane runs no `actions/checkout`, so fork code was
  never executed and no exfiltration path existed; what this closes is the
  comment claiming forks were already skipped, which was true of one arm only.

  `CONFIG__AI_TIMEOUT` was 600s inside a 360s step, so the runner killed the
  step before pr-agent could reach its own timeout or fall back to a secondary
  model. Now 300s.

  Fixing the first exposed a third: `stamp attempt 2 end` runs under
  `if: always()`, so when attempt 2 never ran the verdict subtracted from zero
  and reported a 1787580408-second attempt as a confident TIMED OUT.

  Contributors on forks are affected: a maintainer's `/review` on a fork PR is
  now declined with a warning rather than silently running.
  (wave-av/wave-foundation-public#73)

### Added
- Initial scaffold: Electron 34 + electron-vite + React 19 + TS + Tailwind 4
- Grid UI (4×4 / 9×9 / 16×16) with program-pin tiles + cloud-push toggle
- Zod-validated IPC: layout-set / tile-set-source / program-pin / cloud-push
- Foundation chassis: CODEOWNERS, SECRETS.md, foundation-gate, threat-model
