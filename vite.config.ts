import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Serve from root — works for custom domains (e.g. led.techwizer.in).
// If you ever go back to the raw github.io/ACTIVE-LED-SIMULATOR/ URL,
// change base to '/ACTIVE-LED-SIMULATOR/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5175, open: true },
});
