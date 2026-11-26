export type SfxId =
  | 'hop'
  | 'hit'
  | 'squish'
  | 'drown'
  | 'coin'
  | 'trainWarn'
  | 'trainPass'
  | 'eagle'
  | 'unlock'
  | 'splash';

// Maps logical SFX ids to the original audio files under /audio (no extension).
// Values match the downloaded asset filenames (subfolder id kept where needed).
export const SFX_FILES: Record<SfxId, string> = {
  hop: 'hop2',
  hit: 'carhit',
  squish: 'carsquish',
  drown: 'watersplash',
  coin: 'get-coin-79',
  trainWarn: 'train-alarm',
  trainPass: 'train-pass-shorter',
  eagle: 'hawk-screech-02',
  unlock: 'gift/Earn-Points',
  splash: 'watersplashlow',
};
