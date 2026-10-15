/* Flow Studio rendering/export engine. No dependencies. */
(function (global) {
'use strict';
const NS='http://www.w3.org/2000/svg', STATES=['active','inactive','hidden'];
const clone=v=>JSON.parse(JSON.stringify(v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const rnd=v=>Math.round(v*1000)/1000;
function element(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))if(v!==undefined)e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;}
function svgAsset(body,w=100,h=100){return{src:'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(`<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}">${body}</svg>`))),width:w,height:h};}
/* Generator and pump artwork now live in assets.json with the other illustrations. */
const extraAssets={
 junction:svgAsset('<circle cx="50" cy="50" r="25" fill="#6a8bf2"/>')
};
function node(id,kind,name,x,y,w,h,fields={}){return{id,kind,name,x,y,w,h,state:'active',value:0,unit:'kW',current:0,currentUnit:'A',efficiency:100,status:'Online',showDetails:false,labelSide:'bottom',labelGap:12,fontSize:16,color:'#293b55',...fields};}
function edge(id,from,to,sourcePort,targetPort,waypoints=[]){return{id,name:id,from,to,sourcePort,targetPort,waypoints,auto:false,state:'active',color:'#6688ff',trackColor:'#c9d7ff',width:5,trackWidth:2.4,radius:12,duration:3.5,direction:1,route:'orthogonal',sourceOffset:0,targetOffset:0,pulses:1,pulseLength:.12,glow:.13,trackStyle:'solid'};}
function preset(kind,assets={}){
 const p={format:'flow-studio',version:1,title:'Hybrid energy flow',width:1000,height:650,background:'#ffffff',nodes:[],edges:[],assets:{...clone(assets),...clone(extraAssets)}};
 if(kind==='blank'){p.title='Untitled flow';return p;}
 /* A house whose parts sit in its slots (see the editor's attachable parts). */
 if(kind==='house-parts'){const a=p.assets['house-site'];if(!a?.slots)return p;p.title='Home with roof solar & yard parts';
  const host=node('home','house-site','Home',455,330,610,a.height*610/a.width,{value:3,status:'Home load',labelGap:4});p.nodes=[host];
  const k=host.w/a.width,iw=a.width*k,ih=a.height*k,left=host.x-iw/2,top=host.y-ih/2,r=v=>Math.round(v*100)/100;
  const spec={roof:['solar','Roof solar','top',6.4,'Rooftop PV'],wall:['inverter','Wall inverter','right',5.9,'Online'],battery:['battery','Battery','bottom',3.2,'Charging'],pole:['grid','Utility pole','right',1.2,'Grid']};
  for(const [slot,[id,name,side,value,status]] of Object.entries(spec)){const sl=a.slots[slot],n=node(id,sl.kind,name,r(left+(sl.x+sl.w/2)*iw),r(top+(sl.y+sl.h/2)*ih),r(sl.w*iw),r(sl.h*ih),{value,status,labelSide:side,fontSize:13});
   n.labelGap=Math.max(4,Math.round({left:n.x-n.w/2-left,right:left+iw-(n.x+n.w/2),top:n.y-n.h/2-top,bottom:top+ih-(n.y+n.h/2)}[side]+10));n.attach={to:'home',slot,autoLabel:true};p.nodes.push(n);}
  /* lines follow the cable paths stored on the house: ends become anchors, the middle becomes waypoints */
  const at=([x,y])=>[r(left+x*iw),r(top+y*ih)],byId=id=>p.nodes.find(n=>n.id===id);
  const link=(id,from,to,sp,tp,key)=>{const e=Object.assign(edge(id,from,to,sp,tp),{onTop:true,route:'orthogonal',radius:3,width:3.5,trackWidth:2,pulses:2,pulseLength:.18,glow:.18,cable:{host:'home',link:key}}),pts=a.cables[key].map(at),A=byId(from),B=byId(to);
   e.sourceAnchor=[r(pts[0][0]-A.x),r(pts[0][1]-A.y)];e.targetAnchor=[r(pts.at(-1)[0]-B.x),r(pts.at(-1)[1]-B.y)];e.waypoints=pts.slice(1,-1);return e;};
  p.edges=[link('solar','solar','inverter','right','top','roof>wall'),link('battery','inverter','battery','bottom','top','wall>battery'),link('grid','inverter','grid','right','bottom','wall>pole')];
  /* dashboard look: header, battery level, status badges, import colour and callout labels */
  p.header={title:'My Home',status:'Online',statusTone:'green',weather:'sun',temperature:'29°C',updated:'Last update 12:40'};p.scene='day';
  Object.assign(byId('battery'),{soc:48,badge:'Charging',badgeTone:'green'});Object.assign(byId('grid'),{badge:'Importing',badgeTone:'amber'});Object.assign(byId('solar'),{badge:'Producing',badgeTone:'blue'});
  Object.assign(p.edges[2],{color:'#f2a541',trackColor:'#f6dcb4'});Object.assign(p.edges[1],{color:'#2fb07a',trackColor:'#bfe8d4'});
  host.y=360;for(const n of p.nodes.slice(1)){n.y+=30;}for(const e of p.edges)e.waypoints=e.waypoints.map(q=>[q[0],q[1]+30]);
  return arrangeCallouts(p,'home');}
 /* Building presets: a site connected to an inverter, storage or backup, and the utility pole. */
 if(kind==='home-system'||kind==='school'||kind==='factory'){
  const site={'home-system':['solar-home','Solar home',300,240,300,232,{value:6.4,status:'Rooftop PV'}],school:['school','School',300,250,340,242,{value:18.5,status:'Rooftop + canopy PV'}],factory:['factory','Factory',300,255,360,253,{value:42,status:'Rooftop PV'}]}[kind];
  p.title={'home-system':'Solar home system',school:'School solar system',factory:'Factory with generator backup'}[kind];
  const backup=kind==='factory'?node('generator','generator','Generator',705,480,112,115,{state:'inactive',value:0,status:'Standby'}):node('battery','battery','Battery',705,480,80,110,{value:kind==='school'?12:3.2,status:'Charging'});
  p.nodes=[node('site',site[0],site[1],site[2],site[3],site[4],site[5],{...site[6],labelGap:6}),node('inverter','resc-inverter','RESC inverter',705,265,120,106,{value:kind==='factory'?38:kind==='school'?16.8:5.9,efficiency:97,labelSide:'top',labelGap:6}),backup,node('grid','utility-pole','Utility pole',895,265,90,157,{value:kind==='factory'?4:1.2,status:'Grid',labelGap:6})];
  const lines=[edge('site','site','inverter','right','left'),edge(backup.id,'inverter',backup.id,'bottom','top'),edge('grid','inverter','grid','right','left')];
  lines.forEach(e=>e.auto=true);if(kind==='factory'){lines[1].state='inactive';}p.edges=lines;return p;
 }
 if(kind==='pump'){
  p.title='Solar pump flow';p.nodes=[node('solar','solar','Solar panels',175,180,210,135,{value:6.8,efficiency:92}),node('inverter','inverter','Pump inverter',485,220,150,118,{value:6.2,efficiency:96}),node('pump','pump','Water pump',820,260,150,150,{value:5.9,unit:'kW',status:'Running',current:12.3})];
  p.edges=[edge('solar-inverter','solar','inverter','right','left'),edge('inverter-pump','inverter','pump','right','left')];p.edges.forEach(e=>e.auto=true);return p;
 }
 p.nodes=[node('solar','solar','Solar array',285,100,210,135,{value:7.2,labelSide:'right',labelGap:30,status:'PV available'}),node('battery','battery','Battery',100,270,98,135,{value:2.1,status:'Charging'}),node('inverter','inverter','Hybrid inverter',340,315,150,118,{value:5.1,efficiency:96.8}),node('grid','grid','Grid backup',550,525,90,142,{state:'inactive',value:0,status:'',labelGap:0,fontSize:14}),node('home','home','Load',840,265,172,111,{value:3,status:'',labelGap:23}),node('junction','junction','Junction',610,315,8,8,{showLabel:false,status:''})];
 p.edges=[edge('solar','solar','inverter','bottom','top',[[285,228],[340,228]]),edge('battery','battery','inverter','right','left',[[224,270],[224,315]]),edge('inverter','inverter','junction','right','center'),edge('home','junction','home','center','left',[[702,315],[702,265]]),edge('grid','grid','junction','top','center',[[550,382],[610,382]])];
 p.edges[1].direction=-1;p.edges[4].state='inactive';if(kind==='generator'){p.title='Hybrid inverter with generator backup';const n=p.nodes.find(n=>n.id==='grid');n.kind='generator';n.name='Generator backup';n.w=112;n.h=112;n.y=510;}return p;
}
function port(n,p){return p==='left'?[n.x-n.w/2,n.y]:p==='right'?[n.x+n.w/2,n.y]:p==='top'?[n.x,n.y-n.h/2]:p==='bottom'?[n.x,n.y+n.h/2]:[n.x,n.y];}
const direction=p=>({left:[-1,0],right:[1,0],top:[0,-1],bottom:[0,1],center:[0,0]}[p]||[0,0]);
/* A line's port point, shifted along its side by sourceOffset/targetOffset. */
function edgePort(n,p,off){const q=port(n,p),o=num(off);return p==='left'||p==='right'?[q[0],q[1]+o]:p==='top'||p==='bottom'?[q[0]+o,q[1]]:q;}
/* Optional line styling with the defaults older files render with. */
function look(e){return{route:e.route||'orthogonal',pulses:e.pulses??1,pulseLength:e.pulseLength??.12,glow:e.glow??.13,trackStyle:e.trackStyle||'solid'};}
function points(p,e){const a=p.nodes.find(n=>n.id===e.from),b=p.nodes.find(n=>n.id===e.to);if(!a||!b)return[];/* An anchor ([dx,dy] from the element's centre) pins an end to an exact point, e.g. a cable entry. */const s=e.sourceAnchor?[a.x+e.sourceAnchor[0],a.y+e.sourceAnchor[1]]:edgePort(a,e.sourcePort,e.sourceOffset),t=e.targetAnchor?[b.x+e.targetAnchor[0],b.y+e.targetAnchor[1]]:edgePort(b,e.targetPort,e.targetOffset);
 if(!e.auto)return[s,...e.waypoints.map(v=>[num(v[0]),num(v[1])]),t];if(look(e).route!=='orthogonal')return[s,t];
 const d1=direction(e.sourcePort),d2=direction(e.targetPort),s1=[s[0]+d1[0]*30,s[1]+d1[1]*30],t1=[t[0]+d2[0]*30,t[1]+d2[1]*30];let mid=[];
 if(d1[0]&&d2[0]){const x=(s1[0]+t1[0])/2;mid=[[x,s1[1]],[x,t1[1]]];}
 else if(d1[1]&&d2[1]){const y=(s1[1]+t1[1])/2;mid=[[s1[0],y],[t1[0],y]];}
 else mid=d1[1]?[[s1[0],t1[1]]]:[[t1[0],s1[1]]];
 return[s,s1,...mid,t1,t].filter((v,i,a)=>!i||Math.hypot(v[0]-a[i-1][0],v[1]-a[i-1][1])>.01);
}
/* Identical cubic Bézier vertices drive the editor, SVG, PNG and Flutter. */
function geometry(pts,radius){const clean=pts.filter((p,i,a)=>!i||Math.hypot(p[0]-a[i-1][0],p[1]-a[i-1][1])>.01);const sh={v:[],i:[],o:[],c:false};
 const push=p=>{sh.v.push(p.map(rnd));sh.i.push([0,0]);sh.o.push([0,0]);return sh.v.length-1;};
 if(!clean.length)return sh;push(clean[0]);
 for(let j=1;j<clean.length-1;j++){
  const a=clean[j-1],b=clean[j],c=clean[j+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]);const u=[(b[0]-a[0])/l1,(b[1]-a[1])/l1],v=[(c[0]-b[0])/l2,(c[1]-b[1])/l2];
  const dot=u[0]*v[0]+u[1]*v[1];if(Math.abs(dot)>.9999||radius<=0){push(b);continue;}
  const angle=Math.acos(Math.max(-1,Math.min(1,dot))),tangent=Math.tan(angle/2);const cut=Math.min(radius*tangent,l1/2,l2/2);const k=(4/3)*Math.tan(angle/4)*(cut/tangent);
  const p1=[b[0]-u[0]*cut,b[1]-u[1]*cut],p2=[b[0]+v[0]*cut,b[1]+v[1]*cut],n1=push(p1),n2=push(p2);sh.o[n1]=u.map(x=>rnd(x*k));sh.i[n2]=v.map(x=>rnd(-x*k));
 }
 if(clean.length>1)push(clean.at(-1));return sh;
}
/* Smooth curve through pts: port-directed ends, Catmull-Rom interior tangents. Same {v,i,o} shape as geometry(). */
function curve(pts,d1,d2){const P=pts.filter((p,i,a)=>!i||Math.hypot(p[0]-a[i-1][0],p[1]-a[i-1][1])>.01),sh={v:P.map(p=>p.map(rnd)),i:P.map(()=>[0,0]),o:P.map(()=>[0,0]),c:false},n=P.length-1;if(n<1)return sh;
 const dist=(a,b)=>Math.sqrt((b[0]-a[0])**2+(b[1]-a[1])**2),sub=(a,b,f)=>[(a[0]-b[0])/f,(a[1]-b[1])/f],on=d=>d[0]!==0||d[1]!==0,sc=(d,k)=>[d[0]*k,d[1]*k];let o0,i1;
 if(n===1){const k=Math.max(30,dist(P[0],P[1])*.4);o0=on(d1)?sc(d1,k):sub(P[1],P[0],3);i1=on(d2)?sc(d2,k):sub(P[0],P[1],3);}
 else{o0=on(d1)?sc(d1,dist(P[0],P[1])/3):sub(P[1],P[0],3);i1=on(d2)?sc(d2,dist(P[n-1],P[n])/3):sub(P[n-1],P[n],3);for(let j=1;j<n;j++){const T=sub(P[j+1],P[j-1],6);sh.o[j]=T.map(rnd);sh.i[j]=T.map(x=>rnd(-x));}}
 sh.o[0]=o0.map(rnd);sh.i[n]=i1.map(rnd);return sh;
}
/* The drawn shape of a line: the one entry point for render and bounds. */
function shape(p,e){const pts=points(p,e);return look(e).route==='curved'?curve(pts,direction(e.sourcePort),direction(e.targetPort)):geometry(pts,e.radius);}
/* Track dash pattern per trackStyle (null = solid) and the [dash,gap] of the moving pulses for a path length. */
function trackDash(e){const w=e.trackWidth,s=look(e).trackStyle;return s==='dashed'?[rnd(w*4),rnd(w*3)]:s==='dotted'?[.001,rnd(w*2.5)]:null;}
function pulseDash(len,e){const l=look(e),period=len/l.pulses;return[period*l.pulseLength,period*(1-l.pulseLength)];}
function pathData(sh){if(!sh.v.length)return'';let d=`M${sh.v[0].join(' ')}`;for(let j=1;j<sh.v.length;j++){const a=sh.v[j-1],b=sh.v[j],o=sh.o[j-1],i=sh.i[j];if(o.some(Boolean)||i.some(Boolean))d+=`C${rnd(a[0]+o[0])} ${rnd(a[1]+o[1])} ${rnd(b[0]+i[0])} ${rnd(b[1]+i[1])} ${b.join(' ')}`;else d+=`L${b.join(' ')}`;}return d+(sh.c?'Z':'');}
function opacity(state){return state==='hidden'?0:state==='inactive'?.35:1;}
/* ---------- Labels: theme colours, status badge, battery level and callouts ---------- */
const TONES={green:['#e3f6ec','#23845a','#1b3b2e','#72d7a7'],blue:['#e5efff','#2f63d6','#1c2c4f','#8fb1ff'],amber:['#fff2dc','#b26a12','#3d2f17','#f5c06d'],red:['#ffe7e4','#c4473a','#43221f','#f39a8f'],gray:['#eef1f5','#5e6b7e','#263246','#a9b6c9']};
function theme(p){const dark=p?.theme==='dark';return{dark,name:dark?'#a9b6c9':'#566981',status:dark?'#8e9bb0':'#8594a8',value:c=>dark&&String(c).toLowerCase()==='#293b55'?'#f2f5fa':c,leader:dark?'#5d6b82':'#a3afc0',track:dark?'#2a3850':'#e3e8ef',tile:dark?['#1f2b40','#18233a','#121b2e']:['#f4f6fa','#dfe4ec','#cfd6e0']};}
const socColor=v=>v>=50?'#34b37a':v>=20?'#e9a23b':'#e0574a';
const hasSoc=n=>Number.isFinite(Number(n.soc))&&n.soc!==null&&n.soc!=='';
/* Each line: {kind:'text'|'badge'|'soc', h (block height), …}; lines are stacked with a 9px gap. */
function labelLines(n,p){if(n.showLabel===false)return[];const t=theme(p),soc=hasSoc(n)?Math.max(0,Math.min(100,Number(n.soc))):null;
 const text=(s,size,weight,color)=>({kind:'text',text:s,size,weight,color,h:size});
 const lines=[text(soc===null?n.name:`${n.name}  ${Math.round(soc)}%`,n.fontSize,600,t.name),text(`${n.value} ${n.unit}`.trim(),n.fontSize+6,700,t.value(n.color))];
 if(soc!==null)lines.push({kind:'soc',value:soc,color:socColor(soc),track:t.track,h:6,w:64});
 if(n.status)lines.push(text(n.status,n.fontSize-3,400,t.status));if(n.showDetails)lines.push(text(`${n.current} ${n.currentUnit}  ·  ${n.efficiency}%`,n.fontSize-4,400,t.status));
 if(n.badge){const size=Math.max(9,n.fontSize-4),tone=TONES[n.badgeTone]||TONES.gray;lines.push({kind:'badge',text:String(n.badge),size,weight:600,bg:t.dark?tone[2]:tone[0],color:t.dark?tone[3]:tone[1],h:size+9});}
 return lines;}
let measureCtx;
function textWidth(text,size,weight){measureCtx=measureCtx||document.createElement('canvas').getContext('2d');measureCtx.font=`${weight} ${size}px Arial`;return measureCtx.measureText(text).width;}
function lineWidth(l){return l.kind==='soc'?l.w:l.kind==='badge'?textWidth(l.text,l.size,l.weight)+18:textWidth(l.text,l.size,l.weight)+4;}
/* Box of the whole label, its text anchor, and (for callouts) the leader line points. */
function labelBox(n,p){const lines=labelLines(n,p);let width=Math.max(40,...lines.map(lineWidth));const height=lines.length?lines.reduce((s,l)=>s+l.h+9,0)-2:4;
 if(n.callout){const x=n.x+num(n.callout.dx),y=n.y+num(n.callout.dy),tx=n.x+num(n.calloutTarget?.[0]),ty=n.y+num(n.calloutTarget?.[1]),lx=tx>x+width?x+width+7:x-7;
  /* the leader runs down (or up) the label's left edge, then across to the element */
  const below=ty>y+height/2,start=[lx,below?y+2:y+height-2],turn=[lx,ty],leader=Math.abs(tx-lx)<1?[start,[tx,ty]]:[start,turn,[tx,ty]];
  return{x,y,width,height,lines,anchor:'start',leader};}
 const side=n.labelSide||'bottom';let x=n.x-width/2,y=n.y+n.h/2+num(n.labelGap,12);if(side==='right'){x=n.x+n.w/2+n.labelGap;y=n.y-height/2;}if(side==='left'){x=n.x-n.w/2-n.labelGap-width;y=n.y-height/2;}if(side==='top')y=n.y-n.h/2-n.labelGap-height;
 return{x,y,width,height,lines,anchor:side==='left'||side==='right'?'start':'middle'};}
function labels(n,p,opt={}){const b=labelBox(n,p),g=element('g',{'data-label':n.id});if(n.callout)g.setAttribute('data-callout',n.id);
 if(b.leader&&opt.leader!==false){const t=theme(p);g.append(element('path',{d:'M'+b.leader.map(q=>q.join(' ')).join('L'),fill:'none',stroke:t.leader,'stroke-width':1.2,'stroke-dasharray':'2 3','stroke-linecap':'round'}));const end=b.leader.at(-1);g.append(element('circle',{cx:end[0],cy:end[1],r:2.6,fill:t.leader}));}
 const mid=b.anchor==='middle',ax=mid?n.x:b.x;let y=b.y;
 for(const l of b.lines){
  if(l.kind==='text')g.append(element('text',{x:ax,y:y+l.size,'text-anchor':mid?'middle':'start','font-family':'Arial, sans-serif','font-size':l.size,'font-weight':l.weight,fill:l.color},l.text));
  else if(l.kind==='soc'){const x0=mid?ax-l.w/2:ax;g.append(element('rect',{x:x0,y,width:l.w,height:l.h,rx:l.h/2,fill:l.track}),element('rect',{x:x0,y,width:Math.max(l.h,l.w*l.value/100),height:l.h,rx:l.h/2,fill:l.color}));}
  else{const w=lineWidth(l),x0=mid?ax-w/2:ax;g.append(element('rect',{x:x0,y,width:w,height:l.h,rx:l.h/2,fill:l.bg}),element('text',{x:x0+w/2,y:y+l.h/2+l.size*.36,'text-anchor':'middle','font-family':'Arial, sans-serif','font-size':l.size,'font-weight':l.weight,fill:l.color},l.text));}
  y+=l.h+9;}
 return g;}
function lengthOf(d){const path=element('path',{d});return path.getTotalLength();}
/* Dashboard-style labels for a host and its attached parts: two columns beside the host image,
   each label joined to its part by a leader. Parts on the host's right half go to the right column. */
function arrangeCallouts(p,hostId){const host=p.nodes.find(n=>n.id===hostId),a=host&&p.assets[host.kind];if(!a)return p;
 const k=Math.min(host.w/a.width,host.h/a.height),iw=a.width*k,ih=a.height*k,left=host.x-iw/2,top=host.y-ih/2,items=[host,...p.nodes.filter(n=>n.attach?.to===hostId&&n.state!=='hidden'&&n.showLabel!==false)];
 const cols={left:[],right:[]};for(const n of items)cols[n===host||n.x<host.x+iw*.1?'left':'right'].push(n);
 for(const [side,list] of Object.entries(cols)){list.sort((m,n)=>m.y-n.y);let y=top+ih*.06;
  for(const n of list){n.callout={dx:0,dy:0};delete n.calloutTarget;const b=labelBox(n,p),x=side==='left'?Math.max(14,left-b.width-26):left+iw+26;
   y=Math.max(y,Math.min(n.y-b.height/2,top+ih-b.height));n.callout={dx:Math.round(x-n.x),dy:Math.round(y-n.y)};y+=b.height+22;}}
 return p;}
/* ---------- Scene backgrounds, element tiles and the dashboard header ---------- */
/* Sky gradients per theme, so light (or dark) labels stay readable on every scene. */
const SCENES={day:['#cfe0f5','#f5f8fc'],dusk:['#f3c9b1','#fbefe7'],night:['#0d1628','#24324b'],rain:['#8f9db0','#d6dce4']},DARK_SCENES={day:['#16263f','#2b3f5e'],dusk:['#271f36','#47364f'],night:['#0d1628','#24324b'],rain:['#162133','#2c394f']};
/* Deterministic rain streaks: [x, y, length] in canvas units. */
function rainDrops(p){let s=7;const r=()=>(s=(s*1103515245+12345)%2147483648)/2147483648,out=[];const n=Math.round(p.width*p.height/9000);for(let i=0;i<n;i++)out.push([r()*p.width*1.1,r()*p.height,10+r()*14]);return out;}
function sceneLayer(p,options={}){const g=element('g',{'data-layer':'scene','pointer-events':'none'}),sky=(p.theme==='dark'?DARK_SCENES:SCENES)[p.scene];if(!sky)return null;
 const id=`flow-sky-${p.theme==='dark'?'dark-':''}${p.scene}`,defs=element('defs'),lg=element('linearGradient',{id,x1:0,y1:0,x2:0,y2:1});lg.append(element('stop',{offset:0,'stop-color':sky[0]}),element('stop',{offset:1,'stop-color':sky[1]}));defs.append(lg);g.append(defs,element('rect',{width:p.width,height:p.height,fill:`url(#${id})`}));
 if(p.scene==='night')for(const [x,y,l] of rainDrops(p).slice(0,40))g.append(element('circle',{cx:x%p.width,cy:y*.45,r:l>20?1.1:.7,fill:'#ffffff',opacity:.55}));
 if(p.scene==='rain'){const drops=element('g',{stroke:'#ffffff','stroke-width':1.1,'stroke-linecap':'round',opacity:.55});const fall=p.height*.25,t=(options.time||0)%1;
  for(const [x,y,l] of rainDrops(p)){for(const k of [0,1]){const yy=((y+t*fall)%p.height)-k*p.height;drops.append(element('line',{x1:x,y1:yy,x2:x-l*.25,y2:yy+l}));}}
  if(options.animate!==false)drops.append(element('animateTransform',{attributeName:'transform',type:'translate',from:'0 0',to:`0 ${fall}`,dur:'1s',repeatCount:'indefinite'}));g.append(drops);}
 return g;}
/* Isometric platform under an element, sized to its box and resting on its bottom edge. */
function tilePoints(n){const tw=n.w*1.18,q=tw/4,th=Math.max(3,tw*.045),cx=n.x,cy=n.y+n.h/2-q-th;return{top:[[cx-tw/2,cy],[cx,cy-q],[cx+tw/2,cy],[cx,cy+q]],left:[[cx-tw/2,cy],[cx,cy+q],[cx,cy+q+th],[cx-tw/2,cy+th]],right:[[cx,cy+q],[cx+tw/2,cy],[cx+tw/2,cy+th],[cx,cy+q+th]]};}
function tile(n,p){const t=theme(p).tile,pts=tilePoints(n),g=element('g',{'data-tile':n.id}),d=a=>'M'+a.map(q=>q.join(' ')).join('L')+'Z';
 g.append(element('path',{d:d(pts.left),fill:t[1]}),element('path',{d:d(pts.right),fill:t[2]}),element('path',{d:d(pts.top),fill:t[0],stroke:theme(p).dark?'#2c3a54':'#e6ebf2','stroke-width':1}));return g;}
const WEATHER={sun:'M0-11v4M0 7v4M-11 0h4M7 0h4M-7.8-7.8l2.8 2.8M5 5l2.8 2.8M-7.8 7.8L-5 5M5-5l2.8-2.8',cloud:'M-9 5h17a5 5 0 0 0 0-10a7 7 0 0 0-13-1a5 5 0 0 0-4 11z',moon:'M3-9a9 9 0 1 0 6 15a7 7 0 0 1-6-15z'};
function weatherIcon(kind,x,y,dark){const g=element('g',{transform:`translate(${x} ${y})`});
 if(kind==='sun'){g.append(element('circle',{r:5,fill:'#f5b638'}),element('path',{d:WEATHER.sun,stroke:'#f5b638','stroke-width':1.8,'stroke-linecap':'round'}));}
 else if(kind==='night')g.append(element('path',{d:WEATHER.moon,fill:'#f3d27a'}));
 else{g.append(element('path',{d:WEATHER.cloud,fill:dark?'#9fb0c8':'#b8c4d4'}));if(kind==='rain')for(const dx of [-5,0,5])g.append(element('path',{d:`M${dx} 8l-1.5 4`,stroke:'#5f9ad8','stroke-width':1.6,'stroke-linecap':'round'}));}
 return g;}
/* Top bar: title + status pill on the left, weather + temperature on the right, last update below the title. */
function header(p){const h=p.header;if(!h||(!h.title&&!h.status&&!h.weather&&!h.temperature&&!h.updated))return null;const t=theme(p),g=element('g',{'data-layer':'header','font-family':'Arial, sans-serif'});let x=20;
 if(h.title){g.append(element('text',{x,y:36,'font-size':19,'font-weight':700,fill:t.dark?'#f2f5fa':'#1d2c44'},h.title));x+=textWidth(h.title,19,700)+12;}
 if(h.status){const tone=TONES[h.statusTone]||TONES.green,w=textWidth(h.status,12,700)+30;g.append(element('rect',{x,y:19,width:w,height:24,rx:12,fill:t.dark?tone[2]:tone[0]}),element('circle',{cx:x+12,cy:31,r:3.5,fill:t.dark?tone[3]:tone[1]}),element('text',{x:x+21,y:35.5,'font-size':12,'font-weight':700,fill:t.dark?tone[3]:tone[1]},h.status));}
 if(h.updated)g.append(element('text',{x:20,y:60,'font-size':11,fill:t.status},h.updated));
 let rx=p.width-20;if(h.temperature){const w=textWidth(h.temperature,16,700);g.append(element('text',{x:rx-w,y:37,'font-size':16,'font-weight':700,fill:t.dark?'#f2f5fa':'#1d2c44'},h.temperature));rx-=w+22;}
 if(['sun','cloud','rain','night'].includes(h.weather))g.append(weatherIcon(h.weather,rx,31,t.dark));
 return g;}
function render(p,options={}){
 /* labels are laid out left-to-right even inside right-to-left pages */const svg=element('svg',{xmlns:NS,width:p.width,height:p.height,viewBox:`0 0 ${p.width} ${p.height}`,role:'img','aria-label':p.title,direction:'ltr'});svg.append(element('title',{},p.title));
 if(!options.transparent){svg.append(element('rect',{width:p.width,height:p.height,fill:p.background}));const scene=sceneLayer(p,options);if(scene)svg.append(scene);}
 if(options.grid){const defs=element('defs'),pat=element('pattern',{id:'editor-grid',width:20,height:20,patternUnits:'userSpaceOnUse'});pat.append(element('circle',{cx:1,cy:1,r:.7,fill:'#d1dbea'}));defs.append(pat);svg.append(defs,element('rect',{width:p.width,height:p.height,fill:'url(#editor-grid)','pointer-events':'none'}));}
 const flowLayer=element('g',{'data-layer':'flows'}),nodeLayer=element('g',{'data-layer':'nodes'}),topLayer=element('g',{'data-layer':'flows-above'});svg.append(flowLayer,nodeLayer,topLayer);
 for(const e of p.edges){const sh=shape(p,e),d=pathData(sh),l=look(e),td=trackDash(e);if(!d)continue;const len=Math.max(1,lengthOf(d));const g=element('g',{'data-edge':e.id,opacity:e.state==='hidden'?0:1,'pointer-events':e.state==='hidden'?'none':undefined});
  if(options.editable){g.append(element('path',{d,stroke:'transparent','stroke-width':20,fill:'none', 'pointer-events':'stroke'}));}
  const track=element('path',{d,fill:'none',stroke:e.trackColor,'stroke-width':e.trackWidth,'stroke-linecap':'round','stroke-linejoin':'round',opacity:e.state==='inactive'?.3:.85,'stroke-dasharray':td?td.join(' '):undefined});g.append(track);
  if(e.state==='active'){const[dash,gap]=pulseDash(len,e);for(const glow of l.glow>0?[true,false]:[false]){const path=element('path',{d,fill:'none',stroke:e.color,'stroke-width':glow?e.width*2.8:e.width,'stroke-linecap':'round','stroke-linejoin':'round',opacity:glow?l.glow:.95,'stroke-dasharray':`${dash} ${gap}`,'stroke-dashoffset':-len*e.direction*((options.time||0)%e.duration)/e.duration});
   if(options.animate!==false){path.append(element('animate',{attributeName:'stroke-dashoffset',from:0,to:-len*e.direction,dur:`${e.duration}s`,repeatCount:'indefinite'}));}g.append(path);
  }}
  if(options.selection?.type==='edge'&&options.selection.id===e.id){g.append(element('path',{d,fill:'none',stroke:'#3265ef','stroke-width':1,'stroke-dasharray':'4 4','pointer-events':'none'}));/* Route handles are drawn by the editor. */}
  (e.onTop?topLayer:flowLayer).append(g);
 }
 for(const n of p.nodes){const g=element('g',{'data-node':n.id,opacity:opacity(n.state),'pointer-events':n.state==='hidden'?'none':undefined}),a=p.assets[n.kind];
  if(n.tile)g.append(tile(n,p));
  if(a){g.append(element('image',{x:n.x-n.w/2,y:n.y-n.h/2,width:n.w,height:n.h,href:a.src,preserveAspectRatio:'xMidYMid meet'}));
   /* lights-on overlay: same size as the artwork, drawn over it */
   if(n.lit&&a.lit?.src)g.append(element('image',{x:n.x-n.w/2,y:n.y-n.h/2,width:n.w,height:n.h,href:a.lit.src,preserveAspectRatio:'xMidYMid meet','data-lit':''}));}
  else g.append(element('rect',{x:n.x-n.w/2,y:n.y-n.h/2,width:n.w,height:n.h,rx:8,fill:'#e5ebf5'}));
  g.append(labels(n,p));
  if(options.editable&&n.callout){const b=labelBox(n,p);const hit=element('rect',{x:b.x-10,y:b.y-4,width:b.width+14,height:b.height+8,fill:'transparent','data-callout-hit':n.id,cursor:'move'});g.querySelector('[data-label]').prepend(hit);}
  if(options.editable){const b=n.callout?{lines:[]}:labelBox(n,p);g.append(element('rect',{x:Math.min(n.x-n.w/2,b.lines.length?b.x:n.x-n.w/2),y:Math.min(n.y-n.h/2,b.lines.length?b.y:n.y-n.h/2),width:Math.max(n.x+n.w/2,b.lines.length?b.x+b.width:n.x+n.w/2)-Math.min(n.x-n.w/2,b.lines.length?b.x:n.x-n.w/2),height:Math.max(n.y+n.h/2,b.lines.length?b.y+b.height:n.y+n.h/2)-Math.min(n.y-n.h/2,b.lines.length?b.y:n.y-n.h/2),fill:'transparent'}));}
  if(options.selection?.type==='node'&&options.selection.id===n.id){g.append(element('rect',{x:n.x-n.w/2-6,y:n.y-n.h/2-6,width:n.w+12,height:n.h+12,rx:8,fill:'none',stroke:'#6488ef','stroke-width':1.5,'stroke-dasharray':'5 4','pointer-events':'none'}));/* Connection ports are drawn by the editor as interactive handles. */}
  nodeLayer.append(g);
 }
 const top=header(p);if(top)svg.append(top);
 return svg;
}
function serialize(svg){return new XMLSerializer().serializeToString(svg);}
function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not render an embedded image'));im.src=src;});}
async function raster(svg,w,h,scale=1){const c=document.createElement('canvas');c.width=Math.ceil(w*scale);c.height=Math.ceil(h*scale);const ctx=c.getContext('2d'),url=URL.createObjectURL(new Blob([serialize(svg)],{type:'image/svg+xml'}));try{const im=await image(url);ctx.drawImage(im,0,0,c.width,c.height);return c;}finally{URL.revokeObjectURL(url);}}
function dataScript(v){return JSON.stringify(v).replace(/</g,'\\u003c');}
function standalone(p){return`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)}</title><style>body{margin:0;background:${p.background};font-family:Arial,sans-serif}#flow{width:100%;max-width:${p.width}px;margin:auto}#flow svg{width:100%;height:auto;display:block}body.paused svg{visibility:visible}</style></head><body><div id="flow"></div><script>${standalone.coreSource||''}<\/script><script>const project=${dataScript(p)}; const host=document.getElementById('flow');let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;function draw(){host.replaceChildren(FlowCore.render(project,{animate:!paused}));}function find(list,id){const item=list.find(x=>x.id===id);if(!item)throw new Error('Unknown id: '+id);return item;}window.energyFlow={getProject:()=>FlowCore.clone(project),setNodeState(id,state){if(!FlowCore.STATES.includes(state))throw new Error('Invalid state');find(project.nodes,id).state=state;draw();},setFlowState(id,state){if(!FlowCore.STATES.includes(state))throw new Error('Invalid state');find(project.edges,id).state=state;draw();},setNodeData(id,data){const n=find(project.nodes,id);for(const k of ['name','value','unit','current','currentUnit','efficiency','status','showDetails','soc','badge','badgeTone','lit'])if(k in data)n[k]=data[k];if(data.badge===null||data.badge==='')delete n.badge;if(data.soc===null)delete n.soc;draw();},setFlowDirection(id,direction){if(direction!==1&&direction!==-1)throw new Error('Direction must be 1 or -1');find(project.edges,id).direction=direction;draw();},setFlowColor(id,color,trackColor){const e=find(project.edges,id),hex=/^#[\da-f]{6}$/i;if(!hex.test(color)||(trackColor&&!hex.test(trackColor)))throw new Error('Use #rrggbb colors');e.color=color;if(trackColor)e.trackColor=trackColor;draw();},setHeader(data){project.header={...(project.header||{}),...data};draw();},setScene(scene){if(!['none','day','dusk','night','rain'].includes(scene))throw new Error('Unknown scene');project.scene=scene;draw();},setTheme(theme){if(theme!=='light'&&theme!=='dark')throw new Error('Theme must be light or dark');project.theme=theme;draw();},pause(){paused=true;host.firstElementChild?.pauseAnimations();},play(){paused=false;host.firstElementChild?.unpauseAnimations();if(!host.querySelector('animate'))draw();}};window.setNodeState=(...a)=>energyFlow.setNodeState(...a);window.setFlowState=(...a)=>energyFlow.setFlowState(...a);window.addEventListener('energy-flow-data',event=>{for(const[id,data]of Object.entries(event.detail.nodes||{}))energyFlow.setNodeData(id,data);for(const[id,state]of Object.entries(event.detail.flows||{}))energyFlow.setFlowState(id,state);});draw();<\/script></body></html>`;}
function sanitizeSVG(text){const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw new Error('Invalid SVG');const root=doc.documentElement;
 const allowed=new Set(['svg','g','defs','path','rect','circle','ellipse','line','polyline','polygon','linearGradient','radialGradient','stop','clipPath','mask','pattern','symbol','use','image','text','tspan','title','desc','filter','feGaussianBlur','feOffset','feBlend','feColorMatrix','feMerge','feMergeNode','feComposite','feFlood','feDropShadow','feTurbulence','feDisplacementMap','feComponentTransfer','feFuncR','feFuncG','feFuncB','feFuncA','feMorphology','feTile','feImage','style']);
 const unsafeCSS=v=>/@import|@font-face|expression\s*\(|url\(\s*['"]?(?!#)/i.test(v);for(const el of [...root.querySelectorAll('*')]){if(el.localName==='style'&&unsafeCSS(el.textContent))throw new Error('SVG contains external CSS resources. Embed its assets first.');if(!allowed.has(el.localName)){el.remove();continue;}for(const attr of [...el.attributes]){const k=attr.localName.toLowerCase(),v=attr.value.trim();if(k.startsWith('on')||(k==='style'&&unsafeCSS(v))||((k==='href')&&!v.startsWith('#')&&!/^data:image\/(png|jpeg|webp);base64,/i.test(v))||/url\(\s*['"]?(?!#)/i.test(v))el.removeAttributeNode(attr);}}
 for(const a of [...root.attributes])if(a.localName.toLowerCase().startsWith('on')||(a.localName==='style'&&unsafeCSS(a.value)))root.removeAttributeNode(a);
 return serialize(root);
}
function validate(p){if(!p||p.format!=='flow-studio'||p.version!==1||!Array.isArray(p.nodes)||!Array.isArray(p.edges)||!p.assets)throw new Error('Choose a Flow Studio project JSON. ');
 if(p.nodes.length>100||p.edges.length>200)throw new Error('Project is too large (100 elements / 200 lines maximum).');
 const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;const color=v=>/^#[\da-f]{6}$/i.test(v);const opt=(o,k,ok)=>!(k in o)||ok(o[k]);const ids=new Set();
 if(!finite(p.width,100,4096)||!finite(p.height,100,4096)||!color(p.background))throw new Error('Invalid canvas settings');
 for(const n of p.nodes){if(!n||typeof n.id!=='string'||ids.has(n.id)||!finite(n.x,-4096,8192)||!finite(n.y,-4096,8192)||!finite(n.w,1,4096)||!finite(n.h,1,4096)||!STATES.includes(n.state)||!finite(n.fontSize,8,60)||!color(n.color)||!['bottom','top','left','right'].includes(n.labelSide))throw new Error('Invalid element data');ids.add(n.id);}
 const tones=Object.keys(TONES);for(const n of p.nodes){
  if(('callout' in n&&(!n.callout||!finite(n.callout.dx,-4096,4096)||!finite(n.callout.dy,-4096,4096)))||('calloutTarget' in n&&!(Array.isArray(n.calloutTarget)&&n.calloutTarget.length===2&&n.calloutTarget.every(v=>finite(v,-4096,4096))))||('soc' in n&&n.soc!==null&&!finite(Number(n.soc),0,100))||('badge' in n&&typeof n.badge!=='string')||('badgeTone' in n&&!tones.includes(n.badgeTone))||('lit' in n&&typeof n.lit!=='boolean')||('tile' in n&&typeof n.tile!=='boolean'))throw new Error('Invalid element data');}
 if(('theme' in p&&!['light','dark'].includes(p.theme))||('scene' in p&&!['none','day','dusk','night','rain'].includes(p.scene))||('header' in p&&(typeof p.header!=='object'||!p.header)))throw new Error('Invalid canvas settings');
 if(p.header)for(const k of ['title','status','temperature','updated'])if(k in p.header&&typeof p.header[k]!=='string')throw new Error('Invalid canvas settings');if(p.header&&'statusTone' in p.header&&!tones.includes(p.header.statusTone))throw new Error('Invalid canvas settings');if(p.header&&'weather' in p.header&&!['','sun','cloud','rain','night'].includes(p.header.weather))throw new Error('Invalid canvas settings');
 for(const n of p.nodes)if('attach' in n&&(!n.attach||typeof n.attach.to!=='string'||typeof n.attach.slot!=='string'||('scale' in n.attach&&!finite(n.attach.scale,.5,2.5))||!ids.has(n.attach.to)||n.attach.to===n.id))throw new Error('Invalid element data');
 const edgeIds=new Set();for(const e of p.edges){if(e&&'onTop' in e&&typeof e.onTop!=='boolean')throw new Error('Invalid line data');if(e)for(const k of ['sourceAnchor','targetAnchor'])if(k in e&&!(Array.isArray(e[k])&&e[k].length===2&&e[k].every(v=>finite(v,-4096,4096))))throw new Error('Invalid line data');if(!e||typeof e.id!=='string'||edgeIds.has(e.id)||!ids.has(e.from)||!ids.has(e.to)||!STATES.includes(e.state)||!color(e.color)||!color(e.trackColor)||!finite(e.width,.5,30)||!finite(e.trackWidth,.5,30)||!finite(e.radius,0,100)||!finite(e.duration,.5,20)||![1,-1].includes(e.direction)||!['top','bottom','left','right','center'].includes(e.sourcePort)||!['top','bottom','left','right','center'].includes(e.targetPort)||!Array.isArray(e.waypoints)||e.waypoints.length>80||!e.waypoints.every(q=>Array.isArray(q)&&q.length===2&&q.every(v=>finite(v,-4096,8192)))||!opt(e,'route',v=>['orthogonal','straight','curved'].includes(v))||!opt(e,'sourceOffset',v=>finite(v,-2048,2048))||!opt(e,'targetOffset',v=>finite(v,-2048,2048))||!opt(e,'pulses',v=>Number.isInteger(v)&&v>=1&&v<=12)||!opt(e,'pulseLength',v=>finite(v,.02,.9))||!opt(e,'glow',v=>finite(v,0,1))||!opt(e,'trackStyle',v=>['solid','dashed','dotted'].includes(v)))throw new Error('Invalid line data');edgeIds.add(e.id);}
 for(const[k,a]of Object.entries(p.assets)){if(a&&'lit' in a&&!(a.lit&&typeof a.lit.src==='string'&&/^data:image\/(png|jpeg|webp);base64,/i.test(a.lit.src)))throw new Error('Project assets must be embedded images');if(!a||!finite(a.width,1,10000)||!finite(a.height,1,10000)||typeof a.src!=='string'||!/^data:image\/(png|jpeg|webp|svg\+xml);base64,/i.test(a.src))throw new Error('Project assets must be embedded images');if(a.src.startsWith('data:image/svg+xml;')){const text=decodeURIComponent(escape(atob(a.src.split(',')[1])));a.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(sanitizeSVG(text))));}}
 return p;
}
function bounds(p){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;const take=(x,y)=>{minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);};for(const n of p.nodes.filter(n=>n.state!=='hidden')){take(n.x-n.w/2,n.y-n.h/2);take(n.x+n.w/2,n.y+n.h/2);const b=labelBox(n,p);if(b.lines.length){take(b.x-(b.leader?8:0),b.y);take(b.x+b.width,b.y+b.height);}for(const q of b.leader||[])take(q[0],q[1]);if(n.tile){for(const q of Object.values(tilePoints(n)).flat())take(q[0],q[1]);}}for(const e of p.edges.filter(e=>e.state!=='hidden')){const sh=shape(p,e),pad=e.width*1.4;sh.v.forEach((v,j)=>{for(const q of [v,[v[0]+sh.o[j][0],v[1]+sh.o[j][1]],[v[0]+sh.i[j][0],v[1]+sh.i[j][1]]]){take(q[0]-pad,q[1]-pad);take(q[0]+pad,q[1]+pad);}});}if(!Number.isFinite(minX))return{minX:0,minY:0,maxX:80,maxY:80,width:100,height:100};return{minX,minY,maxX,maxY,width:Math.ceil(maxX+20),height:Math.ceil(maxY+20)};}
function fit(p){const b=bounds(p),dx=Math.max(0,20-b.minX),dy=Math.max(0,20-b.minY);for(const n of p.nodes){n.x+=dx;n.y+=dy;}for(const e of p.edges)e.waypoints=e.waypoints.map(q=>[q[0]+dx,q[1]+dy]);p.width=Math.min(4096,Math.max(100,b.width+dx));p.height=Math.min(4096,Math.max(100,b.height+dy));return p;}

const api={arrangeCallouts,TONES,SCENES,theme,tilePoints,header,sceneLayer,NS,STATES,clone,esc,num,element,svgAsset,extraAssets,node,edge,preset,port,edgePort,direction,look,points,geometry,curve,shape,trackDash,pulseDash,pathData,labelBox,labelLines,labels,opacity,render,serialize,raster,standalone,validate,sanitizeSVG,bounds,fit};global.FlowCore=api;
})(window);
