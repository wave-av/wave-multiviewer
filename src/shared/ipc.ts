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

export const IPC = {
  multiviewState: 'wave:mv:state',
  layoutSet: 'wave:mv:layout-set',
  tileSetSource: 'wave:mv:tile-set-source',
  programPin: 'wave:mv:program-pin',
  cloudPushStart: 'wave:mv:cloud-push-start',
  cloudPushStop: 'wave:mv:cloud-push-stop',
} as const;
export type IpcChannel = (typeof IPC)[keyof typeof IPC];

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
