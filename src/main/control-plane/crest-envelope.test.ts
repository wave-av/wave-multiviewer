import { describe, expect, it } from 'vitest';
import { buildCrestEnvelope } from './crest-envelope';

describe('buildCrestEnvelope', () => {
  it('builds a v1 envelope with the frozen shape', () => {
    const env = buildCrestEnvelope(
      'org_123',
      'device_abc',
      { cmd: 'stream.start', args: { transport: 'moq' } },
      () => 1700000000000,
    );
    expect(env).toEqual({
      v: 1,
      id: expect.any(String),
      org: 'org_123',
      device: 'device_abc',
      ts: 1700000000000,
      cmd: 'stream.start',
      args: { transport: 'moq' },
    });
  });

  it('generates a distinct uuid per call', () => {
    const a = buildCrestEnvelope('o', 'd', { cmd: 'stream.stop', args: {} });
    const b = buildCrestEnvelope('o', 'd', { cmd: 'stream.stop', args: {} });
    expect(a.id).not.toBe(b.id);
  });

  it('carries settings.set args through unchanged', () => {
    const env = buildCrestEnvelope('o', 'd', {
      cmd: 'settings.set',
      args: { codec: 'h265', bitrate: 8000, fps: 60 },
    });
    expect(env.args).toEqual({ codec: 'h265', bitrate: 8000, fps: 60 });
  });
});
