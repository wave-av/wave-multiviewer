import { describe, expect, it, vi } from 'vitest';
import { DEVICE_CONTROL_URL, IPC } from '@shared/ipc';

const handlers = new Map<string, (...args: unknown[]) => unknown>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers.set(channel, fn);
    },
  },
  shell: {
    openExternal: vi.fn(),
  },
}));

describe('uiOpenDeviceControl handler', () => {
  it('opens the hardcoded device-control URL via shell.openExternal', async () => {
    const { registerIpcHandlers } = await import('./ipc');
    const { shell } = await import('electron');
    registerIpcHandlers();

    const handler = handlers.get(IPC.uiOpenDeviceControl);
    expect(handler).toBeDefined();

    handler?.();

    expect(shell.openExternal).toHaveBeenCalledTimes(1);
    expect(shell.openExternal).toHaveBeenCalledWith(DEVICE_CONTROL_URL);
    expect(DEVICE_CONTROL_URL).toBe('https://app.wave.online/control/devices');
  });
});
