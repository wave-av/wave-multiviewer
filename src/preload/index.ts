import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC,
  type GridLayout,
  type MultiviewState,
  type PinProgramRequest,
  type TileSetSourceRequest,
  CrestResultSchema,
  type CrestCommand,
  type CrestResult,
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
  crest: {
    /** Sends a WAVE Device Control Protocol v1 command through the gateway. */
    control: async (org: string, device: string, command: CrestCommand): Promise<CrestResult> => {
      const raw = await ipcRenderer.invoke(IPC.crestControl, { org, device, command });
      return CrestResultSchema.parse(raw);
    },
    /** Reads current device state (org-scoped state-track subscribe descriptor). */
    state: async (org: string, device: string): Promise<CrestResult> => {
      const raw = await ipcRenderer.invoke(IPC.crestState, { org, device });
      return CrestResultSchema.parse(raw);
    },
  },
} as const;

contextBridge.exposeInMainWorld('wave', wave);
export type WaveBridge = typeof wave;

declare global {
  interface Window {
    wave: WaveBridge;
  }
}
