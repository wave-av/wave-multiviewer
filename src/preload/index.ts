import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type GridLayout,
  type MultiviewState,
  type PinProgramRequest,
  type TileSetSourceRequest,
} from '@shared/ipc';

const wave = {
  multiview: {
    state: (): Promise<MultiviewState> => ipcRenderer.invoke(IPC.multiviewState),
    setLayout: (layout: GridLayout): Promise<MultiviewState> =>
      ipcRenderer.invoke(IPC.layoutSet, layout),
    setTileSource: (req: TileSetSourceRequest): Promise<MultiviewState> =>
      ipcRenderer.invoke(IPC.tileSetSource, req),
    pinProgram: (req: PinProgramRequest): Promise<MultiviewState> =>
      ipcRenderer.invoke(IPC.programPin, req),
    cloudPushStart: (): Promise<MultiviewState> => ipcRenderer.invoke(IPC.cloudPushStart),
    cloudPushStop: (): Promise<MultiviewState> => ipcRenderer.invoke(IPC.cloudPushStop),
  },
} as const;

contextBridge.exposeInMainWorld('wave', wave);
export type WaveBridge = typeof wave;

declare global {
  interface Window {
    wave: WaveBridge;
  }
}
