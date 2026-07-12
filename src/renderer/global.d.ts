/// <reference types="vite/client" />

import type {
  GridLayout,
  MultiviewState,
  PinProgramRequest,
  TileSetSourceRequest,
  CrestCommand,
  CrestResult,
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
  crest: {
    control(org: string, device: string, command: CrestCommand): Promise<CrestResult>;
    state(org: string, device: string): Promise<CrestResult>;
  };
  ui: {
    openDeviceControl(): Promise<void>;
  };
}

declare global {
  interface Window {
    wave: WaveBridge;
  }
}
