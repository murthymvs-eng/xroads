import { defineConfig } from 'vite';

// Assets live in ./assets (the original game folder, copied from the
// GitHub Pages host). We serve them as the Vite public dir so runtime
// asset URLs match the original layout: /sprites/chicken.png, /audio/..., /fonts/...
export default defineConfig({
  base: '/xroads/',
  publicDir: 'assets',
  server: { host: true, port: 5173, open: false },
  build: { outDir: 'dist', emptyOutDir: true },
});
