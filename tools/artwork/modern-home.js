/* Modern home: two-storey white villa, flat roof with tilted PV rows, glass-railed terrace, garage, lawn and paving.
   Drawn twice on identical canvases (normal and ISO.lit) so the export also yields the lit-window overlay. */
(async()=>{const I=ISO,t=I.moduleTex();
const WALL='#f4f5f6',DARK='#3d4550',ROOF='#c9ced4',WOOD='#b9814f',FR={frame:DARK,mullion:false};
const lawn=()=>I.grad([0,9,0],[12,14,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75));
const vbar=(face,P0,u,v0,v1,w=.06)=>(face==='x'?I.onX:I.onY)(P0+.014,u-w/2,v0,u+w/2,v1,DARK);
// geometry
const AX0=2,AX1=12,AY0=2,AY1=9,AH=3.2;                 // ground floor
const BX0=2,BX1=9.5,BY0=2,BY1=9.8,BZ=AH,BH=3.2;         // upper floor (cantilevers .8 m to the front)
const GX0=AX1,GX1=16.4,GY0=4.2,GY1=AY1,GH=3.0;           // garage
const draw=lit=>{I.lit=lit;const c=I.init(2000,1520,60,850,430);
 // plot, lawn, paving
 I.shadow(0,0,18,14,1.2,.16,.4);
 I.slab(0,0,18,14,.35,'#d9dde2',1.1);
 I.fill([[0,10.2,0],[7.7,10.2,0],[7.7,14,0],[0,14,0]],lawn());I.fill([[0,0,0],[1.5,0,0],[1.5,10.2,0],[0,10.2,0]],lawn());I.fill([[16.9,0,0],[18,0,0],[18,14,0],[16.9,14,0]],lawn());
 I.slab(GX0+.2,GY1,4,14-GY1,.02,'#c3c8ce',.6);
 for(let k=0;k<4;k++)I.fill([[8.1,10.3+k*.95,.005],[9.4,10.3+k*.95,.005],[9.4,10.95+k*.95,.005],[8.1,10.95+k*.95,.005]],I.shade('#bfc5cc',[0,0,1],.8));
 I.tree(.9,1.2,.95,'#579f45');I.bush(.8,6.4,.75,'#5aa646');I.bush(.75,8.4,.8,'#4e9a3e');
 // ground floor volume
 I.shadow(AX0,AY0,GX1-AX0+.6,AY1-AY0+1,.8,.26,.15);
 I.box(AX0,AY0,0,AX1-AX0,AY1-AY0,AH,WALL,{top:'#d8dde2'});
 I.onY(AY1+.004,AX0,0,AX1,.25,I.shade('#8a949f',[0,1,0]));I.onX(AX1+.004,AY0,0,GY0,.25,I.shade('#8a949f',[1,0,0]));
 I.window('y',AY1,2.5,.35,4.9,2.55,FR);for(const u of [3.72,4.95,6.18])vbar('y',AY1,u,.42,2.83);
 I.onY(AY1+.006,7.9,0,9.3,2.6,I.grad([7.9,AY1,2.6],[9.3,AY1,0],WOOD,'#94643b'));I.onY(AY1+.01,9.05,.9,9.12,1.7,'#e9edf1');   // front door
 I.window('y',AY1,9.7,.9,1.9,1.9,FR);
 I.window('x',AX1,AY0+.4,.9,1.4,1.9,FR);
 // terrace deck on the ground-floor roof (right of the upper floor)
 I.fill([[BX1,AY0,AH+.01],[AX1,AY0,AH+.01],[AX1,AY1,AH+.01],[BX1,AY1,AH+.01]],I.shade('#c99a6a',[0,0,1],.8));
 {const g=I.g;g.save();g.strokeStyle='rgba(110,75,45,.35)';g.lineWidth=Math.max(1,I.U*.02);for(let y=AY0+.3;y<AY1;y+=.3){g.beginPath();g.moveTo(...I.P(BX1,y,AH+.012));g.lineTo(...I.P(AX1,y,AH+.012));g.stroke();}g.restore();}
 // upper floor volume
 I.shadow(BX1,BY0,1.2,BY1-BY0,.4,.18,0);
 I.box(BX0,BY0,BZ,BX1-BX0,BY1-BY0,BH,WALL,{top:ROOF});
 I.onY(BY1+.004,BX0,BZ,BX1,BZ+.12,I.shade('#d5dade',[0,1,0]));
 I.window('y',BY1,2.5,BZ+.6,3.9,2.0,FR);for(const u of [3.8,5.1])vbar('y',BY1,u,BZ+.67,BZ+2.53);
 I.onY(BY1+.006,6.8,BZ+.25,BX1-.05,BZ+BH-.25,I.grad([6.8,BY1,BZ+BH],[BX1,BY1,BZ],'#c48c58',WOOD));
 {const g=I.g;g.save();g.strokeStyle='rgba(95,62,35,.38)';g.lineWidth=Math.max(1,I.U*.025);for(let x=6.95;x<BX1-.05;x+=.18){g.beginPath();g.moveTo(...I.P(x,BY1+.008,BZ+.25));g.lineTo(...I.P(x,BY1+.008,BZ+BH-.25));g.stroke();}g.restore();}
 I.window('y',BY1,7.55,BZ+.6,.9,2.0,FR);
 // sliding doors onto the terrace
 I.window('x',BX1,BY0+.7,BZ+.15,6.3,2.5,FR);for(const u of [4.3,6.0,7.7])vbar('x',BX1,u,BZ+.22,BZ+2.58);
 // shade under the cantilever
 {const g=I.g;g.save();I.path([[BX0,AY1+.016,AH],[BX1,AY1+.016,AH],[BX1,AY1+.016,AH-.9],[BX0,AY1+.016,AH-.9]]);g.fillStyle=I.grad([0,AY1,AH],[0,AY1,AH-.9],'rgba(30,45,70,.28)','rgba(30,45,70,0)');g.fill();g.restore();}
 // flat roof: back parapets, PV rows, front parapets
 const RZ=BZ+BH,pp=.3;
 I.box(BX0,BY0,RZ,BX1-BX0,.18,pp,'#e7eaed');I.box(BX0,BY0,RZ,.18,BY1-BY0,pp,'#e7eaed');
 for(const yF of [4.15,6.3,8.45]){I.box(BX0+.55,yF-1.36,RZ+.1,6.0,.06,.56,'#98a2ad');I.panels(t,[BX0+.55,yF,RZ+.14],[1,0,0],[0,-1,.38],5,1,1.1,1.45,.05);}
 I.box(BX0,BY1-.18,RZ,BX1-BX0,.18,pp,'#eef0f2');I.box(BX1-.18,BY0,RZ,.18,BY1-BY0,pp,'#eef0f2');
 // terrace furniture: planter and a lounge bench
 I.box(10.9,AY0+.35,AH,.7,.7,.45,'#7d8894');for(const [dx,dy,dz,r] of [[0,0,.35,.38],[.2,.15,.28,.3],[-.15,.2,.27,.3],[.05,-.05,.6,.3]])I.blob(11.25+dx,AY0+.7+dy,AH+.45+dz,r,'#5aa646');
 I.box(10.3,5.2,AH,.9,2.2,.4,'#e7eaed');I.box(10.3,5.2,AH+.4,.25,2.2,.4,'#e7eaed');I.box(10.55,5.3,AH+.4,.6,2.0,.08,'#9fb6c9');
 // garage
 I.shadow(GX0,GY0,GX1-GX0,GY1-GY0,.5,.2,.1);
 I.box(GX0,GY0,0,GX1-GX0,GY1-GY0,GH,WALL,{top:ROOF});
 I.box(GX0,GY0,GH,GX1-GX0,.15,.22,'#e7eaed');I.box(GX0,GY0,GH,.15,GY1-GY0,.22,'#e7eaed');I.box(GX0,GY1-.15,GH,GX1-GX0,.15,.22,'#eef0f2');I.box(GX1-.15,GY0,GH,.15,GY1-GY0,.22,'#eef0f2');
 I.onY(GY1+.004,GX0,0,GX1,.25,I.shade('#8a949f',[0,1,0]));I.onX(GX1+.004,GY0,0,GY1,.25,I.shade('#8a949f',[1,0,0]));
 I.onY(GY1+.006,GX0+.45,0,GX1-.45,2.45,I.grad([0,GY1,2.45],[0,GY1,0],'#5d6773','#454e59'));
 for(let k=0;k<9;k++)I.onY(GY1+.01,GX0+.45,.2+k*.26,GX1-.45,.22+k*.26,'rgba(255,255,255,.12)');
 I.window('x',GX1,GY0+.6,1.9,3.6,.6,FR);
 // glass railing around the terrace (front edge, right edge)
 const rail=(pts)=>{const g=I.g;I.fill(pts,'rgba(190,222,242,.38)');g.save();g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=Math.max(1,I.U*.03);I.path(pts);g.stroke();g.restore();};
 rail([[AX1-.05,AY0+.05,AH],[AX1-.05,AY1-.05,AH],[AX1-.05,AY1-.05,AH+1.05],[AX1-.05,AY0+.05,AH+1.05]]);
 rail([[BX1,AY1-.05,AH],[AX1-.05,AY1-.05,AH],[AX1-.05,AY1-.05,AH+1.05],[BX1,AY1-.05,AH+1.05]]);
 {const g=I.g;g.save();g.strokeStyle='#aab3bc';g.lineWidth=I.U*.05;g.lineCap='round';g.beginPath();g.moveTo(...I.P(AX1-.05,AY0+.05,AH+1.05));g.lineTo(...I.P(AX1-.05,AY1-.05,AH+1.05));g.lineTo(...I.P(BX1,AY1-.05,AH+1.05));g.stroke();g.restore();}
 // garden
 I.bush(7.2,10.8,.7,'#5aa646');
 I.tree(2.2,12.3,1.1,'#62aa4c');I.tree(17.4,2.4,.9,'#579f45');
 I.lit=false;return c;};
const c=draw(false),cl=draw(true);
return await I.export(c,'modern-home',{lit:cl});
})()
