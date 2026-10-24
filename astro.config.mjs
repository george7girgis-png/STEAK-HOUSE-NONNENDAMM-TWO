import { defineConfig } from 'astro/config';

// Statische Seite; Routen entsprechen der bisherigen Website (mit Schrägstrich am Ende).
export default defineConfig({
  site: 'https://www.steakhaus-nonnendamm.de',
  // Für Vorschauen in einem Unterordner (GitHub Pages): BASE_PATH=/repo-name
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  server: { port: 4327 },
});
