"""Inlined scripts escape </script, </body and </html so dev servers that inject code before </body (e.g. VS Code Live Server) cannot split them.
Produce the offline editor (Flow-Studio.html) and viewer (Flow-Viewer.html) from the source files."""
from pathlib import Path
import json
p=Path(__file__).resolve().parent
core=(p/'core.js').read_text()
assets='window.FLOW_ASSETS='+ (p/'assets.json').read_text()+';\nwindow.FLOW_CORE_SOURCE='+json.dumps(core)+';\n'
(p/'assets-data.js').write_text(assets)
html=(p/'index.html').read_text()
for sheet in ['styles.css','screens.css']:
 html=html.replace('<link rel="stylesheet" href="'+sheet+'">','<style>'+(p/sheet).read_text()+'</style>')
for name,source in [('assets-data.js',assets),('core.js',core),('app.js',(p/'app.js').read_text()),('screens.js',(p/'screens.js').read_text())]:
 html=html.replace('<script src="'+name+'"></script>','<script>'+source.replace('</script','<\\/script').replace('</body','<\\/body').replace('</html','<\\/html')+'</script>')
html=html.replace('href="viewer.html" data-built-href="Flow-Viewer.html"','href="Flow-Viewer.html"')
(p.parent/'Flow-Studio.html').write_text(html)
print('Built Flow-Studio.html:',len(html.encode()),'bytes')

# Flow Viewer: presents saved .flow.json files. It only embeds the artwork of its demo diagram,
# because projects carry their own images.
all_assets=json.loads((p/'assets.json').read_text())
demo={k:v for k,v in all_assets.items() if k in ('villa-site','villa-roof-solar','villa-inverter','villa-meter','villa-battery','grid-feed','utility-pole','villa-site-m','villa-roof-solar-m','villa-inverter-m','villa-meter-m','villa-battery-m')}
viewer_data='window.FLOW_DEMO_ASSETS='+json.dumps(demo,separators=(',',':'))+';\n'
viewer=(p/'viewer.html').read_text().replace('<link rel="stylesheet" href="viewer.css">','<style>'+(p/'viewer.css').read_text()+'</style>')
for name,source in [('viewer-data.js',viewer_data),('core.js',core),('viewer.js',(p/'viewer.js').read_text())]:
 viewer=viewer.replace('<script src="'+name+'"></script>','<script>'+source.replace('</script','<\\/script').replace('</body','<\\/body').replace('</html','<\\/html')+'</script>')
(p/'viewer-data.js').write_text(viewer_data)
viewer=viewer.replace('href="index.html#editor" data-built-href="Flow-Studio.html#editor"','href="Flow-Studio.html#editor"')
(p.parent/'Flow-Viewer.html').write_text(viewer)
print('Built Flow-Viewer.html:',len(viewer.encode()),'bytes')
