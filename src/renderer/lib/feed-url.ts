/**
 * Map a feedSlug to a fully-qualified gateway WHEP URL.
 *
 * Centralized so the per-tile component doesn't bake the gateway base in,
 * and so a future settings panel can switch staging ↔ prod without touching
 * every call site.
 */

const DEFAULT_GATEWAY_BASE = 'https://api.wave.online';

export function feedUrlFor(feedSlug: string, gatewayBase = DEFAULT_GATEWAY_BASE): string {
  // Strip any leading slash on the slug to keep the URL canonical even if the
  // operator pastes "/something" instead of "something".
  const clean = feedSlug.replace(/^\/+/, '');
  return `${gatewayBase}/feed/${encodeURIComponent(clean)}`;
}
