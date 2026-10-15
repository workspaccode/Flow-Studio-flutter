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
