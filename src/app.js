(function(){
'use strict';
const F=window.FlowCore,$=id=>document.getElementById(id),q=(s,r=document)=>r.querySelector(s),esc=F.esc;
F.standalone.coreSource=window.FLOW_CORE_SOURCE;
const BUILTINS={...window.FLOW_ASSETS,...F.extraAssets};let project=F.preset('hybrid',window.FLOW_ASSETS),selection=null,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,connectFrom=null,connectMode=false,grid=false,snap=true,drag=null,lastTap=null,lockRatio=true;
let history=[],future=[],lastState='',saveTimer,toastTimer,nudgeTimer;
const STORAGE='flow-studio.v1';
/* Line fields added after v1 files; missing values mean these defaults. */
const EDGE_DEFAULTS={route:'orthogonal',sourceOffset:0,targetOffset:0,pulses:1,pulseLength:.12,glow:.13,trackStyle:'solid'};
const SWATCHES=['#6688ff','#22b8cf','#4bb390','#f2a541','#e5604d','#8b6cf0','#293b55','#c9d7ff'];
const tabs={node:'data',edge:'motion',canvas:'canvas'};
const ICONS={copy:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>',trash:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.1A1 1 0 0 0 5.7 14h4.6a1 1 0 0 0 1-.9L12 4M6.8 6.5v5M9.2 6.5v5"/></svg>'};
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function snapshot(){const{assets,...rest}=project;return JSON.stringify(rest);}
function commit(){const now=snapshot();if(now!==lastState){history.push(lastState);if(history.length>60)history.shift();future=[];lastState=now;}saveLater();updateHistory();}
function saveLater(){clearTimeout(saveTimer);$('save-status').textContent='Saving…';saveTimer=setTimeout(()=>{try{const{assets,...rest}=project;const custom=Object.fromEntries(Object.entries(assets).filter(([k])=>!BUILTINS[k]));localStorage.setItem(STORAGE,JSON.stringify({...rest,assets:custom}));$('save-status').textContent='Saved on this device';}catch(e){$('save-status').textContent='Use Save project';}},450);}
function updateHistory(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function restore(s){const assets=project.assets;project={...JSON.parse(s),assets};if(selection&&!findSelected())selection=null;lastState=s;draw();inspect();saveLater();updateHistory();}
function undo(){if(!history.length)return;future.push(snapshot());restore(history.pop());}
function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());}
try{const saved=JSON.parse(localStorage.getItem(STORAGE));if(saved){saved.assets={...F.clone(BUILTINS),...saved.assets};F.validate(saved);project=saved;}}catch(e){/* Invalid older drafts never prevent opening the editor. */}
lastState=snapshot();
function unique(prefix,list){let n=1,id=prefix;while(list.some(x=>x.id===id))id=prefix+'-'+n++;return id;}
function findSelected(){return selection?(selection.type==='node'?project.nodes:project.edges).find(x=>x.id===selection.id):null;}
function select(type,id){selection=type?{type,id}:null;draw();inspect();}
function val(item,key){return item[key]??EDGE_DEFAULTS[key];}
function refresh(){commit();draw();inspect();}

/* ---------- Canvas and layers ---------- */
function draw(){
 const svg=F.render(project,{editable:true,selection,grid,animate:!paused});const canvas=$('canvas');canvas.setAttribute('viewBox',svg.getAttribute('viewBox'));canvas.replaceChildren(...svg.childNodes);canvas.setAttribute('aria-label',project.title);
 if(document.activeElement!==$('project-title'))$('project-title').value=project.title;$('canvas-info').textContent=`${project.width} × ${project.height}`;
 $('motion').textContent=paused?'▶ Play':'Ⅱ Pause';$('motion').setAttribute('aria-pressed',String(!paused));$('connect').setAttribute('aria-pressed',String(connectMode));$('stage-scroll').classList.toggle('connecting',connectMode);
 $('hint').textContent=connectMode?(connectFrom?'Click the target element · Esc to cancel':'Click the source element · Esc to cancel'):selection?.type==='edge'?'Double-click the line to add a point · double-click a point to remove it':selection?.type==='node'?'Drag to move · arrow keys nudge (Shift = 10px)':'Drag elements · select a line to edit its route';
 layers();updateZoom();updateHistory();
}
function layers(){const list=$('layers');list.replaceChildren();$('layer-count').textContent=project.nodes.length+project.edges.length;
 for(const [type,items,title] of [['node',project.nodes,'Elements'],['edge',project.edges,'Lines']]){if(!items.length)continue;const h=document.createElement('h3');h.className='pane-heading';h.textContent=`${title} · ${items.length}`;list.append(h);
  for(const item of items){const row=document.createElement('div');row.className='layer-row'+(selection?.type===type&&selection.id===item.id?' active':'');
   row.innerHTML=`<button class="layer-state ${esc(item.state)}" title="${esc(item.state)} — click to change" aria-label="State: ${esc(item.state)}. Change state"></button><button class="layer-name"><span class="layer-icon">${type==='node'?'◼':'⟿'}</span><span>${esc(item.name||item.id)}</span><small>${esc(item.id)}</small></button>`;
   row.firstChild.onclick=()=>{item.state=F.STATES[(F.STATES.indexOf(item.state)+1)%3];refresh();};row.lastChild.onclick=()=>select(type,item.id);list.append(row);}}
 if(!project.nodes.length&&!project.edges.length)list.innerHTML='<p class="pane-help">The canvas is empty. Add elements from the Elements tab.</p>';
}
const ZOOMS=['0.5','0.75','1','1.25','1.5','2','3'];
function updateZoom(){$('stage-size').style.width=(Number($('zoom').value)*100)+'%';}
function stepZoom(d){const i=Math.max(0,Math.min(ZOOMS.length-1,ZOOMS.indexOf($('zoom').value)+d));$('zoom').value=ZOOMS[i];updateZoom();}

/* ---------- Inspector controls ---------- */
const label=(text,key)=>`<span class="control-label" id="lbl-${key}">${text}</span>`;
function text(name,key,value,attrs=''){return`<label class="field">${name}<input data-prop="${key}" type="text" value="${esc(value)}" ${attrs}></label>`;}
function number(name,key,value,o={}){return`<label class="field">${name}<span class="unit-input"><input data-prop="${key}" type="number" value="${esc(value)}" step="${o.step??'any'}" ${o.min!==undefined?`min="${o.min}"`:''} ${o.max!==undefined?`max="${o.max}"`:''}>${o.unit?`<i>${o.unit}</i>`:''}</span></label>`;}
/* A range and a number box bound to one property; `scale` shows fractions as percentages. */
function slider(name,key,value,o){const sc=o.scale||1,shown=+(value*sc).toFixed(4);return`<div class="field slider-field" role="group" aria-labelledby="lbl-${key}">${label(name,key)}<div class="slider-row"><input type="range" data-prop="${key}" data-scale="${sc}" min="${o.min}" max="${o.max}" step="${o.step}" value="${shown}" aria-labelledby="lbl-${key}"><span class="unit-input small"><input type="number" data-prop="${key}" data-scale="${sc}" min="${o.nmin??o.min}" max="${o.nmax??o.max}" step="${o.step}" value="${shown}" aria-labelledby="lbl-${key}">${o.unit?`<i>${o.unit}</i>`:''}</span></div></div>`;}
function color(name,key,value){return`<div class="field" role="group" aria-labelledby="lbl-${key}">${label(name,key)}<div class="color-row"><input type="color" data-prop="${key}" value="${esc(value)}" aria-labelledby="lbl-${key}"><input type="text" data-prop="${key}" data-hex value="${esc(value)}" maxlength="7" spellcheck="false" aria-labelledby="lbl-${key}"></div><div class="swatches">${SWATCHES.map(c=>`<button data-swatch="${key}" data-value="${c}" style="--c:${c}" aria-label="${c}" aria-pressed="${c.toLowerCase()===String(value).toLowerCase()}"></button>`).join('')}</div></div>`;}
function segmented(name,key,value,opts){return`<div class="field" role="group" aria-labelledby="lbl-${key}">${label(name,key)}<div class="segmented">${opts.map(([v,t,title])=>`<button data-seg="${key}" data-value="${esc(v)}" aria-pressed="${String(value)===String(v)}"${title?` title="${esc(title)}"`:''}>${t}</button>`).join('')}</div></div>`;}
function toggle(name,key,value,hint=''){return`<label class="toggle"><input data-prop="${key}" type="checkbox" ${value?'checked':''}><span class="switch" aria-hidden="true"></span><span>${name}${hint?`<small>${hint}</small>`:''}</span></label>`;}
function choose(name,key,value,opts){return`<label class="field">${name}<select data-prop="${key}">${opts.map(([v,t])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;}
const group=(title,body,note='')=>`<section class="group">${title?`<h3>${title}</h3>`:''}${body}${note?`<p class="group-note">${note}</p>`:''}</section>`;
const pair=(a,b)=>`<div class="field-grid">${a}${b}</div>`;
const PORTS=[['top','Top'],['bottom','Bottom'],['left','Left'],['right','Right'],['center','Center']];

function assetInfo(n){const a=project.assets[n.kind];if(!a)return'';const vector=a.src.startsWith('data:image/svg');const fmt=(a.src.match(/^data:image\/([a-z+]+)/)||[])[1]?.replace('svg+xml','svg').replace('jpeg','jpg').toUpperCase()||'';
 const sharp=vector?'Vector — sharp at every size':(()=>{const x=Math.min(a.width/n.w,a.height/n.h);return x>=3?`Sharp up to 3× export (${x.toFixed(1)}× pixels)`:`<b class="warn">Soft above ${Math.max(1,Math.floor(x*10)/10)}× — import a larger image for 3× export</b>`;})();
 return`<div class="asset-card"><img src="${a.src}" alt=""><div><b>${fmt}${vector?'':` · ${a.width} × ${a.height}px`}</b><small>${sharp}</small></div></div>`;}

function inspect(){
 const item=findSelected(),host=$('inspector'),type=selection?.type||'canvas';
 const focused=document.activeElement?.closest?.('#inspector')?[document.activeElement.dataset.prop,document.activeElement.type,document.activeElement.dataset.seg,document.activeElement.dataset.value]:null,scroller=host.parentElement,scroll=scroller.scrollTop;
 const sets={canvas:[['canvas','Canvas'],['guide','Shortcuts']],node:[['data','Data'],['label','Label'],['layout','Layout']],edge:[['motion','Motion'],['style','Style'],['route','Route']]}[type];
 if(!sets.some(([k])=>k===tabs[type]))tabs[type]=sets[0][0];const tab=tabs[type];
 $('inspector-tabs').innerHTML=sets.map(([k,t])=>`<button role="tab" data-itab="${k}" aria-selected="${k===tab}">${t}</button>`).join('');
 $('inspector-kind').textContent={canvas:'Canvas',node:'Element',edge:'Line'}[type];$('inspector-kind').dataset.kind=type;
 const actions=$('inspector-actions');
 if(!item){$('inspector-title').textContent='Canvas settings';$('inspector-subtitle').textContent=`${project.nodes.length} elements · ${project.edges.length} lines`;actions.innerHTML='';
  host.innerHTML=tab==='canvas'?group('',text('Project name','title',project.title)+pair(number('Width','width',project.width,{min:100,max:4096,step:1,unit:'px'}),number('Height','height',project.height,{min:100,max:4096,step:1,unit:'px'}))+color('Background','background',project.background))+group('Fit',`<button id="fit-content" class="wide">Fit canvas to content</button>`,'Moves everything inside the canvas with a 20px margin. Exports need all content inside.')
   :group('Editing',`<dl class="keys"><dt>C</dt><dd>Connect two elements</dd><dt>Double-click line</dt><dd>Add a route point</dd><dt>Double-click point</dt><dd>Remove it</dd><dt>← ↑ → ↓</dt><dd>Nudge element (Shift = 10px)</dd><dt>Ctrl/⌘ D</dt><dd>Duplicate element</dd><dt>Delete</dt><dd>Remove selection</dd><dt>Ctrl/⌘ Z</dt><dd>Undo · Shift for redo</dd><dt>Ctrl/⌘ V</dt><dd>Paste an image</dd><dt>Esc</dt><dd>Cancel / deselect</dd></dl>`);
  const fit=$('fit-content');if(fit)fit.onclick=()=>{F.fit(project);refresh();toast('Canvas resized to fit the diagram');};
 }else if(type==='node'){
  $('inspector-title').textContent=item.name||item.id;$('inspector-subtitle').innerHTML=`id <code>${esc(item.id)}</code>`;
  actions.innerHTML=`<button id="duplicate" class="icon" title="Duplicate (Ctrl/⌘ D)" aria-label="Duplicate">${ICONS.copy}</button><button id="remove" class="icon danger" title="Delete (Delete key)" aria-label="Delete">${ICONS.trash}</button>`;
  const state=segmented('Visibility','state',item.state,[['active','Active'],['inactive','Inactive'],['hidden','Hidden']]);
  if(tab==='data')host.innerHTML=group('',state+text('Name','name',item.name)+pair(number('Value','value',item.value),text('Unit','unit',item.unit))+text('Status text','status',item.status,'placeholder="e.g. Charging"'))
   +group('Details',toggle('Show current & efficiency','showDetails',item.showDetails)+pair(number('Current','current',item.current),text('Current unit','currentUnit',item.currentUnit))+number('Efficiency','efficiency',item.efficiency,{min:0,max:100,unit:'%'}));
  if(tab==='label')host.innerHTML=group('',toggle('Show label','showLabel',item.showLabel!==false)+segmented('Position','labelSide',item.labelSide,[['top','Top'],['bottom','Bottom'],['left','Left'],['right','Right']])+slider('Gap','labelGap',item.labelGap,{min:0,max:200,step:1,unit:'px'})+slider('Font size','fontSize',item.fontSize,{min:8,max:60,step:1,unit:'px'})+color('Value color','color',item.color));
  if(tab==='layout')host.innerHTML=group('Artwork',assetInfo(item)+`<div class="button-row"><button id="replace-art">Replace image…</button><button id="native-ratio" title="Match the image's aspect ratio">Fit image ratio</button></div>`)
   +group('Position',pair(number('X','x',item.x,{step:1,unit:'px'}),number('Y','y',item.y,{step:1,unit:'px'}))+`<div class="button-row"><button data-center="x">Center horizontally</button><button data-center="y">Center vertically</button></div>`)
   +group('Size',pair(number('Width','w',item.w,{min:1,max:4096,step:1,unit:'px'}),number('Height','h',item.h,{min:1,max:4096,step:1,unit:'px'}))+`<label class="toggle"><input id="lock-ratio" type="checkbox" ${lockRatio?'checked':''}><span class="switch" aria-hidden="true"></span><span>Lock aspect ratio</span></label>`);
  $('duplicate').onclick=duplicate;$('remove').onclick=remove;
  if($('replace-art'))$('replace-art').onclick=()=>pickFiles(files=>importFiles(files,{replace:item}));
  if($('native-ratio'))$('native-ratio').onclick=()=>{const a=project.assets[item.kind];if(!a)return;item.h=Math.round(item.w*a.height/a.width);refresh();};
  if($('lock-ratio'))$('lock-ratio').onchange=e=>lockRatio=e.target.checked;
  host.querySelectorAll('[data-center]').forEach(b=>b.onclick=()=>{const k=b.dataset.center;item[k]=(k==='x'?project.width:project.height)/2;autoEdges(item);refresh();});
 }else{
  $('inspector-title').textContent=item.name||item.id;$('inspector-subtitle').innerHTML=`id <code>${esc(item.id)}</code>`;
  actions.innerHTML=`<button id="remove" class="icon danger" title="Delete line" aria-label="Delete line">${ICONS.trash}</button>`;$('remove').onclick=remove;
  const nodes=project.nodes.map(n=>[n.id,n.name||n.id]);
  if(tab==='motion')host.innerHTML=group('',segmented('Visibility','state',item.state,[['active','Active'],['inactive','Inactive'],['hidden','Hidden']])+segmented('Direction','direction',item.direction,[[1,'Source → target'],[-1,'Target → source']]))
   +group('Pulse',slider('Cycle time','duration',item.duration,{min:.5,max:20,step:.1,unit:'s'})+slider('Pulses','pulses',val(item,'pulses'),{min:1,max:12,step:1})+slider('Pulse length','pulseLength',val(item,'pulseLength'),{min:2,max:90,step:1,unit:'%',scale:100})+slider('Glow','glow',val(item,'glow'),{min:0,max:100,step:1,unit:'%',scale:100}),'Shorter cycle time = faster motion. Use the same cycle time on every line for a seamless Lottie loop.');
  if(tab==='style')host.innerHTML=group('Pulse',color('Pulse color','color',item.color)+slider('Pulse width','width',item.width,{min:.5,max:30,step:.5,unit:'px'}))
   +group('Track',color('Track color','trackColor',item.trackColor)+slider('Track width','trackWidth',item.trackWidth,{min:.5,max:30,step:.1,unit:'px'})+segmented('Track style','trackStyle',val(item,'trackStyle'),[['solid','Solid'],['dashed','Dashed'],['dotted','Dotted']]))
   +group('Corners',slider('Corner radius','radius',item.radius,{min:0,max:100,step:1,unit:'px'}));
  if(tab==='route'){const pts=item.auto?[]:item.waypoints;
   host.innerHTML=group('',segmented('Shape','route',val(item,'route'),[['orthogonal','Orthogonal','Right angles with rounded corners'],['straight','Straight','Direct line'],['curved','Curved','Smooth curve']])+toggle('Automatic route','auto',item.auto,'Off = edit points by hand'))
    +group('Start',choose('Element','from',item.from,nodes)+segmented('Side','sourcePort',item.sourcePort,PORTS)+slider('Offset along side','sourceOffset',val(item,'sourceOffset'),{min:-150,max:150,step:1,unit:'px',nmin:-2048,nmax:2048}))
    +group('End',choose('Element','to',item.to,nodes)+segmented('Side','targetPort',item.targetPort,PORTS)+slider('Offset along side','targetOffset',val(item,'targetOffset'),{min:-150,max:150,step:1,unit:'px',nmin:-2048,nmax:2048})+`<button id="swap-ends" class="wide">⇅ Swap start and end</button>`)
    +group('Points',item.auto?`<p class="group-note">The route follows the elements automatically.</p><button id="manual-route" class="wide">Edit points by hand</button>`:`<ol class="points">${pts.map((p,i)=>`<li><span>${i+1}</span><input type="number" data-point="${i}" data-axis="0" value="${p[0]}" aria-label="Point ${i+1} X"><input type="number" data-point="${i}" data-axis="1" value="${p[1]}" aria-label="Point ${i+1} Y"><button class="icon" data-remove-point="${i}" aria-label="Remove point ${i+1}">×</button></li>`).join('')}</ol><button id="add-point" class="wide">+ Add point</button>`,'Tip: double-click the line on the canvas to add a point there; drag points to move them.');
   if($('manual-route'))$('manual-route').onclick=()=>{toManual(item);refresh();};
   if($('add-point'))$('add-point').onclick=()=>{const p=F.points(project,item),i=Math.floor((p.length-1)/2);item.waypoints.splice(i,0,[Math.round((p[i][0]+p[i+1][0])/2),Math.round((p[i][1]+p[i+1][1])/2)]);refresh();};
   $('swap-ends').onclick=()=>{[item.from,item.to]=[item.to,item.from];[item.sourcePort,item.targetPort]=[item.targetPort,item.sourcePort];[item.sourceOffset,item.targetOffset]=[val(item,'targetOffset'),val(item,'sourceOffset')];item.waypoints.reverse();item.direction*=-1;refresh();};
   host.querySelectorAll('[data-point]').forEach(input=>input.onchange=()=>{const v=Number(input.value);if(!input.value||!Number.isFinite(v)||v<-4096||v>8192){toast('Enter a number between -4096 and 8192');inspect();return;}item.waypoints[+input.dataset.point][+input.dataset.axis]=v;refresh();});
   host.querySelectorAll('[data-remove-point]').forEach(b=>b.onclick=()=>{item.waypoints.splice(+b.dataset.removePoint,1);refresh();});
  }
 }
 $('inspector-tabs').querySelectorAll('[data-itab]').forEach(b=>b.onclick=()=>{tabs[type]=b.dataset.itab;scroller.scrollTop=0;inspect();});
 if(focused){const [prop,kind,seg,v]=focused;const el=seg?host.querySelector(`[data-seg="${seg}"][data-value="${CSS.escape(v)}"]`):prop?host.querySelector(`[data-prop="${CSS.escape(prop)}"][type="${kind}"]`):null;el?.focus({preventScroll:true});}
 scroller.scrollTop=scroll;
}
/* Moving an element re-routes its connected lines (manual points would no longer meet it). */
function autoEdges(n){for(const e of project.edges)if(e.from===n.id||e.to===n.id)e.auto=true;}
function toManual(e){if(!e.auto)return;e.waypoints=F.points(project,e).slice(1,-1).map(p=>p.map(Math.round));e.auto=false;}
/* Applies an inspector value; live updates redraw without a history step. */
function apply(key,raw,live,input){
 const item=findSelected(),target=item||project,old=target[key];let value=raw;
 if(input?.type==='checkbox')value=input.checked;
 else if(input?.dataset.hex!==undefined){value=String(raw).trim();if(!value.startsWith('#'))value='#'+value;if(!/^#[\da-f]{6}$/i.test(value)){if(!live){toast('Use a hex color like #6688ff');inspect();}return;}value=value.toLowerCase();}
 else if(input&&(input.type==='number'||input.type==='range')){if(raw===''){if(!live){toast('Enter a value');inspect();}return;}value=Number(raw)/Number(input.dataset.scale||1);if(!Number.isFinite(value)){if(!live)inspect();return;}
  const lo=input.min!==''?Number(input.min)/Number(input.dataset.scale||1):-Infinity,hi=input.max!==''?Number(input.max)/Number(input.dataset.scale||1):Infinity;if(input.type==='number'&&(value<lo||value>hi)){if(!live){toast(`Enter a value from ${input.min} to ${input.max}`);inspect();}return;}}
 else if(key==='direction')value=Number(raw);
 if(key==='pulses')value=Math.round(value);
 const ratio=selection?.type==='node'&&lockRatio&&(key==='w'||key==='h')?item.h/item.w:null;
 target[key]=value;
 if(ratio){if(key==='w')item.h=Math.max(1,Math.round(value*ratio));else item.w=Math.max(1,Math.round(value/ratio));}
 if(selection?.type==='node'&&['x','y','w','h'].includes(key))autoEdges(item);
 if(selection?.type==='edge'&&key==='auto'&&!value){target.auto=true;toManual(target);}
 try{F.validate({...project,assets:{}});}catch(e){target[key]=old;if(!live){toast(e.message);inspect();}return;}
 if(selection?.type==='node'&&key==='name'||selection?.type==='edge'&&key==='name')$('inspector-title').textContent=value;
 if(live){draw();for(const twin of $('inspector').querySelectorAll(`[data-prop="${CSS.escape(key)}"]`))if(twin!==input&&twin.type!=='checkbox')twin.value=twin.dataset.hex!==undefined||twin.type==='color'?value:+(value*Number(twin.dataset.scale||1)).toFixed(4);return;}
 refresh();
}
$('inspector').addEventListener('input',e=>{const t=e.target;if(t.dataset.prop&&(t.type==='range'||t.type==='color'||t.dataset.hex!==undefined))apply(t.dataset.prop,t.value,true,t);});
$('inspector').addEventListener('change',e=>{const t=e.target;if(t.dataset.prop)apply(t.dataset.prop,t.value,false,t);});
$('inspector').addEventListener('click',e=>{const b=e.target.closest('[data-seg],[data-swatch]');if(!b)return;const key=b.dataset.seg||b.dataset.swatch;let v=b.dataset.value;if(key==='direction')v=Number(v);apply(key,v,false,null);});

/* ---------- Elements and artwork ---------- */
const NAMES={solar:'Solar array',panel:'Single panel',battery:'Battery',inverter:'Inverter',grid:'Grid',home:'Load',generator:'Generator',pump:'Pump',junction:'Junction'};
function addElement(kind,at,name){if(project.nodes.length>=100){toast('Maximum 100 elements');return null;}const a=project.assets[kind],id=unique(kind.startsWith('custom-')?'element':kind,project.nodes);let w=kind==='junction'?8:kind==='battery'?90:kind==='grid'?95:kind==='solar'?210:150,h=w*a.height/a.width;if(h>180){w*=180/h;h=180;}w=Math.round(w);h=Math.round(h);
 const x=Math.max(w/2,Math.min(project.width-w/2,at?.x??project.width/2)),y=Math.max(h/2,Math.min(project.height-h/2,at?.y??project.height/2));
 const n=F.node(id,kind,name||NAMES[kind]||'Custom element',Math.round(x),Math.round(y),w,h,{showLabel:kind!=='junction'});project.nodes.push(n);selection={type:'node',id};return n;}
function tile(kind,name,src,onclick){const b=document.createElement('button');b.className='palette-item';b.title=`Add ${name}`;b.innerHTML=`<img alt="" src="${src}"><span>${esc(name)}</span>`;b.onclick=onclick;return b;}
function palette(){const host=$('palette');host.replaceChildren();for(const kind of Object.keys(NAMES))host.append(tile(kind,NAMES[kind],project.assets[kind]?.src||BUILTINS[kind].src,()=>{if(!project.assets[kind])project.assets[kind]=F.clone(BUILTINS[kind]);addElement(kind);refresh();}));
 const custom=Object.keys(project.assets).filter(k=>!BUILTINS[k]),wrap=$('custom-assets');wrap.replaceChildren();$('custom-assets-wrap').hidden=!custom.length;
 for(const kind of custom){const used=project.nodes.find(n=>n.kind===kind);wrap.append(tile(kind,used?.name||'Image',project.assets[kind].src,()=>{addElement(kind,null,used?.name);refresh();}));}}
function remove(){const item=findSelected();if(!item)return;if(selection.type==='node'){project.nodes=project.nodes.filter(n=>n.id!==item.id);project.edges=project.edges.filter(e=>e.from!==item.id&&e.to!==item.id);}else project.edges=project.edges.filter(e=>e.id!==item.id);selection=null;refresh();}
function duplicate(){if(project.nodes.length>=100){toast('Maximum 100 elements');return;}const item=findSelected();if(!item||selection.type!=='node')return;const n=F.clone(item);n.id=unique(item.kind.startsWith('custom-')?'element':item.kind,project.nodes);n.x=Math.min(project.width-n.w/2,n.x+30);n.y=Math.min(project.height-n.h/2,n.y+30);project.nodes.push(n);selection={type:'node',id:n.id};refresh();}

/* Images keep their original bytes when every export target can read them (SVG, PNG, JPEG, WebP);
   other formats the browser can decode are converted losslessly to PNG at full resolution. */
const MAX_IMAGE=40*1024*1024;
const readURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the file'));r.readAsDataURL(blob);});
function sniff(b){const s=String.fromCharCode(...b.slice(0,12));if(b[0]===0x89&&s.slice(1,4)==='PNG')return'image/png';if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return'image/jpeg';if(s.startsWith('RIFF')&&s.slice(8,12)==='WEBP')return'image/webp';return'';}
function svgSize(text){const r=new DOMParser().parseFromString(text,'image/svg+xml').documentElement,v=r.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);return[v?.[2]||parseFloat(r.getAttribute('width'))||500,v?.[3]||parseFloat(r.getAttribute('height'))||500];}
async function readAsset(file){
 const ext=(file.name.match(/\.([a-z0-9]+)$/i)||[])[1]?.toLowerCase()||'',kind=file.type||'';if(file.size>MAX_IMAGE)throw new Error(`${file.name}: images up to 40 MB`);
 const head=new Uint8Array(await file.slice(0,512).arrayBuffer());
 if(kind==='image/svg+xml'||ext==='svg'||/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(new TextDecoder().decode(head))){const text=F.sanitizeSVG(await file.text()),[w,h]=svgSize(text);return{src:'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(text))),width:w,height:h,note:''};}
 const mime=sniff(head);
 if(mime){const src=(await readURL(file)).replace(/^data:[^;,]*/,'data:'+mime),im=await loadImage(src,file.name,ext);return{src,width:im.naturalWidth,height:im.naturalHeight,note:''};}
 let bitmap;try{bitmap=await createImageBitmap(file);}catch(e){const url=URL.createObjectURL(file);try{bitmap=await loadImage(url,file.name,ext);}finally{URL.revokeObjectURL(url);}}
 const w=bitmap.width||bitmap.naturalWidth,h=bitmap.height||bitmap.naturalHeight;if(!w||!h||w>10000||h>10000)throw new Error(`${file.name}: images up to 10000 × 10000 px`);
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(bitmap,0,0);bitmap.close?.();
 const blob=await new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error(`${file.name}: conversion failed`)),'image/png'));
 return{src:await readURL(blob),width:w,height:h,note:ext==='gif'?'GIF imported as a still image (first frame).':`${(ext||'image').toUpperCase()} converted to lossless PNG.`};
}
function loadImage(src,name,ext){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`This browser can't read ${ext?ext.toUpperCase()+' ':''}files (${name}). ${/tiff?|heic|heif/.test(ext)?'Open the editor in Safari, or convert it to PNG.':'Convert it to PNG, JPEG, WebP or SVG.'}`));i.src=src;});}
async function importFiles(files,{at,replace}={}){
 files=[...files].filter(f=>f&&(f.type.startsWith('image/')||/\.(svg|png|apng|jpe?g|jfif|webp|gif|avif|bmp|ico|cur|tiff?|heic|heif)$/i.test(f.name)));if(!files.length){toast('Choose an image file');return;}
 if(replace)files=files.slice(0,1);let added=0;const notes=[],failed=[],cols=Math.ceil(Math.sqrt(files.length)),gap=170,start=at||{x:project.width/2,y:project.height/2};
 for(const [i,file] of files.entries()){try{const a=await readAsset(file);if(a.width<=0||a.height<=0||a.width>10000||a.height>10000)throw new Error(`${file.name}: invalid image dimensions`);const key='custom-'+Date.now().toString(36)+i;project.assets[key]={src:a.src,width:a.width,height:a.height};if(a.note)notes.push(a.note);
   if(replace){replace.kind=key;replace.h=Math.round(replace.w*a.height/a.width);}else{const row=Math.floor(i/cols),col=i%cols,rows=Math.ceil(files.length/cols);const n=addElement(key,{x:start.x+(col-(cols-1)/2)*gap,y:start.y+(row-(rows-1)/2)*gap},file.name.replace(/\.[^.]+$/,''));if(!n)break;}added++;}
  catch(e){failed.push(e.message);}}
 if(!added){if(failed.length)toast(failed.join(' · '));return;}tabs.node='layout';refresh();palette();toast((replace?'Image replaced':`${added} image${added>1?'s':''} added`)+(notes.length?' · '+[...new Set(notes)].join(' '):'')+(failed.length?` · Not added: ${failed.join(' · ')}`:''));
}
function pickFiles(done){const input=$('asset-file');input.onchange=()=>{const files=[...input.files];input.value='';done(files);};input.click();}
$('import-asset').onclick=()=>pickFiles(files=>importFiles(files));
const stage=$('stage-scroll');let dragDepth=0;
stage.addEventListener('dragenter',e=>{if(![...e.dataTransfer.types].includes('Files'))return;e.preventDefault();dragDepth++;$('drop-overlay').hidden=false;});
stage.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
stage.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;$('drop-overlay').hidden=true;}});
stage.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;$('drop-overlay').hidden=true;const p=coord(e);importFiles(e.dataTransfer.files,{at:{x:p.x,y:p.y}});});
document.addEventListener('paste',e=>{if(document.body.dataset.currentScreen!=='editor'||e.target.matches?.('input,textarea')||q('dialog[open]'))return;const files=[...e.clipboardData.files];const svg=e.clipboardData.getData('text/plain');
 if(files.length){e.preventDefault();importFiles(files);}else if(/^\s*<svg[\s>]/i.test(svg)){e.preventDefault();importFiles([new File([svg],'Pasted image.svg',{type:'image/svg+xml'})]);}});

/* ---------- Pointer editing ---------- */
function coord(event){const svg=$('canvas'),pt=new DOMPoint(event.clientX,event.clientY);return pt.matrixTransform(svg.getScreenCTM().inverse());}
function snapped(v){return snap?Math.round(v/10)*10:Math.round(v);}
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/l)):0;return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);}
function addPointAt(e,pt){toManual(e);const pts=F.points(project,e);let best=0,dist=Infinity;for(let i=0;i<pts.length-1;i++){const d=segmentDistance(pt,pts[i],pts[i+1]);if(d<dist){dist=d;best=i;}}if(e.waypoints.length>=80){toast('Maximum 80 points per line');return;}e.waypoints.splice(best,0,[snapped(pt.x),snapped(pt.y)]);tabs.edge='route';refresh();}
function doubleTap(e){const now=performance.now(),hit=lastTap&&now-lastTap.t<380&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<8;lastTap=hit?null:{t:now,x:e.clientX,y:e.clientY};return hit;}
$('canvas').addEventListener('pointerdown',e=>{
 if(e.button!==0)return;const dbl=doubleTap(e),handle=e.target.closest('[data-waypoint]'),ng=e.target.closest('[data-node]'),eg=e.target.closest('[data-edge]');
 if(handle){const edge=project.edges.find(x=>x.id===handle.dataset.edgeId),i=Number(handle.dataset.waypoint);if(dbl){edge.waypoints.splice(i,1);refresh();return;}drag={type:'waypoint',id:edge.id,index:i};$('canvas').setPointerCapture(e.pointerId);e.preventDefault();return;}
 if(ng){const id=ng.dataset.node,n=project.nodes.find(x=>x.id===id);
  if(connectMode){if(!connectFrom){connectFrom=id;select('node',id);}else if(connectFrom!==id){if(project.edges.length>=200){toast('Maximum 200 lines');return;}const from=project.nodes.find(n=>n.id===connectFrom);const horizontal=Math.abs(n.x-from.x)>Math.abs(n.y-from.y),sourcePort=horizontal?(n.x>from.x?'right':'left'):(n.y>from.y?'bottom':'top'),targetPort=horizontal?(n.x>from.x?'left':'right'):(n.y>from.y?'top':'bottom');const id2=unique('flow',project.edges),edge=F.edge(id2,connectFrom,id,sourcePort,targetPort);edge.name=`${from.name} → ${n.name}`;edge.auto=true;project.edges.push(edge);connectMode=false;connectFrom=null;selection={type:'edge',id:id2};tabs.edge='motion';refresh();}return;}
  const pt=coord(e);if(selection?.type!=='node'||selection.id!==id)select('node',id);drag={type:'node',id,dx:pt.x-n.x,dy:pt.y-n.y,moved:false};$('canvas').setPointerCapture(e.pointerId);e.preventDefault();
 }else if(eg){const id=eg.dataset.edge;if(dbl&&selection?.type==='edge'&&selection.id===id){addPointAt(project.edges.find(x=>x.id===id),coord(e));return;}if(selection?.type!=='edge'||selection.id!==id)select('edge',id);}
 else if(selection){selection=null;draw();inspect();}
});
$('canvas').addEventListener('pointermove',e=>{if(!drag)return;const p=coord(e);
 if(drag.type==='node'){const n=project.nodes.find(n=>n.id===drag.id),x=snapped(p.x-drag.dx),y=snapped(p.y-drag.dy);if(n.x!==x||n.y!==y){n.x=Math.max(n.w/2,Math.min(project.width-n.w/2,x));n.y=Math.max(n.h/2,Math.min(project.height-n.h/2,y));autoEdges(n);drag.moved=true;}}
 else{const edge=project.edges.find(e=>e.id===drag.id);edge.waypoints[drag.index]=[snapped(p.x),snapped(p.y)];drag.moved=true;}
 draw();
});
function endDrag(){if(!drag)return;const moved=drag.moved;drag=null;if(moved){commit();inspect();}}
$('canvas').addEventListener('pointerup',endDrag);$('canvas').addEventListener('pointercancel',endDrag);

/* ---------- Toolbar, tabs and files ---------- */
$('undo').onclick=undo;$('redo').onclick=redo;$('motion').onclick=()=>{paused=!paused;draw();};$('show-grid').onchange=e=>{grid=e.target.checked;draw();};$('snap').onchange=e=>snap=e.target.checked;$('zoom').onchange=updateZoom;$('zoom-in').onclick=()=>stepZoom(1);$('zoom-out').onclick=()=>stepZoom(-1);
function toggleConnect(){connectMode=!connectMode;connectFrom=null;draw();}
$('connect').onclick=toggleConnect;$('settings').onclick=()=>select(null);
$('project-title').onchange=e=>{project.title=e.target.value.trim()||'Untitled flow';refresh();};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{for(const t of document.querySelectorAll('[data-tab]')){const on=t===b;t.setAttribute('aria-selected',String(on));$('pane-'+t.dataset.tab).hidden=!on;}});
$('apply-preset').onclick=()=>$('confirm-dialog').showModal();$('confirm-layout').onclick=()=>{const oldAssets=project.assets;project=F.preset($('preset').value,window.FLOW_ASSETS);project.assets={...oldAssets,...project.assets};selection=null;connectMode=false;connectFrom=null;refresh();palette();$('confirm-dialog').close();};
function download(content,name,mime){const blob=content instanceof Blob?content:new Blob([content],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);}
function filename(){return(project.title.replace(/[^\p{L}\p{N} _-]/gu,'').trim().replace(/\s+/g,'-')||'energy-flow').slice(0,90);}
function portableProject(){const p=F.clone(project),needed=new Set(p.nodes.map(n=>n.kind));p.assets=Object.fromEntries(Object.entries(p.assets).filter(([k])=>needed.has(k)));return p;}
function saveProject(){download(JSON.stringify(portableProject(),null,2),filename()+'.flow.json','application/json');toast('Editable project saved');}
$('save-project').onclick=saveProject;$('open-project').onclick=()=>$('project-file').click();
$('project-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100*1024*1024)throw new Error('Project limit is 100 MB');const p=F.validate(JSON.parse(await file.text()));project={...p,assets:{...project.assets,...F.clone(BUILTINS),...p.assets}};selection=null;refresh();palette();toast('Project opened');}catch(e){toast(e.message);}finally{$('project-file').value='';}};
$('export-open').onclick=()=>$('export-dialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
async function exported(format,options={}){const p=portableProject();F.validate(p);const bounds=F.bounds(p);if(format!=='project'&&(bounds.minX<-.5||bounds.minY<-.5||bounds.maxX>p.width+.5||bounds.maxY>p.height+.5))throw new Error('Some content is outside the canvas. Use Canvas settings → Fit canvas to content before exporting.');const opts={transparent:options.transparent??$('transparent').checked,time:options.time??Number($('snapshot-time').value),animate:options.animate??true};
 if(format==='project'||format==='flutter')return new Blob([JSON.stringify(p,null,2)],{type:'application/json'});
 if(format==='svg')return new Blob([F.serialize(F.render(p,opts))],{type:'image/svg+xml'});
 if(format==='html')return new Blob([F.standalone(p)],{type:'text/html'});
 if(format==='lottie'){const data=await F.lottie(p,opts);return new Blob([JSON.stringify(data)],{type:'application/json'});}
 if(format==='png'){const scale=options.scale??Number($('png-scale').value),canvas=await F.raster(F.render(p,{...opts,animate:false}),p.width,p.height,scale);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG conversion failed')),'image/png'));}
 throw new Error('Unknown export format');
}
/* A complete widget for the flow_studio Flutter package, using this project's ids and data. */
function flutterCode(file){const dart=v=>"'"+String(v??'').replace(/[\\'$]/g,c=>'\\'+c).replace(/\r?\n/g,'\\n')+"'",num=v=>typeof v==='number'&&Number.isFinite(v)?String(v):dart(v),asset='assets/'+file;
 const words=(project.title.match(/[A-Za-z][A-Za-z0-9]*|[0-9]+/g)||[]).map(w=>w[0].toUpperCase()+w.slice(1));let name=words.join('').replace(/^[0-9]+/,'');name=(name||'EnergyFlow')+'View';
 const pubspec=`dependencies:\n  flow_studio:\n    path: ../flow_studio  # path to packages/flow_studio\n\nflutter:\n  assets:\n    - ${asset}`;
 const updates=[];for(const n of project.nodes){if(n.showLabel===false)continue;const args=[`value: ${num(n.value)}`,`unit: ${dart(n.unit)}`];if(n.status)args.push(`status: ${dart(n.status)}`);if(n.showDetails)args.push(`current: ${num(n.current)}`,`efficiency: ${num(n.efficiency)}`);updates.push(`    flow.setNodeData(${dart(n.id)}, ${args.join(', ')});`);}
 const node=project.nodes.find(n=>n.state!=='active')||project.nodes[0],edge=project.edges.find(e=>e.state!=='active')||project.edges[0];
 if(node||edge)updates.push(``,`    // States: FlowState.active | inactive | hidden`);if(node)updates.push(`    flow.setNodeState(${dart(node.id)}, FlowState.${node.state});`);if(edge)updates.push(`    flow.setFlowState(${dart(edge.id)}, FlowState.${edge.state});`,`    flow.setFlowDirection(${dart(edge.id)}, ${edge.direction}); // 1 or -1`);
 const dartCode=`import 'package:flow_studio/flow_studio.dart';
import 'package:flutter/widgets.dart';

class ${name} extends StatefulWidget {
  const ${name}({super.key});

  @override
  State<${name}> createState() => _${name}State();
}

class _${name}State extends State<${name}> {
  final flow = FlowController.asset(${dart(asset)});

  /// Call with your live readings.${project.edges.length?`\n  /// Line ids: ${project.edges.map(e=>e.id).join(', ')}`:''}
  void update() {
${updates.join('\n')||'    // Add elements in Flow Studio to get their ids here.'}
  }

  @override
  void dispose() {
    flow.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FlowStudioView(controller: flow);
}`;
 return{pubspec,dart:dartCode};}
function showFlutterCode(file){const code=flutterCode(file);$('flutter-pubspec').textContent=code.pubspec;$('flutter-dart').textContent=code.dart;$('export-dialog').close();$('flutter-dialog').showModal();}
document.querySelectorAll('[data-export]').forEach(b=>b.onclick=async()=>{const kind=b.dataset.export;const old=b.innerHTML;b.disabled=true;try{const blob=await exported(kind);const ext={html:'.html',svg:'.svg',png:'.png',lottie:'.lottie.json',project:'.flow.json',flutter:'.flow.json'}[kind];download(blob,filename()+ext);if(kind==='flutter'){showFlutterCode(filename()+ext);return;}toast(kind==='lottie'?'Lottie exported with embedded artwork and labels':kind.toUpperCase()+' exported');}catch(e){toast('Export failed: '+e.message);}finally{b.disabled=false;b.innerHTML=old;}});
function nudge(dx,dy){const n=findSelected();if(!n||selection.type!=='node')return;n.x=Math.max(n.w/2,Math.min(project.width-n.w/2,n.x+dx));n.y=Math.max(n.h/2,Math.min(project.height-n.h/2,n.y+dy));autoEdges(n);draw();clearTimeout(nudgeTimer);nudgeTimer=setTimeout(()=>{commit();inspect();},300);}
document.addEventListener('keydown',e=>{if(document.body.dataset.currentScreen&&document.body.dataset.currentScreen!=='editor')return;if(e.target.matches('input,textarea,select')||q('dialog[open]'))return;const cmd=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
 if(cmd&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();}else if(cmd&&k==='y'){e.preventDefault();redo();}else if(cmd&&k==='d'){e.preventDefault();duplicate();}
 else if(!cmd&&k==='c'){toggleConnect();}
 else if(e.key.startsWith('Arrow')&&selection?.type==='node'){e.preventDefault();const s=e.shiftKey?10:1;nudge(e.key==='ArrowLeft'?-s:e.key==='ArrowRight'?s:0,e.key==='ArrowUp'?-s:e.key==='ArrowDown'?s:0);}
 else if((e.key==='Delete'||e.key==='Backspace')&&selection&&!e.target.closest('button')){e.preventDefault();remove();}else if(e.key==='Escape'){connectMode=false;connectFrom=null;select(null);}});
window.flowStudio={getProject:()=>F.clone(project),setProject(p){const next=F.validate(F.clone(p));project={...next,assets:{...project.assets,...F.clone(BUILTINS),...next.assets}};selection=null;refresh();palette();},setNodeState(id,state){if(!F.STATES.includes(state))throw new Error('Invalid state');const n=project.nodes.find(n=>n.id===id);if(!n)throw new Error('Unknown node');n.state=state;refresh();},setFlowState(id,state){if(!F.STATES.includes(state))throw new Error('Invalid state');const e=project.edges.find(e=>e.id===id);if(!e)throw new Error('Unknown line');e.state=state;refresh();},setNodeData(id,data){const n=project.nodes.find(n=>n.id===id);if(!n)throw new Error('Unknown node');for(const k of ['name','value','unit','current','currentUnit','efficiency','status','showDetails'])if(k in data)n[k]=data[k];refresh();},export:exported,importFiles,select,undo,redo};
palette();draw();inspect();updateHistory();
})();
