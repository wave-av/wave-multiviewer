import type { GridLayout, MultiviewState } from '@shared/ipc';

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
    </div>
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
