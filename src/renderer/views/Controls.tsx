import { useState } from 'react';
import type { GridLayout, MultiviewState, CrestResult } from '@shared/ipc';

interface Props {
  state: MultiviewState;
  onLayoutChange: (layout: GridLayout) => Promise<void>;
  onToggleCloudPush: () => Promise<void>;
  onClearProgram: () => Promise<void>;
}

const LAYOUTS: ReadonlyArray<GridLayout> = ['4x4', '9x9', '16x16'];

export function Controls({
  state,
  onLayoutChange,
  onToggleCloudPush,
  onClearProgram,
}: Props): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Section label="Layout">
        <div className="grid grid-cols-3 gap-1">
          {LAYOUTS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => void onLayoutChange(l)}
              className={`min-h-11 rounded border text-xs ${
                state.layout === l
                  ? 'border-[var(--wave-accent)] bg-[var(--wave-accent)] text-zinc-950'
                  : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Program">
        <div className="text-xs text-zinc-400">
          {state.programTileId
            ? state.tiles.find((t) => t.id === state.programTileId)?.label ?? '—'
            : 'none pinned'}
        </div>
        <button
          type="button"
          onClick={() => void onClearProgram()}
          disabled={state.programTileId === null}
          className="min-h-11 w-full rounded border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Clear program
        </button>
      </Section>

      <Section label="Cloud push">
        <button
          type="button"
          onClick={() => void onToggleCloudPush()}
          className={`min-h-11 w-full rounded text-sm font-medium ${
            state.cloudPushActive
              ? 'border border-red-500 bg-red-500/10 text-red-400'
              : 'bg-[var(--wave-accent)] text-zinc-950'
          }`}
        >
          {state.cloudPushActive ? 'Stop cloud push' : 'Push multiview to cloud'}
        </button>
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Sends the compositor canvas to wave-realtime-edge as a WebRTC track so cloud directors
          can watch this multiview remotely. (Wave 2 wires the real push.)
        </p>
      </Section>

      <CrestSection />
    </div>
  );
}

/**
 * Device control for the pinned-program source (WAVE Device Control
 * Protocol v1). Honest about failure: a 503 means the control bridge isn't
 * armed for this device, 403 means cross-org, 400 means malformed — we show
 * the real gateway outcome instead of a generic toast.
 */
function CrestSection(): React.JSX.Element {
  const [org, setOrg] = useState('');
  const [device, setDevice] = useState('');
  const [result, setResult] = useState<CrestResult | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (
    command: Parameters<typeof window.wave.crest.control>[2],
  ): Promise<void> => {
    if (!org || !device) {
      setResult({ ok: false, status: 0, body: null, message: 'org + device required' });
      return;
    }
    setBusy(true);
    try {
      const res = await window.wave.crest.control(org, device, command);
      setResult(res);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section label="Device control">
      <input
        type="text"
        placeholder="org"
        value={org}
        onChange={(e) => setOrg(e.target.value)}
        className="min-h-11 w-full rounded border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
      />
      <input
        type="text"
        placeholder="device"
        value={device}
        onChange={(e) => setDevice(e.target.value)}
        className="min-h-11 w-full rounded border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
      />
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => void send({ cmd: 'stream.start', args: {} })}
          className="min-h-11 rounded border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Start
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void send({ cmd: 'stream.stop', args: {} })}
          className="min-h-11 rounded border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Stop
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void send({ cmd: 'captions.on', args: {} })}
          className="min-h-11 rounded border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Captions on
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void send({ cmd: 'captions.off', args: {} })}
          className="min-h-11 rounded border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Captions off
        </button>
      </div>
      {result ? (
        <p
          className={`text-[10px] leading-relaxed ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {result.ok ? `ok (${result.status})` : `${result.status}: ${result.message}`}
        </p>
      ) : null}
    </Section>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
