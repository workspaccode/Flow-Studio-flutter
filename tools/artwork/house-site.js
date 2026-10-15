/* Configurable house: draws the base and each attachable part on separate canvases that share one projection. */
(async()=>{const I=ISO,t=I.moduleTex(),layers={},CW=2600,CH=2000,U=74,OX=1150,OY=640;
const X0=2.6,X1=11.6,Y0=1.8,Y1=8.2,H=5.6,R=2.5,o=.45,ym=(Y0+Y1)/2,GX=X1,GW=4.4,GY0=3.4,GY1=8.6,GH=3.1;
const lawn=()=>I.grad([0,9.2,0],[10.6,13.5,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75));
function base(){
 I.shadow(0,0,19,13.5,1.2,.16,.4);I.slab(0,0,19,13.5,.35,'#d9dde2',1.1);
 I.fill([[0,9.2,0],[10.6,9.2,0],[10.6,13.5,0],[0,13.5,0]],lawn());I.fill([[0,0,0],[2.2,0,0],[2.2,9.2,0],[0,9.2,0]],lawn());I.fill([[16.3,0,0],[19,0,0],[19,8.6,0],[16.3,8.6,0]],lawn());
 I.tree(1.2,.9,.9,'#579f45');
 I.fill([[X0-o,Y0-o,H],[X1+o,Y0-o,H],[X1+o,ym,H+R],[X0-o,ym,H+R]],I.shade('#3b4757',[0,-.7,.7],.6));
 I.shadow(X0,Y0,X1-X0+4,Y1-Y0+.6,.7,.24,.15);
 I.box(X0,Y0,0,X1-X0,Y1-Y0,H,'#eceef0');
 I.onY(Y1+.004,X0,0,X1,.35,I.shade('#8a949f',[0,1,0]));I.onX(X1+.004,Y0,0,Y1,.35,I.shade('#8a949f',[1,0,0]));I.onY(Y1+.004,X0,2.75,X1,2.9,I.shade('#c9ced4',[0,1,0]));
 for(const u of [3.2,5.3])I.window('y',Y1,u,.9,1.5,1.5);
 I.onY(Y1+.006,7.3,0,8.5,2.3,I.grad([7.3,Y1,2.3],[8.5,Y1,0],'#4a5566','#2f3846'));I.onY(Y1+.01,8.25,1.1,8.33,1.3,'#d7dce2');
 I.fill([[7.1,Y1,2.45],[8.7,Y1,2.45],[8.7,Y1+.8,2.45],[7.1,Y1+.8,2.45]],I.shade('#5d6876',[0,0,1]));
 I.window('y',Y1,9.4,.9,1.7,1.5);for(const u of [3.2,5.3,7.5,9.6])I.window('y',Y1,u,3.5,1.4,1.4);
 I.window('x',X1,3,3.6,1.6,1.3);I.window('x',X1,5.6,3.6,1.4,1.3);
 I.fill([[X0-o,Y1+o,H],[X1+o,Y1+o,H],[X1+o,ym,H+R],[X0-o,ym,H+R]],I.grad([X0,ym,H+R],[X0,Y1+o,H],I.shade('#4a5768',[0,.7,.7],.66),I.shade('#3a4555',[0,.7,.7],.6)));
 I.fill([[X0-o,Y1+o,H],[X1+o,Y1+o,H],[X1+o,Y1+o,H-.12],[X0-o,Y1+o,H-.12]],'#2c3440');
 I.fill([[X1,Y0,H],[X1,Y1,H],[X1,ym,H+R]],I.shade('#eceef0',[1,0,0],.6));
 I.fill([[X1+o,Y0-o,H],[X1+o,ym,H+R],[X1+o,ym,H+R+.14],[X1+o,Y0-o,H+.14]],'#2c3440');I.fill([[X1+o,ym,H+R],[X1+o,Y1+o,H],[X1+o,Y1+o,H+.14],[X1+o,ym,H+R+.14]],'#3a4452');
 I.window('x',X1,ym-.45,H+.5,.9,1.1,{mullion:false});
 I.box(4.2,3,H+.9,.9,.9,2.3,'#9aa3ad');
 I.shadow(GX,GY0,GW,GY1-GY0,.5,.2,.1);I.box(GX,GY0,0,GW,GY1-GY0,GH,'#e4e7ea');I.box(GX-.05,GY0-.05,GH,GW+.1,GY1-GY0+.1,.25,'#c7ccd2');
 I.onY(GY1+.006,GX+.5,0,GX+3.9,2.3,I.grad([0,GY1,2.3],[0,GY1,0],'#cfd4da','#aab2bb'));for(let k=0;k<6;k++)I.onY(GY1+.01,GX+.5,.35+k*.33,GX+3.9,.37+k*.33,'rgba(120,130,140,.45)');
 I.window('x',GX+GW,GY0+3.4,1,1.4,1.2);
 I.slab(GX+.4,GY1,3.6,13.5-GY1,.02,'#c3c8ce',.6);
 for(const u of [2.8,4.3,5.8])I.bush(u,Y1+.9,.9);I.tree(1.6,11.3,1.15,'#62aa4c');
 // concrete pads in the side yard for the battery and the pole
 I.slab(16.0,3.9,1.0,1.35,.05,'#c9ced4',2);I.slab(17.25,.85,1.1,1.1,.05,'#c9ced4',2);
}
const parts={
 'roof-solar':()=>{const sl=Math.hypot(Y1+o-ym,R);I.panels(t,[X0+.35,Y1+o-.25*(Y1+o-ym)/sl,H+.25*R/sl],[1,0,0],[0,-(Y1+o-ym),R],7,2,1.12,1.72,.05);
  for(const yF of [5.9,8.2]){I.box(GX+.45,yF-1.45,GH+.25,3.45,.08,.65,'#9aa4ae');I.panels(t,[GX+.45,yF,GH+.32],[1,0,0],[0,-1,.38],3,1,1.1,1.55,.05);}},
 'wall-inverter':()=>{const x=GX+GW,y0=3.95,y1=5.2,z0=1.6,z1=z0+(y1-y0)*492/556;
  I.shadow(x,y0,.32,y1-y0,.14,.22,0);I.box(x,y0+.04,z0+.16,.16,y1-y0-.08,z1-z0-.2,'#e9ecef');
  I.tex(RESC,[x+.162,y1,z1],[x+.162,y0,z1],[x+.162,y1,z0]);},
 'yard-battery':()=>{const x=16.0,y=4.075,w=.7,d=1.0;I.shadow(x,y,w,d,.15,.26,0);for(const [z,h] of [[.05,.62],[.69,.62]]){I.box(x,y,z,w,d,h,'#f2f4f6');I.onX(x+w+.004,y,z+h-.14,y+d,z+h-.06,'#2b3440');}I.onX(x+w+.008,y+.18,1.1,y+.4,1.15,'#3d7fe0');I.box(x-.02,y-.02,1.31,w+.04,d+.04,.06,'#d5dadf');},
 'yard-pole':()=>{const x=17.8,y=1.4;I.shadow(x-.4,y-.4,.8,.8,.2,.22,0);I.cyl([x,y,0],'z',.13,8.4,'#c9ced4',{n:28});I.box(x-1.1,y-.06,7.75,2.2,.12,.16,'#8a939d');
  for(const dx of [-.9,0,.9]){for(let k=0;k<3;k++)I.cyl([x+dx,y,7.91+k*.1],'z',.09-k*.008,.06,'#7fa8a0',{n:16});}
  {const g=I.g;g.strokeStyle='#4a525d';g.lineWidth=I.U*.03;for(const dx of [-.9,0,.9])for(const s of [-1,1]){const a=I.P(x+dx,y,8.2),b=I.P(x+dx,y+s*2.4,8.0),m=I.P(x+dx,y+s*1.2,7.85);g.beginPath();g.moveTo(...a);g.quadraticCurveTo(m[0],m[1],b[0],b[1]);g.stroke();}}
  I.cyl([x+.62,y,5],'z',.36,1.25,'#9fb3c4',{n:32});for(const z of [5.3,5.85])I.cyl([x+.62,y,z],'z',.37,.05,'#7e93a6',{n:32,noCap:true});I.box(x+.12,y-.08,5.1,.2,.16,.12,'#8a939d');I.box(x+.12,y-.08,6.0,.2,.16,.12,'#8a939d');}
};
/* Cable routes in metres: roof panels → down the wall → inverter top; inverter → battery top;
   inverter → down to the ground → along the ground → pole foot. */
const ZI=1.6,CABLES={'roof>wall':[[15.4,4.575,3.42],[16.24,4.575,3.42],[16.24,4.575,ZI+1.25*492/556]],'wall>battery':[[16.24,4.575,ZI],[16.24,4.575,1.375]],'wall>pole':[[16.2,4.03,ZI+.55],[16.2,4.03,.04],[17.8,1.4,.04]]};
// render every layer on the same canvas geometry
const draw=fn=>{const c=I.init(CW,CH,U,OX,OY);fn();return c;};
const RESC=await new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src=window.__resc;});
I.init(CW,CH,U,OX,OY);const cablePx=Object.fromEntries(Object.entries(CABLES).map(([k,pts])=>[k,pts.map(q=>I.P(...q))]));
const canv={base:draw(base)};for(const k in parts)canv[k]=draw(parts[k]);
const bbox=c=>{const d=c.getContext('2d').getImageData(0,0,CW,CH).data;let x0=CW,y0=CH,x1=0,y1=0;for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(d[(y*CW+x)*4+3]>6){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}return[x0,y0,x1+1,y1+1];};
const boxes={};for(const k in canv)boxes[k]=bbox(canv[k]);
/* the house image covers every part so attached parts always sit inside it */
const U0=Object.values(boxes).reduce((a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])]);
const scale=Math.min(1,1100/(U0[2]-U0[0]));
const crop=(c,r)=>{const T=document.createElement('canvas');T.width=Math.round((r[2]-r[0])*scale);T.height=Math.round((r[3]-r[1])*scale);const g=T.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(c,r[0],r[1],r[2]-r[0],r[3]-r[1],0,0,T.width,T.height);return T;};
const b64=async b=>{const u=new Uint8Array(await b.arrayBuffer());let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s);};
const out={};const W=U0[2]-U0[0],Hh=U0[3]-U0[1];
for(const k in canv){const r=k==='base'?U0:boxes[k],T=crop(canv[k],r),blob=await new Promise(res=>T.toBlob(res,'image/webp',.93));
 out[k]={webp:await b64(blob),w:T.width,h:T.height,size:blob.size,slot:k==='base'?null:{x:+((r[0]-U0[0])/W).toFixed(5),y:+((r[1]-U0[1])/Hh).toFixed(5),w:+((r[2]-r[0])/W).toFixed(5),h:+((r[3]-r[1])/Hh).toFixed(5)}};}
out.cables=Object.fromEntries(Object.entries(cablePx).map(([k,pts])=>[k,pts.map(([x,y])=>[+((x-U0[0])/W).toFixed(5),+((y-U0[1])/Hh).toFixed(5)])]));
// a composite preview with every part on
const P=document.createElement('canvas');P.width=Math.round(W*scale)*2+60;P.height=Math.round(Hh*scale)+40;const pg=P.getContext('2d');pg.fillStyle='#fff';pg.fillRect(0,0,P.width,P.height);
pg.drawImage(crop(canv.base,U0),20,20);const all=crop(canv.base,U0);const ag=all.getContext('2d');for(const k in parts)ag.drawImage(crop(canv[k],U0),0,0);{const k=scale;for(const pts of Object.values(cablePx)){ag.strokeStyle='#4d73ef';ag.lineWidth=3;ag.lineJoin='round';ag.beginPath();pts.forEach(([x,y],i)=>{const X=(x-U0[0])*k,Y=(y-U0[1])*k;i?ag.lineTo(X,Y):ag.moveTo(X,Y);});ag.stroke();}}
pg.drawImage(all,Math.round(W*scale)+40,20);
window.__site={parts:out,preview:P.toDataURL('image/png').split(',')[1]};
return {cables:out.cables,...Object.fromEntries(Object.entries(out).filter(([k])=>k!=='cables').map(([k,v])=>[k,[v.w,v.h,Math.round(v.size/1024)+'KB',v.slot]]))};
})()
