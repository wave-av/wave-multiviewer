import type { Config } from 'tailwindcss';
// @ts-expect-error — @wave-av/ui ships a CJS preset export (no bundled types).
import wavePreset from '@wave-av/ui/preset';

export default {
  presets: [wavePreset],
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
} satisfies Config;
