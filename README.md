# Active LED Display Simulator

A pixel-accurate simulator of a real-world active LED wall. Choose a pitch (P1.25 → P16), a module grid, a source (image / video / webpage / test pattern), and watch it render through the same pipeline a physical LED video processor uses: source frame → downsample to the wall's native resolution → upscale with pixelated rendering → diode-mask + glow overlay → viewing-distance blur.

## Run

```bash
cd led-simulator
npm install
npm run dev
```

Opens on http://localhost:5175

## Notes on sources

- **Image**: any direct image URL. Enable "CORS proxy" if the host blocks canvas access — routed via images.weserv.nl.
- **Video**: direct `.mp4` / `.webm` URL that sends CORS headers, or a same-origin file.
- **Webpage**: rendered in an iframe (with optional allorigins proxy). Because browsers don't let JS read cross-origin iframe pixels, the webpage isn't truly downsampled — the diode mask + brightness/blur still make it *look* like an LED wall. For true downsampling of arbitrary pages you'd need a headless-Chrome screenshot service.
- **Test Pattern**: procedural bars + grayscale steps + sweep. Best for showing off pixelation on low pitches like P10/P16.

## Presets

Hard-coded pitch table (module dimensions, native px per module, lamp type, use case) lives in `src/presets.ts`. Add or tweak entries there.
