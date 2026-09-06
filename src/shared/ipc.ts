/**
 * Cross-process IPC contract for wave-multiviewer.
 *
 * Models a grid of tiles where each tile binds to a WAVE feed, a LAN NDI
 * source, or a Dante-audio-only meter. Click a tile to pin it as program
 * (out of the renderer); optional WebRTC push of the program tile (or the
 * full multiview frame) to wave-realtime-edge for cloud directors.
 */

import { z } from 'zod';

export const GridLayoutSchema = z.enum(['4x4', '9x9', '16x16']);
export type GridLayout = z.infer<typeof GridLayoutSchema>;

export const TileSourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('wave-feed'), feedSlug: z.string().min(1) }),
  z.object({ kind: z.literal('ndi'), sourceName: z.string().min(1) }),
  z.object({ kind: z.literal('dante-audio-only'), channelId: z.string().min(1) }),
  z.object({ kind: z.literal('empty') }),
]);
export type TileSource = z.infer<typeof TileSourceSchema>;

export const TileSchema = z.object({
  id: z.string(),
  label: z.string().max(40),
  source: TileSourceSchema,
});
export type Tile = z.infer<typeof TileSchema>;

export const MultiviewStateSchema = z.object({
  layout: GridLayoutSchema,
  tiles: z.array(TileSchema),
  programTileId: z.string().nullable(),
  cloudPushActive: z.boolean(),
});
export type MultiviewState = z.infer<typeof MultiviewStateSchema>;

export const TileSetSourceRequestSchema = z.object({
  tileId: z.string(),
  source: TileSourceSchema,
  label: z.string().max(40).optional(),
});
export type TileSetSourceRequest = z.infer<typeof TileSetSourceRequestSchema>;

export const PinProgramRequestSchema = z.object({
  tileId: z.string().nullable(),
});
export type PinProgramRequest = z.infer<typeof PinProgramRequestSchema>;

// ── device control (E-CONTROL — WAVE Device Control Protocol v1) ────────────
// Envelope + commands are FROZEN (see gateway `/v1/crest/control`). The
// renderer never talks to the gateway directly — main holds the bearer
// token (from WAVE_GATEWAY_KEY) and forwards. Outcomes (incl. 503 "not
// armed" / 403 / 400) are surfaced verbatim to the renderer; we never
// synthesize success.

export const CrestCommandSchema = z.discriminatedUnion('cmd', [
  z.object({
    cmd: z.literal('stream.start'),
    args: z.object({
      transport: z.enum(['moq', '2110']).optional(),
      destination: z.string().optional(),
    }),
  }),
  z.object({ cmd: z.literal('stream.stop'), args: z.object({}) }),
  z.object({ cmd: z.literal('captions.on'), args: z.object({}) }),
  z.object({ cmd: z.literal('captions.off'), args: z.object({}) }),
  z.object({
    cmd: z.literal('settings.set'),
    args: z.object({
      codec: z.enum(['h264', 'h265']).optional(),
      bitrate: z.number().int().positive().optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      fps: z.number().int().min(1).max(240).optional(),
      transport: z.enum(['moq', '2110']).optional(),
      destination: z.string().optional(),
    }),
  }),
  z.object({ cmd: z.literal('settings.get'), args: z.object({}) }),
  z.object({ cmd: z.literal('state.get'), args: z.object({}) }),
]);
export type CrestCommand = z.infer<typeof CrestCommandSchema>;

export const CrestControlRequestSchema = z.object({
  org: z.string().min(1),
  device: z.string().min(1),
  command: CrestCommandSchema,
});
export type CrestControlRequest = z.infer<typeof CrestControlRequestSchema>;

/**
 * Outcome of a control POST / state GET. We never collapse a non-2xx into a
 * thrown error the renderer has to string-match — `ok: false` carries the
 * real HTTP status + gateway body so the UI can show e.g. "503 control
 * bridge not armed" honestly instead of a generic failure toast.
 */
export const CrestResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), status: z.number().int(), body: z.unknown() }),
  z.object({ ok: z.literal(false), status: z.number().int(), body: z.unknown(), message: z.string() }),
]);
export type CrestResult = z.infer<typeof CrestResultSchema>;

export const CrestStateRequestSchema = z.object({
  org: z.string().min(1),
  device: z.string().min(1),
});
export type CrestStateRequest = z.infer<typeof CrestStateRequestSchema>;

export const IPC = {
  multiviewState: 'wave:mv:state',
  layoutSet: 'wave:mv:layout-set',
  tileSetSource: 'wave:mv:tile-set-source',
  programPin: 'wave:mv:program-pin',
  cloudPushStart: 'wave:mv:cloud-push-start',
  cloudPushStop: 'wave:mv:cloud-push-stop',
  crestControl: 'wave:crest:control',
  crestState: 'wave:crest:state',
  uiOpenDeviceControl: 'wave:ui:open-device-control',
} as const;
export type IpcChannel = (typeof IPC)[keyof typeof IPC];

// ── deep links (E-CONTROL #78b) ─────────────────────────────────────────────
// Single source of truth for the web-always Mesh device-control surface.
// Main opens this via shell.openExternal — it is a hardcoded constant, never
// renderer-supplied input, so there is no arbitrary-URL openExternal risk.
export const DEVICE_CONTROL_URL = 'https://console.wave.online/control/devices';

/** Tile-count per layout — single source of truth for renderer + main. */
export function tilesPerLayout(layout: GridLayout): number {
  switch (layout) {
    case '4x4':
      return 16;
    case '9x9':
      return 81;
    case '16x16':
      return 256;
  }
}
