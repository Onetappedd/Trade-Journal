// A preset may either (1) auto-map headers or (2) fully transform rows.
export type PresetDetectResult = { confidence: number; reason?: string };
export type PresetTransformCtx = {
  userId: string;
  runId: string;
  source: string;            // 'robinhood' | 'webull' | ...
  tz?: string | 'local';     // optional user override
};

export type Preset = {
  id: 'robinhood' | 'webull' | string;
  label: string;
  // quick check from headers + a few sample rows
  detect: (headers: string[], samples: Record<string, unknown>[]) => PresetDetectResult;
  // If provided, importer can skip manual mapping and call this per row
  transform?: (
    raw: Record<string, unknown>,
    ctx: PresetTransformCtx
  ) => { ok: true; value: Partial<import('../../import/types').CanonicalTrade> } |
       { ok: false; skip?: boolean; error?: string };
  // Optional: return a header mapping for your existing mapping UI (not used when transform is present)
  autoMap?: (headers: string[]) => Record<string, string | null>;
};

export function bestPreset(
  presets: Preset[],
  headers: string[],
  samples: Record<string, unknown>[]
): { preset: Preset | null; score: number; reason?: string } {
  let best: { preset: Preset | null; score: number; reason?: string } = { preset: null, score: 0 };
  for (const p of presets) {
    const r = p.detect(headers, samples);
    if (r.confidence > best.score) best = { preset: p, score: r.confidence, reason: r.reason };
  }
  return best;
}

// Re-export local presets; the files will be created next.
export { robinhoodPreset } from './robinhood';
export { webullPreset } from './webull';

// Import presets for the array
import { robinhoodPreset } from './robinhood';
import { webullPreset } from './webull';

export const ALL_PRESETS = [robinhoodPreset, webullPreset];
