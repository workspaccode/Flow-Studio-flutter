# Element artwork

Isometric illustrations for the built-in elements, drawn with `iso.js` (a small canvas engine:
boxes, roofs, windows, cylinders, foliage, PV modules, soft shadows).

| Scene | Asset key |
| --- | --- |
| `house.js` | `solar-home` |
| `school.js` | `school` |
| `factory.js` | `factory` |
| `pole.js` | `utility-pole` |
| `generator.js` | `generator` |
| `pump.js` | `pump` |
| `house-site.js` | `house-site` + parts `roof-solar`, `wall-inverter`, `yard-battery`, `yard-pole` |
| `ev-charger.js` | `ev-charger` |
| `smart-meter.js` | `smart-meter` |
| `modern-home.js` | `modern-home` |
| `villa-site.js` | `villa-site` (+ `villa-site-lit`) + parts `villa-roof-solar`, `villa-inverter`, `villa-meter`, `villa-battery` |

Each scene runs in a browser page after `iso.js` and ends with `ISO.export(canvas, name)`, which trims
the transparent margin, scales to at most 1100px wide and stores a WebP (quality 0.93) in
`window.__out[name]`. Put the result in `src/assets.json` as
`{"src": "data:image/webp;base64,…", "width": …, "height": …}`, then run `python src/build.py`.

`house-site.js` draws the house and each part on canvases that share one projection, crops them all
to the same frame, and records each part's box as a fraction of the house image. Those boxes become
`slots` on the `house-site` asset (`{roof|wall|battery|pole: {x, y, w, h, kind}}`), which the editor uses
to place attached parts exactly over the house.

The wall inverter is the RESC product photo (`resc-inverter.png`, background removed) mapped onto the
garage wall in perspective; the page needs it as `window.__resc` (a data URL) before running the scene.
The scene also exports `cables`: cable paths (roof → wall, wall → battery, wall → pole) as fractions of
the house image. They are stored on the `house-site` asset and the editor lays the part lines along them.

## Lights-on overlays

`ISO.lit = true` makes `ISO.window` draw warm lit glass (#ffe3a3 → #f2b44f, soft glow, no sky reflection).
`house.js`, `house-site.js` (base layer) and `modern-home.js` render their scene twice on identical canvases,
normal and lit; `ISO.overlay(normal, lit)` keeps the lit pixels wherever the two differ (so anything in front
of a window still hides it), and the overlay is cropped and scaled with exactly the same rectangle as the base.
`ISO.export(canvas, name, {lit})` stores it as `<name>-lit`; `house-site.js` stores it in `window.__site.lit`.
The overlays (`solar-home-lit`, `house-site-lit`, `modern-home-lit`) have the base image's exact pixel size:
draw them over the base (for `house-site`, right after the base and before the attached parts).

`iso.js` also has `ISO.prism` (a profile extruded along y, used for the car), `ISO.discY` and `ISO.cable`.

## Villa site

`villa-site.js` is a configurable white flat-roof villa (glass-railed upper terrace and roof edge, warm interiors,
roll-up garage, light paved plot) built like `house-site.js`: one projection for every layer, one union crop `U0`,
≤1100px wide, slots and cables as fractions of the base image. Slots: `roof` (`villa-roof-solar`, three rows of
tilted dark modules on low frames), `wall` (`villa-inverter`, the RESC photo mapped onto the front wall),
`meter` (`villa-meter`) and `battery` (`villa-battery`, a floor-standing cabinet with an LED strip). Cables:
`roof>wall`, `wall>battery`, `wall>meter`, `meter>grid` (the last one ends at the plot edge, not on a part).
Each part layer is cut from a render of the whole scene with that part drawn in depth order, masked by the part's
own pixels (plus its shadow), so things in front of it (the glass roof railing over the PV rows) are already in the
layer. `win()` in the scene draws windows with a room behind the glass (floor, back wall, sofa, pendant) that
lights up with `ISO.lit`. Needs `window.__resc`; the result is in `window.__villa` (`files`, `json`, `previews`).
`ISO.moduleTex(cols, rows, {cells, frame, back, line})` takes optional colours (used here for dark blue-grey modules).
