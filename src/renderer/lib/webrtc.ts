/**
 * Per-tile WebRTC viewer. Same WHEP shape as wave-monitor — copied verbatim
 * so future maintenance can promote this into a shared @wave-av/webrtc-viewer
 * package once we have two callers wanting the exact same code.
 *
 * Per-tile rationale: each <Tile> for a wave-feed source mounts a
 * MediaStream-bearing connection; closing the tile (layout change, source
 * swap, unmount) tears it down. MediaStream can't cross IPC, so connections
 * live in the renderer.
 *
 * Receive-only transceivers are added at offer time so the gateway can't
 * coax the multiviewer into publishing media — this is more important here
 * than in wave-monitor because the multiviewer has *many* simultaneous
 * connections, multiplying the surface.
 */

export interface FeedConnection {
  stream: MediaStream;
  close: () => void;
}

interface ConnectOptions {
  feedUrl: string;
  iceServers?: RTCIceServer[];
  signal?: AbortSignal;
}

const DEFAULT_ICE: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
const SIGNAL_TIMEOUT_MS = 15_000;

export async function connectFeed(opts: ConnectOptions): Promise<FeedConnection> {
  const pc = new RTCPeerConnection({
    iceServers: opts.iceServers ?? DEFAULT_ICE,
    iceTransportPolicy: 'all',
  });

  pc.addTransceiver('video', { direction: 'recvonly' });
  pc.addTransceiver('audio', { direction: 'recvonly' });

  const stream = new MediaStream();
  pc.ontrack = (ev: RTCTrackEvent) => {
    for (const track of ev.streams[0]?.getTracks() ?? [ev.track]) {
      if (!stream.getTracks().find((t) => t.id === track.id)) {
        stream.addTrack(track);
      }
    }
  };

  let aborted = false;
  const innerController = new AbortController();
  const onOuterAbort = (): void => {
    aborted = true;
    innerController.abort();
  };
  opts.signal?.addEventListener('abort', onOuterAbort, { once: true });

  const close = (): void => {
    aborted = true;
    opts.signal?.removeEventListener('abort', onOuterAbort);
    for (const t of stream.getTracks()) t.stop();
    try {
      pc.close();
    } catch {
      /* already closed */
    }
  };

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitIceGathering(pc, innerController.signal);

    if (aborted || !pc.localDescription) throw new DOMException('aborted', 'AbortError');

    const timer = setTimeout(() => innerController.abort(), SIGNAL_TIMEOUT_MS);
    let answerSdp: string;
    try {
      const res = await fetch(opts.feedUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/sdp',
          accept: 'application/sdp',
        },
        body: pc.localDescription.sdp,
        signal: innerController.signal,
      });
      if (!res.ok) throw new Error(`gateway returned ${res.status}`);
      answerSdp = await res.text();
    } finally {
      clearTimeout(timer);
    }

    if (aborted) throw new DOMException('aborted', 'AbortError');

    await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    return { stream, close };
  } catch (err) {
    close();
    throw err;
  }
}

function waitIceGathering(pc: RTCPeerConnection, signal: AbortSignal): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const onAbort = (): void => {
      pc.removeEventListener('icegatheringstatechange', check);
      reject(new DOMException('aborted', 'AbortError'));
    };
    const check = (): void => {
      if (pc.iceGatheringState === 'complete') {
        signal.removeEventListener('abort', onAbort);
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
