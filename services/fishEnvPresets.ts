// services/fishEnvPresets.ts
// 어종별 온도/pH/TDS 범위 프리셋 (연구 수치 기반)

import { FishType, LifeStage } from "../types";

type Range = { min: number; max: number };

export interface SpeciesEnvPreset {
  survival: { temp: Range; ph: Range; tdsMax?: number };
  preferred: { temp: Range; ph: Range; tdsMax?: number };
  juvenilePreferred?: { temp?: Range; ph?: Range; tdsMax?: number };
  caution?: { holdTempBelow?: number; worryPhAbove?: number; worryTdsAbove?: number };
}

export interface EnvBand {
  temp: { preferred: Range; survival: Range };
  ph: { preferred: Range; survival: Range };
  tds?: { preferredMax: number; survivalMax: number };
  caution?: SpeciesEnvPreset["caution"];
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

export const buildEnvBand = (preset: SpeciesEnvPreset, lifeStage: LifeStage = "adult"): EnvBand => ({
  temp: {
    preferred: preset.juvenilePreferred?.temp && lifeStage === "juvenile" ? preset.juvenilePreferred.temp : preset.preferred.temp,
    survival: preset.survival.temp,
  },
  ph: {
    preferred: preset.juvenilePreferred?.ph && lifeStage === "juvenile" ? preset.juvenilePreferred.ph : preset.preferred.ph,
    survival: preset.survival.ph,
  },
  tds:
    preset.preferred.tdsMax && preset.survival.tdsMax
      ? {
          preferredMax:
            preset.juvenilePreferred?.tdsMax && lifeStage === "juvenile" ? preset.juvenilePreferred.tdsMax : preset.preferred.tdsMax,
          survivalMax: preset.survival.tdsMax,
        }
      : undefined,
  caution: preset.caution,
});

export const ENV_BANDS: Record<`${FishType}_${LifeStage}`, EnvBand> = {
  betta_juvenile: buildEnvBand(SPECIES_ENV_PRESETS.betta, "juvenile"),
  betta_adult: buildEnvBand(SPECIES_ENV_PRESETS.betta, "adult"),
  goldfish_juvenile: buildEnvBand(SPECIES_ENV_PRESETS.goldfish, "juvenile"),
  goldfish_adult: buildEnvBand(SPECIES_ENV_PRESETS.goldfish, "adult"),
  guppy_juvenile: buildEnvBand(SPECIES_ENV_PRESETS.guppy, "juvenile"),
  guppy_adult: buildEnvBand(SPECIES_ENV_PRESETS.guppy, "adult"),
};

export const ADULT_ENV_BANDS: Record<FishType, EnvBand> = {
  betta: ENV_BANDS.betta_adult,
  goldfish: ENV_BANDS.goldfish_adult,
  guppy: ENV_BANDS.guppy_adult,
};
