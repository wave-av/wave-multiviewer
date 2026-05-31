import type { MultiviewState, Tile } from '@shared/ipc';

interface Props {
  state: MultiviewState;
  onPin: (tileId: string | null) => Promise<void>;
}

const GRID_COLS: Record<MultiviewState['layout'], string> = {
  '4x4': 'grid-cols-4',
  '9x9': 'grid-cols-9',
  '16x16': 'grid-cols-16',
};

export function Grid({ state, onPin }: Props): React.JSX.Element {
  return (
    <div className={`grid h-full gap-1 ${GRID_COLS[state.layout]}`}>
      {state.tiles.map((tile) => (
        <Cell
          key={tile.id}
          tile={tile}
          pinned={tile.id === state.programTileId}
          onClick={() => void onPin(tile.id === state.programTileId ? null : tile.id)}
        />
      ))}
    </div>
  );
}

function Cell({
  tile,
  pinned,
  onClick,
}: {
  tile: Tile;
  pinned: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-video w-full overflow-hidden rounded border bg-zinc-900 text-left transition-colors ${
        pinned ? 'border-[var(--wave-accent)]' : 'border-zinc-800 hover:border-zinc-600'
      }`}
      aria-pressed={pinned}
      aria-label={tile.label}
    >
      <div className="absolute inset-x-0 top-0 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
        {tile.label}
      </div>
      {tile.source.kind === 'empty' ? (
        <div className="grid h-full place-items-center text-[10px] text-zinc-700">empty</div>
      ) : (
        <div className="grid h-full place-items-center text-[10px] text-zinc-500">
          {tile.source.kind}
        </div>
      )}
      {pinned ? (
        <span className="absolute right-1 top-1 rounded bg-[var(--wave-accent)] px-1 text-[8px] font-bold uppercase text-zinc-950">
          PGM
        </span>
      ) : null}
    </button>
  );
}
