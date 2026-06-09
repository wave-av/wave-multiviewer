# wave-multiviewer

**On-prem multiview receiver** for WAVE feeds + LAN NDI sources + Dante audio. 4×4, 9×9, or 16×16 grid. Click a tile to pin it as program. Optional: push the multiview output to wave-realtime-edge as a WebRTC track so cloud directors can watch the grid remotely.

Layer 0 of the [WAVE Protocol Plane][plane]. Replaces TVU MV-series / Newtek MV / Blackmagic MultiView-class hardware boxes with software running on any operator machine.

## What it does

| Surface | Today | Wave |
|---|---|---|
| 4×4 / 9×9 / 16×16 grid | Layout switcher + program-pin clickable tiles | W1 (shipped) |
| WAVE feed tiles | Source binding through Zod-validated IPC | W2 wires the real WebRTC peer connections |
| LAN NDI tiles | Source schema | W2 wires libndi via wave-agent on the same machine |
| Dante audio-only meters | Schema + UI placeholder | W3 wires AES67 fallback for Dante audio |
| Cloud push of multiview | Toggle in UI | W4 wires WebRTC track to wave-realtime-edge |

## Stack

Same as wave-desktop and wave-monitor: Electron 34 + electron-vite + React 19 + TS 5.7 + Tailwind 4 + Zustand + Zod.

## License posture (MIT)

- Zero vendor-licensed binaries in source
- NDI Library / DAL fetched at install time per operator credentials (same pattern as wave-bridge-edge)
- Foundation-gate vendor-binary deny-list enforces it

## Foundation chassis

- CODEOWNERS @wave-av/streaming-team
- `.foundation-version` pinned to wave-foundation@`fd0e188`
- `foundation-gate.yml` + `_checks.yml` inline (public-repo path)
- `SECRETS.md`, `CONTRIBUTING.md`, `threat-model.md`

## Verified locally

- `npm install`
- `npm run type-check` — 0 errors
- `npm run build` — main + preload + renderer all compile

## Roadmap

| Wave | Surface | Status |
|---|---|---|
| W1 | This scaffold (Electron shell + IPC + grid UI placeholder) | shipped |
| W2 | Real WebRTC feed binding per tile via @wave-av/sdk | next |
| W3 | Dante audio meters via AES67 fallback | pending |
| W4 | Multiview composite → WebRTC push to wave-realtime-edge | pending |

[plane]: https://github.com/wave-av/wave-foundation/blob/master/frameworks/protocol-plane/README.md

---

<!-- wave-standard-footer -->
<sub><b><a href="https://wave.online">wave.online</a></b> &nbsp;·&nbsp; <a href="https://docs.wave.online">Docs</a> &nbsp;·&nbsp; <a href="https://dev.wave.online">Developers</a> &nbsp;·&nbsp; <a href="https://agents.wave.online">For agents</a></sub>
