import { defineConfig } from 'astro/config';

// Statische Seite; Routen entsprechen der bisherigen Website (mit Schrägstrich am Ende).
export default defineConfig({
  site: 'https://www.steakhaus-nonnendamm.de',
  trailingSlash: 'always',
  build: { format: 'directory' },
  server: { port: 4327 },
});
