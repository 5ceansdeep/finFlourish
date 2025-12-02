// services/fishEnvPresets.ts
// 어종별 온도/pH/TDS 범위 프리셋 (연구 수치 기반)

import { FishType } from "../types";

type Range = { min: number; max: number };

export interface SpeciesEnvPreset {
  survival: { temp: Range; ph: Range; tdsMax?: number };
  preferred: { temp: Range; ph: Range; tdsMax?: number };
  juvenilePreferred?: { temp?: Range; ph?: Range; tdsMax?: number };
  caution?: { holdTempBelow?: number; worryPhAbove?: number; worryTdsAbove?: number };
}

export const SPECIES_ENV_PRESETS: Record<FishType, SpeciesEnvPreset> = {
  betta: {
    survival: { temp: { min: 15, max: 33 }, ph: { min: 5.0, max: 9.0 }, tdsMax: 6000 },
    preferred: { temp: { min: 25, max: 30 }, ph: { min: 5.5, max: 7.0 }, tdsMax: 1000 },
    juvenilePreferred: { temp: { min: 26, max: 30 } },
    caution: { holdTempBelow: 20 },
  },
  goldfish: {
    survival: { temp: { min: 0, max: 41 }, ph: { min: 4.5, max: 10.5 }, tdsMax: 20000 },
    preferred: { temp: { min: 10, max: 30 }, ph: { min: 5.5, max: 7.0 }, tdsMax: 8000 },
    juvenilePreferred: { temp: { min: 18, max: 28 } },
    caution: { worryTdsAbove: 15000 },
  },
  guppy: {
    survival: { temp: { min: 15, max: 41 }, ph: { min: 5.0, max: 9.0 }, tdsMax: 45000 },
    preferred: { temp: { min: 18, max: 28 }, ph: { min: 6.5, max: 7.5 }, tdsMax: 10000 },
    juvenilePreferred: { temp: { min: 20, max: 28 } },
    caution: { worryPhAbove: 8.5 },
  },
};
