/* EV charger: a pedestal charger at the head of a green parking bay, a white electric car plugged in at its nose port. */
(async()=>{const I=ISO;const c=I.init(1700,1250,110,600,330);
const PW=8.2,PD=5.0;
I.shadow(0,0,PW,PD,1,.16,.3);
I.slab(0,0,PW,PD,.3,'#d9dde2',1.0);
// asphalt bay with a green EV surface and white lines; grass strip with a curb at the head of the bay
I.fill([[.25,.7,0],[6.35,.7,0],[6.35,4.3,0],[.25,4.3,0]],I.shade('#6b737d',[0,0,1],.8));
I.fill([[.25,1.15,.004],[6.2,1.15,.004],[6.2,3.85,.004],[.25,3.85,.004]],I.grad([0,1.15,0],[6.2,3.85,0],I.shade('#4fa877',[0,0,1],.82),I.shade('#3f9467',[0,0,1],.8)));
for(const y of [1.05,3.85])I.fill([[.25,y,.008],[6.2,y,.008],[6.2,y+.1,.008],[.25,y+.1,.008]],'rgba(255,255,255,.95)');
I.fill([[6.1,1.05,.008],[6.2,1.05,.008],[6.2,3.95,.008],[6.1,3.95,.008]],'rgba(255,255,255,.95)');
I.fill([[6.95,0,0],[PW,0,0],[PW,PD,0],[6.95,PD,0]],I.grad([6.95,0,0],[PW,PD,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75)));
I.box(6.55,.25,0,.4,4.5,.14,'#cfd4da',{flat:true});
// car geometry (nose towards +x)
const CX=1.05,Y0=1.57,Y1=3.43,WR=.36,WB=[.85,3.72];
const wheel=(x,y,near)=>{I.cyl([x,y,WR],'y',WR,.24,'#2b2f36',{n:40,cap:'#30353d'});if(!near)return;const Y=y+.245;
 I.discY(x,Y,WR,.25,I.grad([x,Y,WR+.25],[x,Y,WR-.25],'#eef1f4','#9aa3ad'));I.discY(x,Y+.002,WR,.205,'#c3c9d0');
 for(let k=0;k<5;k++){const a=k/5*2*Math.PI+.3,b=a+.38;I.fill([[x+.07*Math.cos(a),Y+.004,WR+.07*Math.sin(a)],[x+.19*Math.cos(a),Y+.004,WR+.19*Math.sin(a)],[x+.19*Math.cos(b),Y+.004,WR+.19*Math.sin(b)],[x+.07*Math.cos(b),Y+.004,WR+.07*Math.sin(b)]],'#59616b');}
 I.discY(x,Y+.006,WR,.055,'#8a939d');};
I.shadow(CX+.1,Y0+.05,4.45,Y1-Y0-.1,.32,.42,.08);
for(const wx of WB)wheel(CX+wx,Y0+.02,false);
/* smooth profile: Catmull-Rom through key points; a point flagged with a third value 1 stays a sharp corner */
const smooth=(k,n=6)=>{const out=[],N=k.length;for(let i=0;i<N;i++){const p0=k[(i-1+N)%N],p1=k[i],p2=k[(i+1)%N],p3=k[(i+2)%N];if(p1[2]||p2[2]){out.push([p1[0],p1[1]]);continue;}
 for(let j=0;j<n;j++){const t=j/n,t2=t*t,t3=t2*t;out.push([0,1].map(q=>.5*(2*p1[q]+(-p0[q]+p2[q])*t+(2*p0[q]-5*p1[q]+4*p2[q]-p3[q])*t2+(-p0[q]+3*p1[q]-3*p2[q]+p3[q])*t3)));}}return out.map(([x,z])=>[CX+x,z]);};
const body=smooth([[.14,.27,1],[4.5,.27,1],[4.66,.42],[4.66,.62],[4.5,.76],[4.1,.86],[3.5,.95],[3.2,.985],[1.5,1.0],[.5,1.0],[.13,.93],[.02,.72],[.03,.42]]);
const glass=I.grad([CX+2,Y1,1.45],[CX+2,Y1,.98],'#61778f','#1b2531');
I.prism(body,Y0,Y1,'#fbfcfd',{amb:.8,side:I.grad([CX,Y1,1],[CX,Y1,.27],'#eef1f4','#c3cad2')});
const S=Y1+.004;
// rocker, wheel arches (dark) and the near wheels, clipped so they sit inside their arches
I.fill([[CX+.25,S,.27],[CX+4.4,S,.27],[CX+4.4,S,.36],[CX+.25,S,.36]],'#3a4049');
for(const wx of WB){const x=CX+wx,arc=[];for(let i=0;i<=24;i++){const a=Math.PI*i/24;arc.push([x+.44*Math.cos(a),S,WR+.44*Math.sin(a)]);}
 I.fill([[x+.44,S,.27],...arc,[x-.44,S,.27]],'#2a2f36');
 const g=I.g;g.save();I.path([[x+1.2,S,-.6],[x+1.2,S,.27],[x+.44,S,.27],...arc,[x-.44,S,.27],[x-1.2,S,.27],[x-1.2,S,-.6]]);g.clip();wheel(x,Y1-.26,true);g.restore();}
I.fill([[CX+.3,S+.001,.93],[CX+4.0,S+.001,.88],[CX+4.0,S+.001,.9],[CX+.3,S+.001,.95]],'rgba(255,255,255,.7)');
// door seams, handles, charge-port light on the nose, headlight
const seam=(x0,z0,x1,z1)=>{const g=I.g;g.strokeStyle='rgba(120,130,142,.55)';g.lineWidth=Math.max(1,I.U*.012);g.beginPath();g.moveTo(...I.P(x0,S+.002,z0));g.lineTo(...I.P(x1,S+.002,z1));g.stroke();};
seam(CX+1.95,.38,CX+1.95,.99);seam(CX+3.12,.4,CX+3.18,.97);seam(CX+.95,.42,CX+.88,.99);
for(const x of [1.45,2.62])I.fill([[CX+x,S+.003,.84],[CX+x+.24,S+.003,.84],[CX+x+.24,S+.003,.88],[CX+x,S+.003,.88]],'#c2c9d1');
I.fill([[CX+4.3,Y1+.004,.72],[CX+4.58,Y1+.004,.64],[CX+4.58,Y1+.004,.68],[CX+4.3,Y1+.004,.77]],'#2c333d');
// greenhouse: windshield, glass roof, rear glass; side windows with pillars
const cab=smooth([[.38,.985,1],[3.22,.985,1],[2.95,1.12],[2.45,1.38],[2.05,1.46],[1.3,1.48],[.85,1.40],[.55,1.2]],5),CY0=Y0+.17,CY1=Y1-.17,nc=cab.length;
const glassF=I.grad([CX+3.2,CY0,.98],[CX+2.3,CY1,1.42],'#4a6078','#1f2b38');
I.prism(cab,CY0,CY1,'#fbfcfd',{amb:.8,side:glass,facet:(i,n)=>{const x=(cab[i][0]+cab[(i+1)%nc][0])/2-CX;return x>2.3?glassF:x<.95?'#26313d':null;}});
// dark glass sunroof on the roof facets
I.fill([[CX+1.1,CY0+.12,1.485],[CX+2.1,CY0+.12,1.465],[CX+2.1,CY1-.12,1.465],[CX+1.1,CY1-.12,1.485]],'#2a3542');
{const P=CY1+.003,pil=(pts)=>I.fill(pts.map(([x,z])=>[CX+x,P,z]),'#1a2029');
 pil([[1.9,.98],[2.0,.98],[2.0,1.46],[1.9,1.46]]);pil([[3.25,.98],[3.12,.98],[2.25,1.42],[2.32,1.42]]);
 I.fill([[CX+.4,P,.98],[CX+3.2,P,.98],[CX+3.2,P,1.01],[CX+.4,P,1.01]],'#c9d0d7');
 const g=I.g;g.save();I.path([[CX+2.1,P+.002,1.0],[CX+2.5,P+.002,1.0],[CX+2.2,P+.002,1.4],[CX+2.06,P+.002,1.42]]);g.fillStyle='rgba(255,255,255,.14)';g.fill();g.restore();}
// side mirror
I.box(CX+3.02,Y1-.02,.96,.14,.17,.09,'#f2f4f6');I.box(CX+3.02,Y1+.13,.95,.14,.02,.02,'#2c333d');
// headlight strip and lower grille on the nose
const nose=(z0,z1,col)=>I.fill([[CX+4.56,Y0+.08,z1],[CX+4.56,Y1-.08,z1],[CX+4.64,Y1-.08,z0],[CX+4.64,Y0+.08,z0]],col);
I.fill([[CX+4.56,Y0+.1,.76],[CX+4.56,Y0+.45,.76],[CX+4.6,Y0+.45,.7],[CX+4.6,Y0+.1,.7]],'#e8f2ff');I.fill([[CX+4.56,Y1-.45,.76],[CX+4.56,Y1-.1,.76],[CX+4.6,Y1-.1,.7],[CX+4.6,Y1-.45,.7]],'#e8f2ff');
// nose charge port (flap open) with the plug
const PX=CX+4.66,PY=(Y0+Y1)/2;
I.onX(PX+.004,PY-.13,.54,PY+.13,.66,'#20262e');I.onX(PX+.008,PY-.1,.565,PY+.1,.635,'#39d17f');
I.box(PX,PY-.07,.55,.2,.14,.1,'#353b44');
// pedestal charger on the grass strip
const QX=7.05,QY=1.1,QW=.42,QD=.34,QH=1.5;
I.shadow(QX,QY,QW,QD,.2,.3,.06);
I.box(QX-.1,QY-.1,0,QW+.2,QD+.2,.12,'#c9ced4');
I.box(QX,QY,.12,QW,QD,QH-.12,'#f3f5f7');
I.box(QX-.03,QY-.03,QH,QW+.06,QD+.06,.1,'#3a424d');
I.onY(QY+QD+.004,QX+.04,.25,QX+QW-.04,QH-.06,I.grad([QX,QY+QD,QH],[QX,QY+QD,.2],'#3d4652','#262d36'));
I.onY(QY+QD+.008,QX+.08,1.0,QX+QW-.08,1.32,I.grad([QX,QY+QD,1.32],[QX+QW,QY+QD,1.0],'#7fe0ff','#2b8ec4'));
I.onY(QY+QD+.008,QX+.1,1.2,QX+.2,1.24,'rgba(255,255,255,.75)');I.onY(QY+QD+.008,QX+.1,1.12,QX+.28,1.15,'rgba(255,255,255,.55)');
I.onY(QY+QD+.008,QX+.07,.86,QX+QW-.07,.9,'#39d17f');
I.onX(QX+QW+.004,QY+.04,.25,QY+.08,QH-.06,'#39d17f');
// holster with the cable outlet, then the cable: down to the ground, across, up to the port
I.box(QX+.12,QY+QD,.58,.18,.1,.16,'#2c333d');
I.cable([[QX+.21,QY+QD+.1,.6],[QX+.15,QY+QD+.45,.2],[QX-.2,QY+QD+.75,.03],[PX+.75,PY+.05,.03],[PX+.4,PY+.02,.12],[PX+.22,PY,.6]],.075);
// planting
I.bush(7.7,4.3,.75,'#5aa646');I.bush(7.75,.3,.6,'#4e9a3e');
return await I.export(c,'ev-charger');
})()
