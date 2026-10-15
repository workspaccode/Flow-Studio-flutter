/* Tiny isometric illustration engine: world metres (x right-down, y left-down, z up) → canvas. */
const ISO={};
(function(I){
I.init=(w,h,u,ox,oy)=>{const c=document.createElement('canvas');c.width=w;c.height=h;I.c=c;I.g=c.getContext('2d');I.U=u;I.OX=ox;I.OY=oy;return c;};
I.P=(x,y,z=0)=>[I.OX+(x-y)*I.U*.866,I.OY+(x+y)*I.U*.5-z*I.U];
const L=(()=>{const v=[.62,.28,.73],n=Math.hypot(...v);return v.map(a=>a/n);})();
I.hex=h=>{h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
I.rgb=(c,a=1)=>`rgba(${c.map(v=>Math.round(Math.max(0,Math.min(255,v)))).join(',')},${a})`;
/* Lambert-ish shade of a base colour for a surface normal. */
I.shade=(hex,n,amb=.58)=>{const d=Math.max(0,n[0]*L[0]+n[1]*L[1]+n[2]*L[2]);const k=amb+(1-amb)*d*1.08;return I.rgb(I.hex(hex).map(v=>v*k));};
I.mix=(hex,k)=>I.rgb(I.hex(hex).map(v=>v*k));
I.path=pts=>{const g=I.g;g.beginPath();pts.forEach((p,i)=>{const q=Array.isArray(p[0])?p:I.P(...p);i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.closePath();};
I.fill=(pts3,style,stroke)=>{I.path(pts3);I.g.fillStyle=style;I.g.fill();if(stroke){I.g.strokeStyle=stroke;I.g.lineWidth=Math.max(1,I.U*.025);I.g.lineJoin='round';I.g.stroke();}};
/* Vertical gradient (screen space) between two 3D points. */
I.grad=(a3,b3,c1,c2)=>{const a=I.P(...a3),b=I.P(...b3),gr=I.g.createLinearGradient(a[0],a[1],b[0],b[1]);gr.addColorStop(0,c1);gr.addColorStop(1,c2);return gr;};
/* Axis-aligned box: visible faces +x, +y and top. */
I.box=(x,y,z,w,d,h,col,o={})=>{const top=o.top||col;
 I.fill([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],o.flat?I.shade(col,[1,0,0]):I.grad([x+w,y,z+h],[x+w,y+d,z],I.shade(col,[1,0,0],.66),I.shade(col,[1,0,0],.56)),o.edge);
 I.fill([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],o.flat?I.shade(col,[0,1,0]):I.grad([x,y+d,z+h],[x+w,y+d,z],I.shade(col,[0,1,0],.6),I.shade(col,[0,1,0],.5)),o.edge);
 I.fill([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],I.shade(top,[0,0,1],.7),o.edge);};
/* Rectangles on visible faces: face 'x' (plane x=X, u along y) or 'y' (plane y=Y, u along x). */
I.onX=(X,u0,v0,u1,v1,style)=>I.fill([[X,u0,v0],[X,u1,v0],[X,u1,v1],[X,u0,v1]],style);
I.onY=(Y,u0,v0,u1,v1,style)=>I.fill([[u0,Y,v0],[u1,Y,v0],[u1,Y,v1],[u0,Y,v1]],style);
/* A framed glass window on face x or y. */
I.window=(face,P0,u,v,w,h,o={})=>{const f=face==='x'?I.onX:I.onY,fr=o.frame||'#eef2f6',e=.07;
 f(P0+(face==='x'?.005:.005),u,v,u+w,v+h,fr);
 const gl=face==='x'?I.grad([P0,u,v+h],[P0,u+w,v],'#9cc3e6','#3d6d9c'):I.grad([u,P0,v+h],[u+w,P0,v],'#a9cdec','#45759f');
 if(I.lit){/* lights on: warm glass with a soft glow, no sky reflection */const lg=face==='x'?I.grad([P0,u,v+h],[P0,u+w,v],'#ffe3a3','#f2b44f'):I.grad([u,P0,v+h],[u+w,P0,v],'#ffe3a3','#f2b44f'),g=I.g;g.save();g.shadowColor='rgba(255,190,80,.9)';g.shadowBlur=I.U*.45;f(P0+.01,u+e,v+e,u+w-e,v+h-e,lg);g.restore();f(P0+.01,u+e,v+e,u+w-e,v+h-e,lg);}
 else f(P0+.01,u+e,v+e,u+w-e,v+h-e,gl);
 if(o.mullion!==false){const m=I.mix(fr.length===7?fr:'#eef2f6',1);const mid=u+w/2;f(P0+.012,mid-.03,v+e,mid+.03,v+h-e,fr);f(P0+.012,u+e,v+h/2-.03,u+w-e,v+h/2+.03,fr);}
 if(I.lit)return;
 /* sky reflection */ const g=I.g;g.save();I.path(face==='x'?[[P0+.02,u+e,v+e],[P0+.02,u+w*.45,v+e],[P0+.02,u+w*.15,v+h-e],[P0+.02,u+e,v+h-e]]:[[u+e,P0+.02,v+e],[u+w*.45,P0+.02,v+e],[u+w*.15,P0+.02,v+h-e],[u+e,P0+.02,v+h-e]]);g.fillStyle='rgba(255,255,255,.18)';g.fill();g.restore();};
/* Soft contact shadow under a footprint. */
I.shadow=(x,y,w,d,blur=.6,a=.22,spread=.25)=>{const g=I.g;g.save();g.filter=`blur(${blur*I.U}px)`;I.fill([[x-spread,y-spread,0],[x+w+spread,y-spread,0],[x+w+spread,y+d+spread,0],[x-spread,y+d+spread,0]],`rgba(30,45,70,${a})`);g.restore();};
/* Photovoltaic module texture (portrait 6×10 cells). */
I.moduleTex=(cols=6,rows=10,o={})=>{const cc=o.cells||['#2b4c8e','#1b3672','#14295b'],fc=o.frame||['#f2f5f8','#b7c0c9','#e1e6eb'];const cell=48,gap=4,frame=9,W=frame*2+cols*cell+(cols-1)*gap,H=frame*2+rows*cell+(rows-1)*gap,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 let g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,fc[0]);g.addColorStop(.5,fc[1]);g.addColorStop(1,fc[2]);x.fillStyle=g;x.fillRect(0,0,W,H);x.fillStyle=o.back||'#e6ebf1';x.fillRect(frame,frame,W-2*frame,H-2*frame);
 for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const cx=frame+k*(cell+gap),cy=frame+r*(cell+gap),cg=x.createLinearGradient(cx,cy,cx+cell,cy+cell);cg.addColorStop(0,cc[0]);cg.addColorStop(.55,cc[1]);cg.addColorStop(1,cc[2]);x.fillStyle=cg;const ch=7;x.beginPath();x.moveTo(cx+ch,cy);x.lineTo(cx+cell-ch,cy);x.lineTo(cx+cell,cy+ch);x.lineTo(cx+cell,cy+cell-ch);x.lineTo(cx+cell-ch,cy+cell);x.lineTo(cx+ch,cy+cell);x.lineTo(cx,cy+cell-ch);x.lineTo(cx,cy+ch);x.closePath();x.fill();
  x.strokeStyle=o.line||'rgba(225,232,245,.7)';x.lineWidth=1.3;for(const f of [.25,.5,.75]){x.beginPath();x.moveTo(cx+cell*f,cy);x.lineTo(cx+cell*f,cy+cell);x.stroke();}}
 g=x.createLinearGradient(0,0,W,H*.9);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(.35,'rgba(255,255,255,.05)');g.addColorStop(.6,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.1)');x.fillStyle=g;x.fillRect(frame,frame,W-2*frame,H-2*frame);return c;};
/* Maps a texture onto the parallelogram a (top-left), b (top-right), c (bottom-left). */
I.tex=(t,a3,b3,c3)=>{const a=I.P(...a3),b=I.P(...b3),c=I.P(...c3),g=I.g;g.save();g.setTransform((b[0]-a[0])/t.width,(b[1]-a[1])/t.width,(c[0]-a[0])/t.height,(c[1]-a[1])/t.height,a[0],a[1]);g.drawImage(t,0,0);g.restore();};
/* Grid of modules on a plane: origin o, edge vectors along (rows) and up (slope), counts, sizes. */
I.panels=(t,o,along,up,n,m,mw,ml,gap=.04)=>{const nrm=v=>{const l=Math.hypot(...v);return v.map(a=>a/l);},A=nrm(along),Uv=nrm(up);
 for(let j=m-1;j>=0;j--)for(let i=0;i<n;i++){const s=i*(mw+gap),r=j*(ml+gap),P0=[0,1,2].map(k=>o[k]+A[k]*s+Uv[k]*(r+ml)),P1=[0,1,2].map(k=>P0[k]+A[k]*mw),P2=[0,1,2].map(k=>o[k]+A[k]*s+Uv[k]*r);I.tex(t,P0,P1,P2);}};
/* Cylinder along an axis, shaded per facet; draws only facets facing the viewer. */
I.cyl=(c3,axis,r,len,hex,o={})=>{const N=o.n||48,ax={x:[1,0,0],y:[0,1,0],z:[0,0,1]}[axis],e1=axis==='z'?[1,0,0]:axis==='x'?[0,1,0]:[1,0,0],e2=axis==='z'?[0,1,0]:[0,0,1],view=[1,1,1];
 const pt=(t,a)=>[0,1,2].map(k=>c3[k]+ax[k]*t+r*(Math.cos(a)*e1[k]+Math.sin(a)*e2[k]));
 const faces=[];for(let i=0;i<N;i++){const a0=i/N*2*Math.PI,a1=(i+1)/N*2*Math.PI,am=(a0+a1)/2,n=[0,1,2].map(k=>Math.cos(am)*e1[k]+Math.sin(am)*e2[k]);if(n[0]+n[1]+n[2]*1.15<-.02)continue;faces.push({d:n[0]+n[1]-n[2]*.3,pts:[pt(0,a0),pt(len,a0),pt(len,a1),pt(0,a1)],n});}
 faces.sort((a,b)=>a.d-b.d);for(const f of faces){I.fill(f.pts,I.shade(hex,f.n,o.amb??.55));}
 if(o.noCap)return;/* visible end cap */ const capT=(ax[0]+ax[1]+ax[2])>0?len:0,cn=ax.map(v=>v*(capT?1:-1));const cap=[];for(let i=0;i<N;i++)cap.push(pt(capT,i/N*2*Math.PI));I.fill(cap,I.shade(o.cap||hex,cn,.62));};
/* Stylised foliage: clustered shaded spheres. */
I.blob=(x,y,z,r,hex)=>{const p=I.P(x,y,z),g=I.g,R=r*I.U,gr=g.createRadialGradient(p[0]+R*.35,p[1]-R*.45,R*.1,p[0],p[1],R*1.05);gr.addColorStop(0,I.mix(hex,1.35));gr.addColorStop(.55,hex);gr.addColorStop(1,I.mix(hex,.62));g.beginPath();g.arc(p[0],p[1],R,0,7);g.fillStyle=gr;g.fill();};
I.tree=(x,y,s=1,hex='#5fa64a')=>{I.shadow(x-1*s,y-.6*s,1.6*s,1.6*s,.45,.18,.1);I.cyl([x,y,0],'z',.12*s,1.6*s,'#7a5a3f',{n:16});for(const [dx,dy,dz,r] of [[0,0,2.5,1],[.55,.25,2.0,.75],[-.45,.4,2.1,.72],[.15,-.4,3.1,.7],[0,.5,1.7,.6]])I.blob(x+dx*s,y+dy*s,dz*s,r*s,hex);};
I.bush=(x,y,s=1,hex='#4e9a3e')=>{for(const [dx,dy,r] of [[0,0,.5],[.45,.2,.42],[-.35,.3,.4],[.15,.45,.38]])I.blob(x+dx*s,y+dy*s,r*s*.8,r*s,hex);};
/* Paved slab with joints. */
I.slab=(x,y,w,d,h,hex,joint=1,jc='rgba(120,130,145,.35)')=>{I.box(x,y,-h,w,d,h,hex,{flat:true});const g=I.g;g.save();I.path([[x,y,0],[x+w,y,0],[x+w,y+d,0],[x,y+d,0]]);g.clip();g.strokeStyle=jc;g.lineWidth=Math.max(1,I.U*.02);for(let a=x+joint;a<x+w;a+=joint){g.beginPath();g.moveTo(...I.P(a,y,0));g.lineTo(...I.P(a,y+d,0));g.stroke();}for(let b=y+joint;b<y+d;b+=joint){g.beginPath();g.moveTo(...I.P(x,b,0));g.lineTo(...I.P(x+w,b,0));g.stroke();}g.restore();};
/* Prism: closed profile [[x,z],…] extruded along y from y0 to y1; draws the visible facets back to front, then the +y side.
   o.facet(i,n) may return a fill for strip i (else shaded col); o.side overrides the side fill. */
I.prism=(prof,y0,y1,col,o={})=>{const n=prof.length,cx=prof.reduce((a,p)=>a+p[0],0)/n,cz=prof.reduce((a,p)=>a+p[1],0)/n,fs=[];
 for(let i=0;i<n;i++){const a=prof[i],b=prof[(i+1)%n];let nx=b[1]-a[1],nz=-(b[0]-a[0]);const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;if((mx-cx)*nx+(mz-cz)*nz<0){nx=-nx;nz=-nz;}
  if(nx+nz*1.15<=.01)continue;fs.push({i,d:mx+mz,pts:[[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]]],nm:[nx,0,nz]});}
 fs.sort((p,q)=>p.d-q.d);for(const f of fs)I.fill(f.pts,(o.facet&&o.facet(f.i,f.nm))||I.shade(col,f.nm,o.amb??.62));
 I.fill(prof.map(([x,z])=>[x,y1,z]),o.side||I.shade(col,[0,1,0],o.amb??.62));};
/* Disc on the plane y=Y (faces +y). */
I.discY=(x,Y,z,r,style,N=40)=>I.fill(Array.from({length:N},(_,i)=>[x+r*Math.cos(i/N*2*Math.PI),Y,z+r*Math.sin(i/N*2*Math.PI)]),style);
/* Smooth cable through 3D points (quadratic midpoints in screen space), with a soft highlight. */
I.cable=(pts3,w=.06,col='#2a2f37',hi='rgba(255,255,255,.22)')=>{const p=pts3.map(q=>I.P(...q)),g=I.g;const run=()=>{g.beginPath();g.moveTo(...p[0]);for(let i=1;i<p.length-1;i++){const m=[(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2];g.quadraticCurveTo(p[i][0],p[i][1],...(i===p.length-2?p[i+1]:m));}if(p.length===2)g.lineTo(...p[1]);g.stroke();};
 g.save();g.lineCap='round';g.lineJoin='round';g.strokeStyle=col;g.lineWidth=I.U*w;run();g.strokeStyle=hi;g.lineWidth=I.U*w*.3;g.translate(-I.U*w*.15,-I.U*w*.2);run();g.restore();};
/* Bounding rect [x0,y0,x1,y1) of the non-transparent pixels. */
I.bounds=src=>{const W=src.width,H=src.height,d=src.getContext('2d').getImageData(0,0,W,H).data;let x0=W,y0=H,x1=0,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>6){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}return[x0,y0,x1+1,y1+1];};
/* Crops src to rect (default: its own bounds) and scales it to at most maxW wide. */
I.trim=(src,maxW,r=I.bounds(src))=>{const w=r[2]-r[0],h=r[3]-r[1],k=Math.min(1,maxW/w),T=document.createElement('canvas');T.width=Math.round(w*k);T.height=Math.round(h*k);const tg=T.getContext('2d');tg.imageSmoothingQuality='high';tg.drawImage(src,r[0],r[1],w,h,0,0,T.width,T.height);return T;};
/* Lights-on overlay: the lit render's pixels wherever it differs from the normal one (same canvas size). */
I.overlay=(a,b,soft=18)=>{const W=a.width,H=a.height,A=a.getContext('2d').getImageData(0,0,W,H).data,B=b.getContext('2d').getImageData(0,0,W,H),d=B.data;
 for(let i=0;i<d.length;i+=4){const m=Math.max(Math.abs(d[i]-A[i]),Math.abs(d[i+1]-A[i+1]),Math.abs(d[i+2]-A[i+2]),Math.abs(d[i+3]-A[i+3]));d[i+3]=m<3?0:Math.round(d[i+3]*Math.min(1,m/soft));}
 const O=document.createElement('canvas');O.width=W;O.height=H;O.getContext('2d').putImageData(B,0,0);return O;};
I.b64=async b=>{const u=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s);};
I.onWhite=(...layers)=>{const P=document.createElement('canvas');P.width=layers[0].width;P.height=layers[0].height;const pg=P.getContext('2d');pg.fillStyle='#fff';pg.fillRect(0,0,P.width,P.height);for(const l of layers)pg.drawImage(l,0,0);return P.toDataURL('image/png').split(',')[1];};
I.store=async(name,T,preview)=>{const webp=await new Promise(r=>T.toBlob(r,'image/webp',.93));window.__out=window.__out||{};window.__out[name]={webp:await I.b64(webp),preview,w:T.width,h:T.height,size:webp.size};return [T.width,T.height,webp.size];};
/* Trims, scales to ≤1100px and stores a WebP + white preview in window.__out[name]. With o.lit (the same scene
   rendered with ISO.lit=true on an identical canvas) it also stores name+'-lit': the lights-on overlay cut to the same rect. */
I.export=async(canvas,name,o={})=>{const r=I.bounds(canvas),T=I.trim(canvas,1100,r),res=await I.store(name,T,I.onWhite(T));
 if(o.lit){const L=I.trim(I.overlay(canvas,o.lit),1100,r);await I.store(name+'-lit',L,I.onWhite(T,L));}return res;};
})(ISO);
