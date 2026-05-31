/// <reference types="vite/client" />

import type {
  GridLayout,
  MultiviewState,
  PinProgramRequest,
  TileSetSourceRequest,
} from '@shared/ipc';

interface WaveBridge {
  multiview: {
    state(): Promise<MultiviewState>;
    setLayout(layout: GridLayout): Promise<MultiviewState>;
    setTileSource(req: TileSetSourceRequest): Promise<MultiviewState>;
    pinProgram(req: PinProgramRequest): Promise<MultiviewState>;
    cloudPushStart(): Promise<MultiviewState>;
    cloudPushStop(): Promise<MultiviewState>;
  };
}

declare global {
  interface Window {
    wave: WaveBridge;
  }
}
