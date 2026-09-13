import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repo name on GitHub — the site is served under this path on GitHub Pages.
const REPO = 'ACTIVE-LED-SIMULATOR';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? `/${REPO}/` : '/',
  server: { port: 5175, open: true },
}));
