/* Flow Viewer: presents saved .flow.json projects with motion, optional demo data and a slideshow. */
(function(){
'use strict';
const F=window.FlowCore,$=id=>document.getElementById(id);
const files=[];/* {name, project} */
let current=-1,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,started=performance.now(),pausedAt=0,liveTimer=null,autoTimer=null,toastTimer=null;

function toast(msg){$('vw-toast').textContent=msg;$('vw-toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('vw-toast').classList.remove('visible'),3200);}
const elapsed=()=>((paused?pausedAt:performance.now())-started)/1000;

/* The project as shown: the viewer's theme/scene choices override the file's. */
function shown(){const f=files[current];if(!f)return null;const p=F.clone(f.project),theme=$('vw-theme').value,scene=$('vw-scene').value;
 if(theme){if(theme==='dark'&&p.theme!=='dark'&&p.background.toLowerCase()==='#ffffff')p.background='#0f1726';if(theme==='light'&&p.theme==='dark'&&p.background.toLowerCase()==='#0f1726')p.background='#ffffff';p.theme=theme;}
 if(scene)p.scene=scene;return p;}

function draw(){const host=$('vw-canvas'),p=shown();$('vw-empty').hidden=!!p;host.hidden=!p;
 $('vw-name').textContent=p?p.title:'لا يوجد ملف';$('vw-meta').textContent=p?`${current+1} / ${files.length} · ${p.width} × ${p.height} · ${p.nodes.length} elements · ${p.edges.length} lines`:'';
 for(const [i,li] of [...$('vw-list').children].entries())li.classList.toggle('active',i===current);
 $('vw-count').textContent=files.length;$('vw-prev').disabled=$('vw-next').disabled=files.length<2;$('vw-png').disabled=!p;
 if(!p){host.replaceChildren();return;}
 const svg=F.render(p,{animate:true});svg.removeAttribute('width');svg.removeAttribute('height');host.replaceChildren(svg);
 /* keep the motion continuous across redraws (live data updates the drawing every few seconds) */
 try{svg.setCurrentTime(elapsed());if(paused)svg.pauseAnimations();}catch(e){/* SMIL timing is optional */}}

function list(){const ul=$('vw-list');ul.replaceChildren();files.forEach((f,i)=>{const li=document.createElement('li'),b=document.createElement('button'),x=document.createElement('button');
 b.className='vw-item';b.innerHTML=`<b></b><small dir="ltr"></small>`;b.firstChild.textContent=f.project.title;b.lastChild.textContent=f.name;b.onclick=()=>show(i);
 x.className='vw-remove';x.textContent='×';x.setAttribute('aria-label',`إزالة ${f.project.title}`);x.onclick=()=>{files.splice(i,1);if(current>=files.length)current=files.length-1;list();draw();};
 li.append(b,x);ul.append(li);});}

function show(i){if(!files.length)return;current=(i+files.length)%files.length;draw();}

function add(name,project){const p=F.validate(F.clone(project));files.push({name,project:p});list();show(files.length-1);}

async function open(fileList){let ok=0;for(const file of fileList){try{if(file.size>100*1024*1024)throw new Error('الحد 100 MB');add(file.name,JSON.parse(await file.text()));ok++;}catch(e){toast(`${file.name}: ${e.message||'ملف غير صالح'}`);}}if(ok)toast(ok===1?'تم فتح الملف':`تم فتح ${ok} ملفات`);}

function demo(){const p=F.preset('villa',window.FLOW_DEMO_ASSETS||{});p.title='فيلا بالطاقة الشمسية · تجريبي';add('demo.flow.json',p);$('vw-live').checked=true;live();}

/* Demo data: values drift, the battery charges or discharges, lights follow the home's load. */
function tick(){const f=files[current];if(!f)return;const p=f.project,rand=(a,b)=>Math.round((a+Math.random()*(b-a))*10)/10;
 for(const n of p.nodes){if(typeof n.value==='number'&&n.showLabel!==false&&n.kind!=='junction'){const base=n.__base??=n.value||rand(1,6);n.value=Math.max(0,rand(base*.7,base*1.3));}
  if(n.soc!=null){n.soc=Math.max(5,Math.min(100,Math.round(Number(n.soc)+(Math.random()<.6?2:-2))));}
  if(p.assets[n.kind]?.lit)n.lit=n.value>0;}
 p.header&&(p.header.updated='Last update '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));draw();}
function live(){clearInterval(liveTimer);liveTimer=$('vw-live').checked?setInterval(()=>{if(!document.hidden)tick();},2500):null;}
function auto(){clearInterval(autoTimer);autoTimer=$('vw-auto').checked?setInterval(()=>show(current+1),Number($('vw-auto-time').value)*1000):null;}

function setPaused(v){if(v===paused)return;if(v)pausedAt=performance.now();else started+=performance.now()-pausedAt;paused=v;const svg=$('vw-canvas').firstElementChild;if(svg)v?svg.pauseAnimations():svg.unpauseAnimations();$('vw-play').textContent=v?'تشغيل الحركة':'إيقاف الحركة';$('vw-play').setAttribute('aria-pressed',String(!v));}

async function png(){const p=shown();if(!p)return;try{const canvas=await F.raster(F.render(p,{animate:false,time:elapsed()}),p.width,p.height,2);canvas.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(p.title.replace(/[^\p{L}\p{N} _-]/gu,'').trim().replace(/\s+/g,'-')||'flow')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),20000);},'image/png');}catch(e){toast('تعذّر حفظ الصورة: '+e.message);}}

function present(){const on=!document.body.classList.contains('presenting');document.body.classList.toggle('presenting',on);if(on)document.documentElement.requestFullscreen?.().catch(()=>{});else if(document.fullscreenElement)document.exitFullscreen?.();}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)document.body.classList.remove('presenting');});

$('vw-open').onclick=$('vw-open2').onclick=()=>$('vw-file').click();
$('vw-file').onchange=e=>{open([...e.target.files]);e.target.value='';};
$('vw-demo').onclick=$('vw-demo2').onclick=demo;
$('vw-prev').onclick=()=>show(current-1);$('vw-next').onclick=()=>show(current+1);
$('vw-play').onclick=()=>setPaused(!paused);$('vw-live').onchange=live;$('vw-auto').onchange=auto;$('vw-auto-time').onchange=auto;
$('vw-theme').onchange=$('vw-scene').onchange=draw;$('vw-png').onclick=png;$('vw-present').onclick=present;
let depth=0;
addEventListener('dragenter',e=>{if(![...e.dataTransfer.types].includes('Files'))return;e.preventDefault();depth++;$('vw-drop').hidden=false;});
addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault();});
addEventListener('dragleave',()=>{if(--depth<=0){depth=0;$('vw-drop').hidden=true;}});
addEventListener('drop',e=>{e.preventDefault();depth=0;$('vw-drop').hidden=true;open([...e.dataTransfer.files].filter(f=>/\.json$/i.test(f.name)||f.type==='application/json'));});
addEventListener('keydown',e=>{if(e.target.matches?.('input,select,textarea'))return;
 if(e.key==='ArrowLeft'){e.preventDefault();show(current+1);}else if(e.key==='ArrowRight'){e.preventDefault();show(current-1);}
 else if(e.key===' '){e.preventDefault();setPaused(!paused);}else if(e.key.toLowerCase()==='f')present();
 else if(e.key==='Escape'&&document.body.classList.contains('presenting'))present();});
setPaused(paused);paused?$('vw-play').textContent='تشغيل الحركة':0;
window.flowViewer={add,open,show,demo,get files(){return files.map(f=>F.clone(f.project));},get current(){return current;}};
draw();
})();
