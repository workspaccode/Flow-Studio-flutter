(async()=>{const I=ISO;const c=I.init(3000,2400,48,1450,640),t=I.moduleTex();
const CLAD='#dfe5ec',ROOF='#56606d';
const ribs=(face,P0,u0,u1,v0,v1,step=.45)=>{const g=I.g;g.save();g.strokeStyle='rgba(90,105,125,.16)';g.lineWidth=Math.max(1,I.U*.03);for(let u=u0+step;u<u1;u+=step){g.beginPath();const a=face==='x'?I.P(P0+.01,u,v0):I.P(u,P0+.01,v0),b=face==='x'?I.P(P0+.01,u,v1):I.P(u,P0+.01,v1);g.moveTo(...a);g.lineTo(...b);g.stroke();}g.restore();};
I.shadow(0,0,34,21,1.4,.15,.5);
I.slab(0,0,34,21,.4,'#d3d7dc',1.5);
I.fill([[0,18.5,0],[12,18.5,0],[12,21,0],[0,21,0]],I.grad([0,18,0],[12,21,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75)));
// chimney (back) and tanks (back right)
I.cyl([20.5,2.2,0],'z',.75,15,'#c9ced4',{n:40});
for(const z of [11.6,13.4])I.cyl([20.5,2.2,z],'z',.765,.8,'#d3483d',{n:40,noCap:true});{const p=I.P(20.5,2.2,15),g=I.g;g.beginPath();g.ellipse(p[0],p[1],.6*I.U*1.2247,.6*I.U*.7071,0,0,7);g.fillStyle='#3a4250';g.fill();}
for(const [x,y] of [[28,1.9],[31.4,1.9],[31.4,5.3]]){I.shadow(x-1.4,y-1.4,2.8,2.8,.4,.2,0);I.cyl([x,y,0],'z',1.35,6.2,'#c3ccd5',{n:56});const g=I.g;const p=I.P(x,y,6.2);g.save();g.beginPath();g.ellipse(p[0],p[1],1.35*I.U*1.2247,1.35*I.U*.7071,0,Math.PI,2*Math.PI);g.fillStyle=I.shade('#c3ccd5',[0,0,1],.8);g.fill();g.restore();
 I.cyl([x,y,0],'z',1.36,.3,'#7d8894',{n:56,noCap:true});I.cyl([x,y,4],'z',1.36,.18,'#7d8894',{n:56,noCap:true});I.cyl([x,y,2],'z',1.36,.18,'#7d8894',{n:56,noCap:true});}
// main hall
const X0=3,X1=24,Y0=1.8,Y1=12.5,H=8,R=2.2,o=.35,ym=(Y0+Y1)/2;
I.shadow(X0,Y0,X1-X0,Y1-Y0,.9,.26,.2);
I.fill([[X0-o,Y0-o,H],[X1+o,Y0-o,H],[X1+o,ym,H+R],[X0-o,ym,H+R]],I.shade(ROOF,[0,-.7,.7],.6));
I.box(X0,Y0,0,X1-X0,Y1-Y0,H,CLAD);
ribs('y',Y1,X0,X1,0,H);ribs('x',X1,Y0,Y1,0,H);
I.onY(Y1+.004,X0,0,X1,.6,I.shade('#8e98a3',[0,1,0]));I.onX(X1+.004,Y0,0,Y1,.6,I.shade('#8e98a3',[1,0,0]));
// ribbon windows
I.onY(Y1+.006,X0+.8,5.6,X1-.8,6.6,I.grad([0,Y1,6.6],[0,Y1,5.6],'#9cc3e6','#4b79a3'));for(let u=X0+1.8;u<X1-.8;u+=1.6)I.onY(Y1+.01,u-.04,5.6,u+.04,6.6,'#e9edf1');
I.onX(X1+.006,Y0+.8,5.6,Y1-.8,6.6,I.grad([X1,0,6.6],[X1,0,5.6],'#9cc3e6','#4b79a3'));
// loading docks on +x
for(const [u0,u1] of [[Y0+1.3,Y0+4.5],[Y0+5.6,Y0+8.8]]){I.onX(X1+.008,u0-.2,0,u1+.2,4.5,I.shade('#3c4652',[1,0,0]));I.onX(X1+.012,u0,0,u1,4.2,I.grad([X1,u0,4.2],[X1,u0,0],'#c4cbd3','#9aa4af'));for(let v=.3;v<4.2;v+=.35)I.onX(X1+.016,u0,v,u1,v+.04,'rgba(110,120,132,.5)');I.box(X1,u0-.3,4.5,1.2,u1-u0+.6,.18,'#e0a24a');}
// front roof slope + panels + gable
I.fill([[X0-o,Y1+o,H],[X1+o,Y1+o,H],[X1+o,ym,H+R],[X0-o,ym,H+R]],I.grad([X0,ym,H+R],[X0,Y1+o,H],I.shade(ROOF,[0,.7,.7],.68),I.shade(ROOF,[0,.7,.7],.6)));
I.fill([[X0-o,Y1+o,H],[X1+o,Y1+o,H],[X1+o,Y1+o,H-.15],[X0-o,Y1+o,H-.15]],'#2c3440');
const sl=Math.hypot(Y1+o-ym,R),up=[0,-(Y1+o-ym),R];
I.panels(t,[X0+.4,Y1+o-.3*(Y1+o-ym)/sl,H+.3*R/sl],[1,0,0],up,18,3,1.1,1.72,.05);
I.fill([[X1,Y0,H],[X1,Y1,H],[X1,ym,H+R]],I.shade(CLAD,[1,0,0],.6));ribs('x',X1,Y0+.6,Y1-.6,H,H+R*.4);
I.fill([[X1+o,Y0-o,H],[X1+o,ym,H+R],[X1+o,ym,H+R+.16],[X1+o,Y0-o,H+.16]],'#2c3440');I.fill([[X1+o,ym,H+R],[X1+o,Y1+o,H],[X1+o,Y1+o,H+.16],[X1+o,ym,H+R+.16]],'#3a4452');
// office block (front-left)
const OX0=3,OX1=11,OY0=Y1,OY1=18,OH=4.6;
I.shadow(OX0,OY0,OX1-OX0,OY1-OY0,.6,.22,.1);
I.box(OX0,OY0,0,OX1-OX0,OY1-OY0,OH,'#f3f4f5');I.box(OX0-.08,OY0,OH,OX1-OX0+.16,OY1-OY0+.08,.35,'#3f4a58',{top:'#c3c9d0'});
I.onY(OY1+.006,OX0+.5,.7,OX1-.5,3.9,I.grad([0,OY1,3.9],[0,OY1,.7],'#a3c8ea','#3f6e99'));for(let u=OX0+1.9;u<OX1-.5;u+=1.4)I.onY(OY1+.01,u-.04,.7,u+.04,3.9,'#e9edf1');I.onY(OY1+.01,OX0+.5,2.25,OX1-.5,2.33,'#e9edf1');
I.onX(OX1+.006,OY0+.6,.7,OY1-.6,3.9,I.grad([OX1,0,3.9],[OX1,0,.7],'#a3c8ea','#3f6e99'));for(let u=OY0+1.9;u<OY1-.6;u+=1.4)I.onX(OX1+.01,u-.04,.7,u+.04,3.9,'#e9edf1');
I.panels(t,[OX0+.5,OY1-.6,OH+.45],[1,0,0],[0,-1,.38],6,1,1.1,1.5,.05);I.panels(t,[OX0+.5,OY1-2.9,OH+.45],[1,0,0],[0,-1,.38],6,1,1.1,1.5,.05);
// truck at the dock
const TX=X1+1.6,TY=Y0+6.1;I.shadow(TX,TY,7.6,2.6,.4,.22,.05);
I.box(TX+2.2,TY,1,5.4,2.5,2.7,'#f6f7f9');I.onY(TY+2.5+.006,TX+2.5,1.6,TX+7.3,3.4,'#2f9e6a');
I.box(TX,TY+.1,.8,2.1,2.3,2.2,'#2f6fd0');I.onX(TX+2.1+.006,TY+.4,2,TY+2.1,2.8,'#1d2b3d');I.onY(TY+2.4+.006,TX+.2,2,TX+1.6,2.8,I.grad([0,TY+2.4,2.8],[0,TY+2.4,2],'#a3c8ea','#3f6e99'));
for(const [x,y] of [[TX+.8,TY+2.4],[TX+3.4,TY+2.5],[TX+6.4,TY+2.5]])I.cyl([x,y,.45],'y',.45,.32,'#2b3038',{n:20,cap:'#8c949d'});
// parking bays
{const g=I.g;g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=I.U*.09;for(let x=14;x<=32;x+=2.6){g.beginPath();g.moveTo(...I.P(x,15.6,.02));g.lineTo(...I.P(x,19.8,.02));g.stroke();}g.beginPath();g.moveTo(...I.P(14,15.6,.02));g.lineTo(...I.P(32.2,15.6,.02));g.stroke();}
for(const [x,c] of [[15.3,'#d9dde2'],[20.5,'#2f6fd0'],[25.7,'#e7eaee']]){I.shadow(x-.1,16.2,2.1,3.9,.3,.25,0);I.box(x,16.3,.25,2,3.8,.75,c);I.box(x+.1,17.2,1,1.8,2,.7,c);I.onY(19.2+.004,x+.25,1.05,x+1.75,1.6,'#3a4a5c');I.onX(x+1.9+.004,17.35,1.05,19.05,1.6,'#3a4a5c');}
// greenery
I.tree(1.6,19.8,1.05,'#62aa4c');I.tree(12.8,19.6,1.0,'#579f45');for(const u of [5,7.4,9.6])I.bush(u,OY1+1,.85);
return await I.export(c,'factory');
})()
