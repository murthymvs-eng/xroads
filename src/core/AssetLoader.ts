import * as THREE from 'three';

export interface AssetSpec {
  id: string;
  url: string; // runtime URL, e.g. /sprites/chicken.png
}

// Loads image assets into THREE.Textures. Resolves once every requested
// image has finished loading (or errored) so boot never hangs.
export class AssetLoader {
  private textures = new Map<string, THREE.Texture>();
  private loading: Promise<Record<string, THREE.Texture>> | null = null;

  load(specs: AssetSpec[]): Promise<Record<string, THREE.Texture>> {
    if (this.loading) return this.loading;
    const loader = new THREE.TextureLoader();
    this.loading = new Promise((resolve) => {
      let pending = specs.length;
      const finishOne = () => {
        if (pending > 0) pending--;
        if (pending === 0) resolve(Object.fromEntries(this.textures));
      };
      for (const s of specs) {
        loader.load(
          s.url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter; // crisp pixel art
            tex.minFilter = THREE.NearestFilter;
            this.textures.set(s.id, tex);
            finishOne();
          },
          undefined,
          () => finishOne(), // error: still resolve to avoid a stuck loader
        );
      }
    });
    return this.loading;
  }

  get(id: string): THREE.Texture | undefined {
    return this.textures.get(id);
  }
}
