/**
 * WAVE Device Control Protocol v1 — envelope builder.
 *
 * The envelope shape is FROZEN (gateway `POST /v1/crest/control`):
 *   { v:1, id:<uuid>, org:<orgId>, device:<deviceId>, ts:<epoch_ms>, cmd:<command>, args:{...} }
 *
 * Pulled into its own module (no Electron imports) so it's unit-testable
 * without booting the app. Mirrors wave-desktop's
 * src/main/control-plane/crest-envelope.ts near-verbatim.
 */

import { randomUUID } from 'node:crypto';
import type { CrestCommand } from '@shared/ipc';

export interface CrestEnvelope {
  v: 1;
  id: string;
  org: string;
  device: string;
  ts: number;
  cmd: CrestCommand['cmd'];
  args: CrestCommand['args'];
}

export function buildCrestEnvelope(
  org: string,
  device: string,
  command: CrestCommand,
  now: () => number = Date.now,
): CrestEnvelope {
  return {
    v: 1,
    id: randomUUID(),
    org,
    device,
    ts: now(),
    cmd: command.cmd,
    args: command.args,
  };
}
