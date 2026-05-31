# wave-multiviewer threat model

## Scope

Electron app on an operator machine. Aggregates many WAVE / NDI feeds into
one grid; optionally re-emits the composite to a cloud SFU.

## Trust boundaries

| Boundary | Threat | Defense |
|---|---|---|
| Many WAVE feed URLs into renderer | Per-tile XSS via crafted SDP | CSP `connect-src 'self' https://api.wave.online wss://api.wave.online` |
| LAN NDI source names | mDNS spoofing announcing a malicious source as "Camera 1" | wave-agent (sibling daemon) validates discovered sources against a signed list; multiviewer trusts wave-agent's allowlist only |
| renderer → main IPC | one tile compromise → all tiles | Each IPC payload `.parse()`'d via Zod; per-tile state isolated; channel allowlist (6 channels) |
| Cloud-push WebRTC track | exfiltrating tiles the operator didn't intend to publish | Push is opt-in; toggle is in the UI; threat model assumes the operator decides what leaves the LAN |

## Out-of-scope

- Physical access to the operator's machine
- NDI Library vulnerabilities (third-party — track upstream)
- wave-realtime-edge SFU vulnerabilities (separate threat model)
