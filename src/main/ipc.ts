import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import {
  IPC,
  GridLayoutSchema,
  type MultiviewState,
  PinProgramRequestSchema,
  TileSetSourceRequestSchema,
  tilesPerLayout,
  type Tile,
  CrestControlRequestSchema,
  CrestStateRequestSchema,
  type CrestResult,
} from '@shared/ipc';
import { buildCrestEnvelope } from './control-plane/crest-envelope';

const GATEWAY_BASE = 'https://api.wave.online';

/**
 * Bearer key for gateway crest calls. This app has no OAuth session (unlike
 * wave-desktop) — the operator supplies a WAVE gateway API key via env var.
 * Absent that, crest calls fail closed with 401 rather than faking success.
 */
function crestToken(): string | null {
  return process.env.WAVE_GATEWAY_KEY ?? null;
}

let state: MultiviewState = newState('4x4');

function newState(layout: '4x4' | '9x9' | '16x16'): MultiviewState {
  const count = tilesPerLayout(layout);
  const tiles: Tile[] = Array.from({ length: count }, (_v, i) => ({
    id: `tile-${i}`,
    label: `Tile ${i + 1}`,
    source: { kind: 'empty' as const },
  }));
  return { layout, tiles, programTileId: null, cloudPushActive: false };
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.multiviewState, (): MultiviewState => state);

  ipcMain.handle(IPC.layoutSet, (_e: IpcMainInvokeEvent, raw: unknown): MultiviewState => {
    const layout = GridLayoutSchema.parse(raw);
    state = newState(layout);
    return state;
  });

  ipcMain.handle(IPC.tileSetSource, (_e: IpcMainInvokeEvent, raw: unknown): MultiviewState => {
    const req = TileSetSourceRequestSchema.parse(raw);
    state = {
      ...state,
      tiles: state.tiles.map((t) =>
        t.id === req.tileId ? { ...t, source: req.source, label: req.label ?? t.label } : t,
      ),
    };
    return state;
  });

  ipcMain.handle(IPC.programPin, (_e: IpcMainInvokeEvent, raw: unknown): MultiviewState => {
    const req = PinProgramRequestSchema.parse(raw);
    state = { ...state, programTileId: req.tileId };
    return state;
  });

  ipcMain.handle(IPC.cloudPushStart, (): MultiviewState => {
    // Wave-2: open WebRTC peer connection against wave-realtime-edge,
    // attach the compositor canvas as a track. Today: just flag it.
    state = { ...state, cloudPushActive: true };
    return state;
  });

  ipcMain.handle(IPC.cloudPushStop, (): MultiviewState => {
    state = { ...state, cloudPushActive: false };
    return state;
  });

  // ── device control (E-CONTROL) ──────────────────────────────────────────
  // Non-2xx (503 not-armed / 403 / 400) is returned as a structured
  // `ok:false` result, never thrown as a generic error, so the UI can
  // surface the real gateway outcome honestly.
  ipcMain.handle(
    IPC.crestControl,
    async (_e: IpcMainInvokeEvent, raw: unknown): Promise<CrestResult> => {
      const req = CrestControlRequestSchema.parse(raw);
      const token = crestToken();
      if (!token) {
        return {
          ok: false,
          status: 401,
          body: null,
          message: 'no WAVE_GATEWAY_KEY configured — set it to arm device control',
        };
      }
      const envelope = buildCrestEnvelope(req.org, req.device, req.command);
      return postCrestControl(token, envelope);
    },
  );

  ipcMain.handle(
    IPC.crestState,
    async (_e: IpcMainInvokeEvent, raw: unknown): Promise<CrestResult> => {
      const req = CrestStateRequestSchema.parse(raw);
      const token = crestToken();
      if (!token) {
        return {
          ok: false,
          status: 401,
          body: null,
          message: 'no WAVE_GATEWAY_KEY configured — set it to arm device control',
        };
      }
      return getCrestState(token, req.org, req.device);
    },
  );
}

async function postCrestControl(
  token: string,
  envelope: ReturnType<typeof buildCrestEnvelope>,
): Promise<CrestResult> {
  try {
    const res = await fetch(`${GATEWAY_BASE}/v1/crest/control`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    });
    const body = await safeJson(res);
    if (res.ok) return { ok: true, status: res.status, body };
    return { ok: false, status: res.status, body, message: messageFor(res.status, body) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: null,
      message: err instanceof Error ? err.message : 'network error contacting gateway',
    };
  }
}

async function getCrestState(token: string, org: string, device: string): Promise<CrestResult> {
  try {
    const url = new URL(`${GATEWAY_BASE}/v1/crest/state`);
    url.searchParams.set('device', device);
    url.searchParams.set('org', org);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await safeJson(res);
    if (res.ok) return { ok: true, status: res.status, body };
    return { ok: false, status: res.status, body, message: messageFor(res.status, body) };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: null,
      message: err instanceof Error ? err.message : 'network error contacting gateway',
    };
  }
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function messageFor(status: number, body: unknown): string {
  const detail =
    body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
      ? (body as { error: string }).error
      : null;
  if (status === 503) return detail ?? 'control bridge not armed';
  if (status === 403) return detail ?? 'forbidden — cross-org device';
  if (status === 400) return detail ?? 'malformed request';
  return detail ?? `gateway returned ${status}`;
}
