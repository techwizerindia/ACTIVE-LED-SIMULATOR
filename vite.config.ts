import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// With a custom domain (e.g. led.techwizer.in) the site is served from root.
// Set VITE_BASE=/ACTIVE-LED-SIMULATOR/ if you go back to the github.io URL.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  plugins: [react()],
  base,
  server: { port: 5175, open: true },
});
