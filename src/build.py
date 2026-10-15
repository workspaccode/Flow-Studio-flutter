"""Produce the offline editor (Flow-Studio.html) and viewer (Flow-Viewer.html) from the source files."""
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
 html=html.replace('<script src="'+name+'"></script>','<script>'+source.replace('</script','<\\/script')+'</script>')
(p.parent/'Flow-Studio.html').write_text(html)
print('Built Flow-Studio.html:',len(html.encode()),'bytes')

# Flow Viewer: presents saved .flow.json files. It only embeds the artwork of its demo diagram,
# because projects carry their own images.
all_assets=json.loads((p/'assets.json').read_text())
demo={k:v for k,v in all_assets.items() if k in ('house-site','roof-solar','wall-inverter','yard-battery','yard-pole')}
viewer_data='window.FLOW_DEMO_ASSETS='+json.dumps(demo,separators=(',',':'))+';\n'
viewer=(p/'viewer.html').read_text().replace('<link rel="stylesheet" href="viewer.css">','<style>'+(p/'viewer.css').read_text()+'</style>')
for name,source in [('viewer-data.js',viewer_data),('core.js',core),('viewer.js',(p/'viewer.js').read_text())]:
 viewer=viewer.replace('<script src="'+name+'"></script>','<script>'+source.replace('</script','<\\/script')+'</script>')
(p/'viewer-data.js').write_text(viewer_data)
(p.parent/'Flow-Viewer.html').write_text(viewer)
print('Built Flow-Viewer.html:',len(viewer.encode()),'bytes')
