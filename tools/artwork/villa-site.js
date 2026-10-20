/* Configurable modern villa: white two-storey villa with a flat roof, glass-railed terraces, warm interiors and a
   roll-up garage, on a light paved plot. Like house-site.js, the base and each attachable part (roof PV, RESC wall
   inverter, grid meter, home battery) are drawn on canvases that share one projection and are cropped to one frame.
   Each part layer is cut from a render of the whole scene *with* that part (masked by the part's own pixels), so
   anything in front of it (the glass roof railing over the PV rows) is already in the layer and it lines up exactly.
   Needs window.__resc (data URL of resc-inverter.png). Result in window.__villa. */
(async()=>{const I=ISO,CW=2400,CH=2000,U=72,OX=960,OY=700;
const t=I.moduleTex(6,10,{cells:['#3b4a63','#26324a','#1b2436'],frame:['#eef1f4','#a9b2bc','#d9dee3'],back:'#c9d0d8',line:'rgba(190,204,224,.42)'});
const RESC=await new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src=window.__resc;});
const RT=(()=>{const c=document.createElement('canvas');c.width=RESC.width;c.height=RESC.height;const g=c.getContext('2d');g.drawImage(RESC,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(40,52,66,.06)';g.fillRect(0,0,c.width,c.height);return c;})();
// geometry (metres)
const PX=16.5,PY=14;                       // plot
const X0=2,X1=13,Y0=2,Y1=9,GZ=3.3;         // ground floor
const SZ=3.55;                             // top of the first-floor slab
const LX=6.4,LY=6.4;                       // left upper block x 2..6.4, y 2..6.4 (terrace in front of it)
const RZ=6.75,PH=.22;                      // roof top, parapet height
const WALL='#fbfbfc',FRAME='#5a636e',METAL='#aeb6bf';
const IX0=7.2,IX1=8.5,IZ0=1.22,IZ1=IZ0+(IX1-IX0)*492/556; // inverter
const MX0=8.85,MX1=9.35,MZ0=.9,MZ1=1.55;   // meter
const BX0=5.95,BX1=6.85,BY0=9.02,BY1=9.42,BH=1.45; // battery
const ROWS=[{y:3.95,x:2.9,n:8},{y:5.95,x:2.9,n:8},{y:7.95,x:7.5,n:4}],MW=1.1,ML=1.5,GAP=.05,DEP=ML/Math.hypot(1,.38),RISE=DEP*.38;

/* white box with soft, bright shading (faces +x, +y, top) */
const wbox=I.swapXY((x,y,z,w,d,h,col,o={})=>{const k=o.k||[.95,.89,.86,.8,.975];
 I.fill([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],I.grad([x+w,y,z+h],[x+w,y,z],I.mix(col,k[0]),I.mix(col,k[1])));
 I.fill([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],I.grad([x,y+d,z+h],[x,y+d,z],I.mix(col,k[2]),I.mix(col,k[3])));
 I.fill([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],I.mix(o.top||col,k[4]));});
const tiles=(x0,y0,x1,y1,z,col,j,jc='rgba(140,148,160,.26)')=>{I.fill([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],col);const g=I.g;g.save();I.path([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]]);g.clip();g.strokeStyle=jc;g.lineWidth=Math.max(1,U*.018);
 for(let a=x0+j;a<x1;a+=j){g.beginPath();g.moveTo(...I.P(a,y0,z));g.lineTo(...I.P(a,y1,z));g.stroke();}for(let b=y0+j;b<y1;b+=j){g.beginPath();g.moveTo(...I.P(x0,b,z));g.lineTo(...I.P(x1,b,z));g.stroke();}g.restore();};
const blurFill=(pts,style,b)=>{const g=I.g;g.save();g.filter=`blur(${b*U}px)`;I.fill(pts,style);g.restore();};

/* Window with a warm interior behind the glass (room depth, floor, back wall, sofa, pendant lamp).
   face 'y' = plane y=P (u along x) or 'x' = plane x=P (u along y). ISO.lit turns the lights on. */
function win(face,P,u,v,w,h,o={}){const S=(a,b,z)=>face==='y'?[a,P+b,z]:[P+b,a,z],lit=I.lit,g=I.g,e=.06;
 const R=(u0,v0,u1,v1,off,st)=>I.fill([S(u0,off,v0),S(u1,off,v0),S(u1,off,v1),S(u0,off,v1)],st);
 const tone=(hex,k)=>I.mix(hex,lit?k*1.12:k*.8);
 R(u,v,u+w,v+h,.006,FRAME);
 if(lit){g.save();g.shadowColor='rgba(255,186,92,.85)';g.shadowBlur=U*.5;R(u+e,v+e,u+w-e,v+h-e,.008,'rgba(255,214,150,.95)');g.restore();}
 g.save();I.path([S(u+e,.01,v+e),S(u+w-e,.01,v+e),S(u+w-e,.01,v+h-e),S(u+e,.01,v+h-e)]);g.clip();
 const F=o.floor??0,C=o.ceil??F+3.15,D=o.depth??1.7,a0=u-8,a1=u+w+8;
 R(a0,F,a1,C+2,-D,I.grad(S(u,-D,C),S(u,-D,F),lit?'#ffe6b3':I.mix('#f4dcb4',.9),lit?'#f7c879':I.mix('#e2c08f',.84)));
 I.fill([S(a0,.02,F),S(a1,.02,F),S(a1,-D,F),S(a0,-D,F)],I.grad(S(u,-D,F),S(u,0,F),lit?'#f2c27a':I.mix('#dcb88a',.8),lit?'#e0a65a':I.mix('#c99d6a',.78)));
 if(w>1.2){const fs=o.sofa??.18;   // furniture
  const pic=[u+w*.55,u+w*.55+Math.min(1.1,w*.3)];R(pic[0],F+1.35,pic[1],F+2.05,-D+.02,tone('#8fa6b8',.9));
  const sb=(a,b,z,la,lb,hz,col)=>face==='y'?I.box(a,P+b,z,la,lb,hz,col,{flat:true}):I.box(P+b,a,z,lb,la,hz,col,{flat:true});
  const sx=u+w*fs,sl=Math.min(2,w*.45);sb(sx,-D+.06,F,sl,.75,.42,lit?'#b39a82':'#9a8574');sb(sx,-D+.06,F+.42,sl,.2,.4,lit?'#bea68e':'#a48e7c');
  sb(sx+sl*.25,-D+1.05,F,sl*.5,.42,.3,lit?'#e6d6bd':'#c9b9a2');
  const lp=I.P(...S(u+w*.62,-.5,C-1.05)),lt=I.P(...S(u+w*.62,-.5,C));g.strokeStyle='rgba(60,60,60,.55)';g.lineWidth=Math.max(1,U*.015);g.beginPath();g.moveTo(...lt);g.lineTo(...lp);g.stroke();
  if(lit){const rg=g.createRadialGradient(lp[0],lp[1],0,lp[0],lp[1],U*1.4);rg.addColorStop(0,'rgba(255,236,190,.9)');rg.addColorStop(1,'rgba(255,220,150,0)');g.fillStyle=rg;g.fillRect(lp[0]-U*1.5,lp[1]-U*1.5,U*3,U*3);}
  g.fillStyle=lit?'#fff2cf':'#8a8178';g.beginPath();g.ellipse(lp[0],lp[1],U*.18,U*.09,0,0,7);g.fill();
  if(o.plant){const pp=S(u+w*.08+.3,-D+.35,F);I.box(...(face==='y'?[pp[0]-.2,pp[1]-.2]:[pp[0]-.2,pp[1]-.2]),F,.4,.4,.4,lit?'#d9d3cb':'#aaa49c',{flat:true});I.blob(...S(u+w*.08+.3,-D+.35,F+.85),.42,lit?'#6ea05a':'#4d7a42');}}
 g.restore();
 // glass with sky reflection (lights off) or a faint warm sheen (lights on)
 R(u+e,v+e,u+w-e,v+h-e,.012,lit?I.grad(S(u,0,v+h),S(u,0,v),'rgba(255,240,205,.12)','rgba(255,214,150,.06)'):I.grad(S(u,0,v+h),S(u+w,0,v),'rgba(222,238,250,.40)','rgba(150,180,206,.24)'));
 if(!lit){g.save();I.path([S(u+e,.02,v+e),S(u+e+Math.min(w,h)*.55,.02,v+e),S(u+e+Math.min(w,h)*.15,.02,v+h-e),S(u+e,.02,v+h-e)]);g.fillStyle='rgba(255,255,255,.2)';g.fill();
  I.path([S(u+w*.5,.02,v+e),S(u+w*.5+Math.min(w,h)*.22,.02,v+e),S(u+w*.5+Math.min(w,h)*.04,.02,v+h-e),S(u+w*.5-Math.min(w,h)*.08,.02,v+h-e)]);g.fillStyle='rgba(255,255,255,.12)';g.fill();g.restore();}
 for(const m of o.mul||[])R(m-.03,v+e,m+.03,v+h-e,.016,FRAME);
 if(o.sill!==false)R(u-.04,v-.06,u+w+.04,v,.03,'#d4d9de');}

/* frameless glass balustrade on plane face 'y' (y=P) or 'x' (x=P), from a0 to a1, z0..z1 */
function rail(face,P,a0,a1,z0,z1){const S=(a,z)=>face==='y'?[a,P,z]:[P,a,z],g=I.g;
 I.fill([S(a0,z0),S(a1,z0),S(a1,z1),S(a0,z1)],I.grad(S(a0,z1),S(a0,z0),'rgba(206,229,243,.42)','rgba(170,205,228,.30)'));
 g.save();g.lineCap='round';g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=Math.max(1,U*.012);for(let a=a0+1.3;a<a1-.2;a+=1.3){g.beginPath();g.moveTo(...I.P(...S(a,z0)));g.lineTo(...I.P(...S(a,z1)));g.stroke();}
 g.strokeStyle='#9da6b0';g.lineWidth=U*.05;g.beginPath();g.moveTo(...I.P(...S(a0,z0+.02)));g.lineTo(...I.P(...S(a1,z0+.02)));g.stroke();
 g.strokeStyle='#d5dae0';g.lineWidth=U*.045;g.beginPath();g.moveTo(...I.P(...S(a0,z1)));g.lineTo(...I.P(...S(a1,z1)));g.stroke();
 g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=U*.015;g.beginPath();g.moveTo(...I.P(...S(a0,z1+.02)));g.lineTo(...I.P(...S(a1,z1+.02)));g.stroke();g.restore();}

const roundProf=(x0,x1,z0,z1,r)=>{const p=[[x0,z0],[x1,z0]];for(let i=0;i<=8;i++){const a=i/8*Math.PI/2;p.push([x1-r+r*Math.cos(a),z1-r+r*Math.sin(a)]);}for(let i=0;i<=8;i++){const a=Math.PI/2+i/8*Math.PI/2;p.push([x0+r+r*Math.cos(a),z1-r+r*Math.sin(a)]);}return p;};
const wallShadow=(x0,z0,x1,z1,a=.26)=>blurFill([[x0-.07,Y1+.003,z0-.09],[x1-.04,Y1+.003,z0-.09],[x1-.04,Y1+.003,z1-.06],[x0-.07,Y1+.003,z1-.06]],`rgba(30,40,55,${a})`,.07);

/* attachable parts: shadow (drawn straight onto the part layer) and geometry (its pixels form the layer mask) */
const parts={
 'villa-roof-solar':{slot:'roof',shadow:()=>{for(const r of ROWS)blurFill([[r.x-.05,r.y-DEP-.25,RZ+.002],[r.x+r.n*(MW+GAP)+.05,r.y-DEP-.25,RZ+.002],[r.x+r.n*(MW+GAP)+.05,r.y+.08,RZ+.002],[r.x-.05,r.y+.08,RZ+.002]],'rgba(30,40,55,.24)',.12);},
  geom:()=>{for(const r of ROWS){const L=r.n*(MW+GAP)-GAP,x0=r.x,xe=x0+L,yb=r.y-DEP;
   I.box(x0+.05,yb-.04,RZ,L-.1,.07,RISE+.2,METAL);
   for(let k=0;k<=r.n;k+=Math.max(1,Math.floor(r.n/4))){const xs=Math.min(xe-.06,x0+k*(MW+GAP));I.fill([[xs+.05,r.y,RZ],[xs+.05,yb,RZ],[xs+.05,yb,RZ+RISE+.18],[xs+.05,r.y,RZ+.16]],I.shade('#9aa3ad',[1,0,0],.7));}
   I.box(x0,r.y-.05,RZ,L,.08,.1,'#9aa3ad');I.box(x0,yb-.05,RZ,L,.08,.1,'#9aa3ad');
   I.panels(t,[x0,r.y,RZ+.16],[1,0,0],[0,-1,.38],r.n,1,MW,ML,GAP);
   I.fill([[x0,r.y,RZ+.16],[xe,r.y,RZ+.16],[xe,r.y+.02,RZ+.11],[x0,r.y+.02,RZ+.11]],'#8a939d');}}},
 'villa-inverter':{slot:'wall',shadow:()=>wallShadow(IX0,IZ0,IX1,IZ1,.3),
  geom:()=>{I.box(IX0+.04,Y1,IZ0+.12,IX1-IX0-.08,.15,IZ1-IZ0-.2,'#e3e7eb',{flat:true});I.tex(RT,[IX0,Y1+.152,IZ1],[IX1,Y1+.152,IZ1],[IX0,Y1+.152,IZ0]);}},
 'villa-meter':{slot:'meter',shadow:()=>wallShadow(MX0,MZ0,MX1,MZ1,.24),
  geom:()=>{const y=Y1+.13;wbox(MX0,Y1,MZ0,MX1-MX0,.13,MZ1-MZ0,'#f7f8f9',{k:[.92,.86,.95,.9,.99]});
   I.onY(y+.002,MX0+.07,MZ1-.27,MX1-.07,MZ1-.07,'#d9dee3');I.onY(y+.004,MX0+.1,MZ1-.23,MX1-.1,MZ1-.12,I.grad([MX0,y,MZ1-.12],[MX0,y,MZ1-.23],'#3f5a52','#2c3e39'));
   I.onY(y+.002,MX0+.06,MZ0+.08,MX1-.06,MZ0+.34,'rgba(150,165,180,.35)');for(let k=0;k<4;k++)I.onY(y+.004,MX0+.09+k*.085,MZ0+.14,MX0+.15+k*.085,MZ0+.28,k===3?'#e05a4a':'#55606c');
   I.onY(y+.004,MX1-.12,MZ0+.42,MX1-.08,MZ0+.46,'#46c46b');}},
 'villa-battery':{slot:'battery',shadow:()=>{I.shadow(BX0,BY0,BX1-BX0,BY1-BY0,.18,.3,.03);blurFill([[BX0-.08,Y1+.003,.02],[BX1-.05,Y1+.003,.02],[BX1-.05,Y1+.003,BH-.05],[BX0-.08,Y1+.003,BH-.05]],'rgba(30,40,55,.22)',.08);},
  geom:()=>{I.prism(roundProf(BX0,BX1,0,BH,.09),BY0,BY1,'#f6f7f8',{amb:.8,side:I.grad([BX0,BY1,BH],[BX0,BY1,0],'#eceef1','#dadee2')});
   const y=BY1+.004,cx=(BX0+BX1)/2;I.onY(y,BX0,0,BX1,.06,'#8f98a2');I.onY(y,BX0+.02,.66,BX1-.02,.675,'rgba(120,130,140,.28)');
   {const g=I.g;g.save();g.shadowColor='rgba(60,200,255,.9)';g.shadowBlur=U*.18;I.onY(y+.002,cx-.022,.32,cx+.022,1.08,'#5fd2f5');g.restore();I.onY(y+.003,cx-.01,.34,cx+.01,1.06,'#d9f6ff');}
   I.onY(y,cx-.16,1.15,cx+.16,1.19,'#9aa3ad');}}};

/* the whole scene; `on` = set of parts drawn in place (in correct depth order) */
function scene(on=new Set()){const part=k=>{if(on.has(k)){parts[k].shadow();parts[k].geom();}};
 // plot
 I.shadow(0,0,PX,PY,1.1,.14,.4);
 I.box(0,0,-.35,PX,PY,.35,'#e9ebee',{flat:true});tiles(0,0,PX,PY,0,I.mix('#eef0f2',.99),1.0);
 tiles(9.7,Y1,13,PY,.004,I.mix('#dfe2e6',.99),.5,'rgba(140,148,160,.2)');                           // driveway
 tiles(4.55,Y1+.9,5.75,PY,.004,I.mix('#e3e5e8',.99),.6,'rgba(140,148,160,.2)');                      // entrance path
 // back planters + slim trees
 wbox(15.5,.35,0,.6,8.6,.28,'#d3d7dc');I.fill([[15.57,.42,.281],[16.03,.42,.281],[16.03,8.88,.281],[15.57,8.88,.281]],'#7b6a55');
 I.tree(15.8,1.2,.82,'#7aa865');for(let y=2.4;y<8.8;y+=.95)I.bush(15.78,y,.42,'#86ad6f');
 // ground floor
 I.shadow(X0,Y0,X1-X0+.4,Y1-Y0+.5,.7,.22,.12);
 wbox(X0,Y0,0,X1-X0,Y1-Y0,GZ,WALL);
 I.onY(Y1+.004,X0,0,X1,.16,I.mix('#b9c0c7',.92));I.onX(X1+.004,Y0,0,Y1,.16,I.mix('#b9c0c7',.98));
 win('y',Y1,2.35,.3,2.05,2.7,{mul:[3.375],floor:0,ceil:3.25});
 I.onY(Y1+.004,4.6,0,5.7,2.62,'#e4e7ea');I.onY(Y1+.008,4.66,0,5.64,2.56,I.grad([4.66,Y1,2.56],[5.64,Y1,0],'#59626d','#3e4650'));I.onY(Y1+.012,5.47,.75,5.51,1.75,'#d9dee3');   // door
 I.onY(Y1+.006,9.85,0,12.75,2.62,'#d3d8dd');I.onY(Y1+.01,9.95,0,12.65,2.52,I.grad([0,Y1,2.52],[0,Y1,0],'#e7eaed','#cdd2d8'));      // roll-up garage door
 {const g=I.g;g.save();g.lineWidth=Math.max(1,U*.016);for(let z=.26;z<2.5;z+=.26){g.strokeStyle='rgba(120,128,140,.38)';g.beginPath();g.moveTo(...I.P(9.95,Y1+.012,z));g.lineTo(...I.P(12.65,Y1+.012,z));g.stroke();g.strokeStyle='rgba(255,255,255,.5)';g.beginPath();g.moveTo(...I.P(9.95,Y1+.012,z-.03));g.lineTo(...I.P(12.65,Y1+.012,z-.03));g.stroke();}g.restore();}
 I.onY(Y1+.012,9.95,2.3,12.65,2.52,'rgba(150,158,168,.35)');
 win('x',X1,3.0,.75,2.6,1.85,{mul:[4.3],floor:0,ceil:3.25});win('x',X1,6.2,.75,1.6,1.85,{floor:0,ceil:3.25,plant:false});
 blurFill([[X0,Y1+.006,GZ],[X1,Y1+.006,GZ],[X1,Y1+.006,GZ-.25],[X0,Y1+.006,GZ-.25]],'rgba(30,40,55,.12)',.05);
 // wall equipment
 part('villa-meter');part('villa-inverter');
 // entrance canopy
 wbox(4.35,Y1,2.82,1.6,.85,.1,'#f2f4f6');{const p=I.P(5.15,Y1+.6,2.8),g=I.g;if(I.lit){const rg=g.createRadialGradient(p[0],p[1],0,p[0],p[1],U*.9);rg.addColorStop(0,'rgba(255,225,160,.75)');rg.addColorStop(1,'rgba(255,215,150,0)');g.fillStyle=rg;g.fillRect(p[0]-U,p[1]-U,U*2,U*2);}}
 part('villa-battery');
 // first-floor slab
 wbox(X0-.06,Y0-.06,GZ,X1-X0+.12,Y1-Y0+.14,SZ-GZ,'#eef0f2');
 tiles(X0,LY,LX,Y1+.06,SZ+.002,I.mix('#e9e7e3',.99),.6,'rgba(150,145,138,.28)');           // terrace deck
 // upper floor, left block (behind the terrace)
 wbox(X0,Y0,SZ,LX-X0,LY-Y0,RZ-SZ,WALL,{top:'#e5e8eb'});
 win('y',LY,2.3,SZ+.08,3.85,2.85,{mul:[3.58,4.86],floor:SZ,ceil:RZ-.15});
 // terrace furniture
 for(const x of [2.55,3.55]){wbox(x,7.1,SZ,.65,1.45,.22,'#e9ecef');wbox(x,7.1,SZ+.22,.65,.4,.38,'#e9ecef');I.fill([[x+.05,7.5,SZ+.225],[x+.6,7.5,SZ+.225],[x+.6,8.5,SZ+.225],[x+.05,8.5,SZ+.225]],'#d7dde3');}
 wbox(5.55,6.65,SZ,.6,.6,.5,'#c4cad1');for(const [dx,dy,dz,r] of [[0,0,.42,.36],[.15,.12,.32,.28],[-.12,.15,.3,.28],[.04,-.04,.68,.3]])I.blob(5.85+dx,6.95+dy,SZ+.5+dz,r,'#6f9f5c');
 // upper floor, right block
 wbox(LX,Y0,SZ,X1-LX,Y1-Y0,RZ-SZ,WALL,{top:'#e5e8eb'});
 I.onY(Y1+.004,LX,SZ,8.55,RZ,I.grad([LX,Y1,RZ],[LX,Y1,SZ],I.mix('#e3e6ea',.84),I.mix('#d9dde2',.8)));
 {const g=I.g;g.save();g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=Math.max(1,U*.014);for(let x=LX+.27;x<8.5;x+=.27){g.beginPath();g.moveTo(...I.P(x,Y1+.006,SZ));g.lineTo(...I.P(x,Y1+.006,RZ));g.stroke();}g.restore();}
 win('y',Y1,8.8,SZ+.35,3.7,2.45,{mul:[10.03,11.27],floor:SZ,ceil:RZ-.15,sofa:.3});
 win('x',X1,2.5,SZ+.35,5.9,2.45,{mul:[3.98,5.45,6.93],floor:SZ,ceil:RZ-.15,sofa:.4});
 blurFill([[X0,LY+.006,RZ],[LX,LY+.006,RZ],[LX,LY+.006,RZ-.22],[X0,LY+.006,RZ-.22]],'rgba(30,40,55,.1)',.05);
 // terrace balustrade (left edge, then front)
 rail('x',X0-.03,LY,Y1+.06,SZ,SZ+1.05);rail('y',Y1+.06,X0-.03,LX,SZ,SZ+1.05);
 // roof: back parapets and rails, PV, front parapets and rails
 const RT_=RZ+PH,RT1=RT_+.95;
 wbox(X0,Y0,RZ,X1-X0,.2,PH,'#f1f3f5');wbox(X0,Y0,RZ,.2,LY-Y0,PH,'#f1f3f5');wbox(LX,LY,RZ,.2,Y1-LY,PH,'#f1f3f5');
 rail('y',Y0+.1,X0+.1,X1-.1,RT_,RT1);rail('x',X0+.1,Y0+.1,LY-.1,RT_,RT1);rail('x',LX+.1,LY-.1,Y1-.1,RT_,RT1);
 part('villa-roof-solar');
 wbox(X0,LY-.2,RZ,LX-X0,.2,PH,'#f1f3f5');wbox(X1-.2,Y0,RZ,.2,Y1-Y0,PH,'#f1f3f5');wbox(LX,Y1-.2,RZ,X1-LX,.2,PH,'#f1f3f5');
 rail('y',LY-.1,X0+.1,LX+.1,RT_,RT1);rail('x',X1-.1,Y0+.1,Y1-.1,RT_,RT1);rail('y',Y1-.1,LX+.1,X1-.1,RT_,RT1);
 // front planter strips and a slim tree
 I.tree(1.3,10.9,.8,'#7aa865');
 wbox(.4,13.2,0,3.9,.55,.3,'#d3d7dc');I.fill([[.47,13.27,.301],[4.23,13.27,.301],[4.23,13.68,.301],[.47,13.68,.301]],'#7b6a55');for(let x=.8;x<4.2;x+=.75)I.bush(x,13.45,.42,'#86ad6f');
 wbox(6.2,13.2,0,2.6,.55,.3,'#d3d7dc');I.fill([[6.27,13.27,.301],[8.73,13.27,.301],[8.73,13.68,.301],[6.27,13.68,.301]],'#7b6a55');for(let x=6.6;x<8.7;x+=.75)I.bush(x,13.45,.42,'#86ad6f');
}
/* cable routes (metres) */
const CABLES={
 'roof>wall':[[7.85,7.95,RZ+.14],[7.85,Y1+.03,RZ+.14],[7.85,Y1+.03,IZ1-.03]],
 'wall>battery':[[7.55,Y1+.03,IZ0+.02],[7.55,Y1+.03,.22],[BX1+.01,Y1+.03,.22],[BX1+.01,Y1+.1,.26]],
 'wall>meter':[[8.25,Y1+.03,IZ0+.02],[8.25,Y1+.03,1.15],[MX0,Y1+.03,1.15]],
 'meter>grid':[[9.1,Y1+.03,MZ0],[9.1,Y1+.03,.03],[9.1,PY,0]]};
// render
const draw=fn=>{const c=I.init(CW,CH,U,OX,OY);fn();return c;};
const cablePx=(I.init(CW,CH,U,OX,OY),Object.fromEntries(Object.entries(CABLES).map(([k,p])=>[k,p.map(q=>I.P(...q))])));
const canv={base:draw(()=>scene())};I.lit=true;const litBase=draw(()=>scene());I.lit=false;
for(const k in parts){const F=draw(()=>scene(new Set([k]))),M=draw(parts[k].geom),L=draw(parts[k].shadow),fg=F.getContext('2d');
 fg.globalCompositeOperation='destination-in';fg.drawImage(M,0,0);L.getContext('2d').drawImage(F,0,0);canv[k]=L;}
const boxes={};for(const k in canv)boxes[k]=I.bounds(canv[k]);
const U0=Object.values(boxes).reduce((a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])]);
const W=U0[2]-U0[0],H=U0[3]-U0[1],scale=Math.min(1,1100/W);
const crop=(c,r)=>{const T=document.createElement('canvas');T.width=Math.round((r[2]-r[0])*scale);T.height=Math.round((r[3]-r[1])*scale);const g=T.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(c,r[0],r[1],r[2]-r[0],r[3]-r[1],0,0,T.width,T.height);return T;};
const enc=async T=>{const b=await new Promise(r=>T.toBlob(r,'image/webp',.93));return{webp:await I.b64(b),size:b.size,w:T.width,h:T.height};};
const SFX=I.mirror?'-m':'',f5=v=>+v.toFixed(5),files={},json={base:{},slots:{},cables:{},parts:{}};
const baseT=crop(canv.base,U0),litT=crop(I.overlay(canv.base,litBase),U0);
files['villa-site'+SFX]=await enc(baseT);files['villa-site'+SFX+'-lit']=await enc(litT);json.base={width:baseT.width,height:baseT.height};
for(const k in parts){const r=boxes[k],e=await enc(crop(canv[k],r));files[k+SFX]=e;json.parts[k+SFX]={width:e.w,height:e.h};
 json.slots[parts[k].slot]={x:f5((r[0]-U0[0])/W),y:f5((r[1]-U0[1])/H),w:f5((r[2]-r[0])/W),h:f5((r[3]-r[1])/H),kind:k+SFX};}
json.cables=Object.fromEntries(Object.entries(cablePx).map(([k,p])=>[k,p.map(([x,y])=>[f5((x-U0[0])/W),f5((y-U0[1])/H)])]));
// previews
const all=crop(canv.base,U0),ag=all.getContext('2d');for(const k in parts){const s=json.slots[parts[k].slot],T=crop(canv[k],boxes[k]);ag.drawImage(T,Math.round(s.x*all.width),Math.round(s.y*all.height));}
ag.lineWidth=3;ag.lineJoin='round';ag.lineCap='round';for(const [k,p] of Object.entries(json.cables)){ag.strokeStyle=k==='meter>grid'?'#e0663a':'#3b6cf0';ag.beginPath();p.forEach(([x,y],i)=>{i?ag.lineTo(x*all.width,y*all.height):ag.moveTo(x*all.width,y*all.height);});ag.stroke();}
window.__villa={files,json,previews:{all:I.onWhite(all),base:I.onWhite(baseT),lit:I.onWhite(baseT,litT)}};
return {json:JSON.stringify(json),sizes:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,[v.w,v.h,Math.round(v.size/1024)+'KB']]))};
})()
