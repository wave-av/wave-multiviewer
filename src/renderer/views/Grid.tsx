import { useMemo } from 'react';
import type { MultiviewState } from '@shared/ipc';
import { Tile } from './Tile';

interface Props {
  state: MultiviewState;
  onPin: (tileId: string | null) => Promise<void>;
}

/**
 * How many concurrent WebRTC peer connections we're willing to open at once.
 *
 * Chromium can take many more in theory, but each peer connection allocates
 * ICE candidate pools and an audio/video decoder; at 256 tiles the renderer
 * starts dropping frames. 64 is enough for 4x4 (16) and most of 9x9 (81),
 * and gives us a clear visual cue (`enabled=false` placeholder) for the
 * over-capacity rest.
 *
 * Operators can manually disable tiles to free slots, or change layout.
 */
const MAX_CONCURRENT_PEERS = 64;

const GRID_COLS: Record<MultiviewState['layout'], string> = {
  '4x4': 'grid-cols-4',
  '9x9': 'grid-cols-9',
  '16x16': 'grid-cols-16',
};

export function Grid({ state, onPin }: Props): React.JSX.Element {
  // Determine the first N wave-feed tiles that should be enabled; the rest
  // get the over-capacity placeholder. Non-wave-feed tiles (NDI, Dante,
  // empty) don't count against the cap because they don't open a peer.
  const enabledIds = useMemo(() => {
    const result = new Set<string>();
    let count = 0;
    for (const tile of state.tiles) {
      if (tile.source.kind !== 'wave-feed') {
        result.add(tile.id);
        continue;
      }
      if (count < MAX_CONCURRENT_PEERS) {
        result.add(tile.id);
        count++;
      }
    }
    return result;
  }, [state.tiles]);

  const overflow = state.tiles.filter(
    (t) => t.source.kind === 'wave-feed' && !enabledIds.has(t.id),
  ).length;

  return (
    <div className="flex h-full flex-col gap-2">
      {overflow > 0 ? (
        <div
          role="status"
          className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
        >
          {overflow} tile{overflow === 1 ? '' : 's'} disabled — {MAX_CONCURRENT_PEERS} concurrent
          WAVE-feed connection cap reached. Reduce the layout or swap some tiles to NDI/Dante.
        </div>
      ) : null}
      <div className={`grid flex-1 gap-1 ${GRID_COLS[state.layout]}`}>
        {state.tiles.map((tile) => (
          <Tile
            key={tile.id}
            tile={tile}
            pinned={tile.id === state.programTileId}
            enabled={enabledIds.has(tile.id)}
            onClick={() => void onPin(tile.id === state.programTileId ? null : tile.id)}
          />
        ))}
      </div>
    </div>
  );
}
