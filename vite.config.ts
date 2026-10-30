import { defineConfig } from 'vite';

// `base: './'` makes asset paths relative so the build works when served from
// a GitHub Pages sub-path (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
});
