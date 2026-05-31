# wave-desktop secrets

> **No secret of any kind belongs in this repo. None.** This file documents
> where each secret lives so contributors don't have to guess.

## Runtime (per operator install)

The desktop app **never bundles** operator-facing secrets. They are entered by
the operator at runtime and held in OS secure-storage via Electron's
`safeStorage` API:

| Secret | Where it lives | Set how |
|---|---|---|
| Gateway JWT (short-lived, ~1h) | macOS Keychain / Win DPAPI / Linux libsecret | Sign-in flow exchanges device-code → JWT |
| OAuth refresh token | same | Issued at sign-in, refreshed on expiry |
| Audinate per-endpoint license key (optional) | same | Operator pastes from their Audinate License Pool |
| NDI Advanced license key (optional) | same | Operator pastes from their Vizrt account |

Never log, echo, or send these to any external service other than the WAVE
gateway. The renderer cannot read them — preload exposes presence flags only.

## Build / release (CI only — never in source)

| Secret | Where | Purpose |
|---|---|---|
| `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` | GitHub Actions org secret | macOS notarization |
| `CSC_LINK` / `CSC_KEY_PASSWORD` | GitHub Actions org secret | Code-signing certificate |
| `SENTRY_AUTH_TOKEN` | GitHub Actions repo secret | Symbol upload to wave-online-llc Sentry |

## Public-facing config (OK to ship)

| Value | Why public is fine |
|---|---|
| Sentry DSN | DSNs are designed to be public; abuse is rate-limited by Sentry |
| OAuth client ID | Public by OAuth design (must be embedded in the client) |
| Gateway base URL | Production endpoint is `https://api.wave.online` |

## Licensed binaries (NEVER vendored)

DAL, NDI Library, NDI Advanced, Dante Activator: fetched at install time
under the operator's own credentials. Never committed. See `.gitignore`
patterns under `resources/` for the deny-list and `CONTRIBUTING.md` §
"License boundary" for the rule.
