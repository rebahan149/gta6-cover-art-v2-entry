[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rebahan149/gta6-cover-art-v2-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard)
[![reward](https://make.fun/badge/gta6-cover-art-01/rebahan149/gta6-cover-art-v2-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# PALM RIOT — Cover Studio

**Your photos. Poster-sized.** Turn your own photos into multi-panel, GTA-style cover art — slanted panels, a hero photo that pops out of its frame, big title lettering laid over the art, comic callout stickers, cast tags, a studio seal and a movie billing block — graded, finished and exported as a PNG, entirely in your browser. Photos are read on your own machine and never uploaded; the app is plain static files and works fully offline.

## What it does

- **Your photos, your cast.** Add photos from your device (or start with the four bundled samples) and place them into the cover's panels — a different photo per panel, or one photo spanned continuously across every panel for the classic one-scene collage.
- **Six panel layouts.** Pop-Out Hero, Slanted Strips, Hero Strip, Comic Grid, Skyline Split and Mosaic, drawn full-bleed with white poster gutters and diagonal cuts.
- **Pop-out heroes.** Tick "Pop this panel out" and that panel's photo is lifted larger, above its frame, white-bordered with a soft shadow — the subject breaks out of the collage.
- **Per-panel crops.** Click a panel to select it, drag on the cover to pan its photo, scroll or use the slider to zoom (100–320%), all clamped so a photo always covers its panel. A smart-crop toggle biases the crop toward the upper third, where faces live.
- **Six colour grades.** Vice Sunset, Heatwave Dusk, Neon Nights, Golden Hour, Midnight Teal and Poster Ink, each a photo filter plus a matching wash — with sky glow, film grain and a halftone print finish on top.
- **Title over the art.** Your title in bundled Anton display capitals (SIL Open Font License, under `app/fonts/`) with sunset, chrome, neon or bone fills, a dark outline and shadow, laid over the top or the foot of the art, with a letterspaced kicker line.
- **Callout stickers & cast tags.** Rotated comic-style stickers ("NO BRAKES!", "AFTER DARK") pinned anywhere on the cover, and a name plate inside each panel for your cast.
- **Poster furniture.** A hand-drawn gold studio seal, a movie-style billing block that names your cast, a rating box and a barcode strip — each toggleable.
- **Post-size export.** One click exports a clean PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

Serve the `app/` folder with any static file server — the kit's helper works out of the box:

```sh
node serve.ts   # then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-app.ts`, unchanged).

## License

MIT — see `LICENSE`. The bundled Anton font is licensed under the SIL Open Font License — see `app/fonts/OFL.txt`.
