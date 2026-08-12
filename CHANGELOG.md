# Changelog

All notable changes documented here.

## [Unreleased]

### Changed
- capabilities.json: corrected the wave-realtime-edge consumed endpoint from the
  legacy `/whip` path to the versioned WHIP publish path `/v1/whip/publish`
  (cloud push publishes the multiview; WHEP subscribe goes to api-gateway)

### Added
- Initial scaffold: Electron 34 + electron-vite + React 19 + TS + Tailwind 4
- Grid UI (4×4 / 9×9 / 16×16) with program-pin tiles + cloud-push toggle
- Zod-validated IPC: layout-set / tile-set-source / program-pin / cloud-push
- Foundation chassis: CODEOWNERS, SECRETS.md, foundation-gate, threat-model
