import { useEffect, useRef, useState } from 'react';
import type { Tile as TileModel } from '@shared/ipc';
import { connectFeed, type FeedConnection } from '../lib/webrtc';
import { feedUrlFor } from '../lib/feed-url';

interface Props {
  tile: TileModel;
  pinned: boolean;
  /** When false, the tile holds its placeholder and never opens a connection.
   * Used to enforce the concurrent-stream cap from the parent. */
  enabled: boolean;
  onClick: () => void;
}

/**
 * Single tile. Owns its own RTCPeerConnection lifecycle:
 *
 *   mount with enabled+wave-feed source → open connection → attach to <video>
 *   source changes / enabled=false / unmount → close, stop tracks
 *
 * The tile is intentionally small — most of the bytes are the cleanup chain
 * (and the comments justifying it). Each tile is one mounted React component,
 * so React's render scheduling already does the throttling we need.
 */
export function Tile({ tile, pinned, enabled, onClick }: Props): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const connRef = useRef<FeedConnection | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');

  // (Re)open the connection whenever the source or enabled flag changes.
  useEffect(() => {
    let cancelled = false;
    let conn: FeedConnection | null = null;

    const teardown = (): void => {
      cancelled = true;
      conn?.close();
      conn = null;
      connRef.current = null;
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };

    if (!enabled || tile.source.kind !== 'wave-feed') {
      setStatus('idle');
      teardown();
      return teardown;
    }

    setStatus('connecting');
    void (async (): Promise<void> => {
      try {
        const url = feedUrlFor(tile.source.kind === 'wave-feed' ? tile.source.feedSlug : '');
        conn = await connectFeed({ feedUrl: url });
        if (cancelled) {
          conn.close();
          return;
        }
        connRef.current = conn;
        const video = videoRef.current;
        if (video) {
          video.srcObject = conn.stream;
          // Multiviewer tiles are muted by default — only the pinned program
          // tile plays audio (a 16x16 wall of competing audio is misery).
          video.muted = true;
          try {
            await video.play();
          } catch {
            /* autoplay blocked on dev; ignore — video is still attached */
          }
        }
        setStatus('live');
      } catch (err) {
        if (!cancelled) setStatus('error');
        conn?.close();
      }
    })();

    return teardown;
  }, [tile.source, enabled]);

  // Toggle audio on the pinned tile so the program tile is the only one
  // making noise. Cheap — runs only when `pinned` flips.
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = !pinned;
  }, [pinned]);

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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300 mix-blend-screen">
        {tile.label}
      </div>
      {tile.source.kind === 'wave-feed' ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls={false}
            className={`absolute inset-0 h-full w-full object-cover ${status === 'live' ? '' : 'opacity-0'}`}
          />
          {status !== 'live' ? (
            <div className="grid h-full place-items-center text-[10px] text-zinc-600">
              {status === 'connecting' ? '…' : status === 'error' ? 'offline' : tile.source.feedSlug}
            </div>
          ) : null}
        </>
      ) : tile.source.kind === 'ndi' ? (
        <div className="grid h-full place-items-center text-[10px] text-zinc-600">
          NDI: {tile.source.sourceName}
        </div>
      ) : tile.source.kind === 'dante-audio-only' ? (
        <div className="grid h-full place-items-center text-[10px] text-zinc-600">
          Dante: {tile.source.channelId}
        </div>
      ) : (
        <div className="grid h-full place-items-center text-[10px] text-zinc-700">empty</div>
      )}
      {pinned ? (
        <span className="absolute right-1 top-1 z-10 rounded bg-[var(--wave-accent)] px-1 text-[8px] font-bold uppercase text-zinc-950">
          PGM
        </span>
      ) : null}
    </button>
  );
}
