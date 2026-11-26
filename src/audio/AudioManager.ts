import { SFX_FILES, type SfxId } from './sfx';

// Web Audio manager. Buffers are decoded on demand and pooled in M7; for M0 we
// keep a lazy AudioContext (must be created/resumed on a user gesture) and a
// mute flag. Play() is a safe no-op stub until the buffer pipeline lands.
export class AudioManager {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    if (!this.ctx) {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        try {
          this.ctx = new Ctor();
        } catch {
          /* no audio */
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  urlFor(id: SfxId): string {
    return '/audio/' + SFX_FILES[id] + '.mp4';
  }

  play(_id: SfxId) {
    /* M7: pooled, pre-decoded playback */
  }
}
