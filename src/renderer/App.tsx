import { useEffect, useState } from 'react';
import type { GridLayout, MultiviewState } from '@shared/ipc';
import { Grid } from './views/Grid';
import { Controls } from './views/Controls';

export function App(): React.JSX.Element {
  const [state, setState] = useState<MultiviewState | null>(null);

  useEffect(() => {
    void window.wave.multiview.state().then(setState);
  }, []);

  const setLayout = async (layout: GridLayout): Promise<void> => {
    const next = await window.wave.multiview.setLayout(layout);
    setState(next);
  };

  const pinProgram = async (tileId: string | null): Promise<void> => {
    const next = await window.wave.multiview.pinProgram({ tileId });
    setState(next);
  };

  const toggleCloudPush = async (): Promise<void> => {
    if (!state) return;
    const next = state.cloudPushActive
      ? await window.wave.multiview.cloudPushStop()
      : await window.wave.multiview.cloudPushStart();
    setState(next);
  };

  return (
    <div className="flex h-screen flex-col">
      <header
        className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-2"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-sm font-semibold tracking-wide">
          <b className="wm">WAVE</b> Multiviewer
        </span>
        <span className="text-xs text-zinc-500">
          {state ? `${state.layout} · ${state.tiles.length} tiles` : 'loading'}
        </span>
      </header>
      <div className="grid flex-1 grid-cols-[1fr_240px] overflow-hidden">
        <main className="overflow-auto bg-black p-2">
          {state ? <Grid state={state} onPin={pinProgram} /> : null}
        </main>
        <aside className="overflow-auto border-l border-zinc-800 bg-zinc-950 p-4">
          {state ? (
            <Controls
              state={state}
              onLayoutChange={setLayout}
              onToggleCloudPush={toggleCloudPush}
              onClearProgram={() => pinProgram(null)}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
