import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import {
  IPC,
  GridLayoutSchema,
  type MultiviewState,
  PinProgramRequestSchema,
  TileSetSourceRequestSchema,
  tilesPerLayout,
  type Tile,
} from '@shared/ipc';

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
}
