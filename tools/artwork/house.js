(async()=>{const I=ISO,t=I.moduleTex();
/* drawn twice on identical canvases: normal and with the lights on (ISO.lit) for the lit-window overlay */
const draw=lit=>{I.lit=lit;const c=I.init(2600,2000,74,1150,560);
// plot
I.shadow(0,0,17,13.5,1.2,.16,.4);
I.slab(0,0,17,13.5,.35,'#d9dde2',1.1);
I.fill([[0,9.2,0],[10.6,9.2,0],[10.6,13.5,0],[0,13.5,0]],I.grad([0,9.2,0],[10.6,13.5,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75)));        // lawn
I.fill([[0,0,0],[2.2,0,0],[2.2,9.2,0],[0,9.2,0]],I.grad([0,9.2,0],[10.6,13.5,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75)));
I.tree(13,1.4,.95,'#579f45');
// house body + back roof slope first
const X0=2.6,X1=11.6,Y0=1.8,Y1=8.2,H=5.6,R=2.5,o=.45,ym=(Y0+Y1)/2;
I.shadow(X0,Y0,X1-X0+4,Y1-Y0+.6,.7,.24,.15);
I.fill([[X0-o,Y0-o,H],[X1+o,Y0-o,H],[X1+o,ym,H+R],[X0-o,ym,H+R]],I.shade('#3b4757',[0,-.7,.7],.6));
I.box(X0,Y0,0,X1-X0,Y1-Y0,H,'#eceef0');
I.onY(Y1+.004,X0,0,X1,.35,I.shade('#8a949f',[0,1,0]));I.onX(X1+.004,Y0,0,Y1,.35,I.shade('#8a949f',[1,0,0]));   // plinth
I.onY(Y1+.004,X0,2.75,X1,2.9,I.shade('#c9ced4',[0,1,0]));                                                      // floor band
for(const u of [3.2,5.3]) I.window('y',Y1,u,.9,1.5,1.5);
I.onY(Y1+.006,7.3,0,8.5,2.3,I.grad([7.3,Y1,2.3],[8.5,Y1,0],'#4a5566','#2f3846'));I.onY(Y1+.01,8.25,1.1,8.33,1.3,'#d7dce2');  // door
I.fill([[7.1,Y1,2.45],[8.7,Y1,2.45],[8.7,Y1+.8,2.45],[7.1,Y1+.8,2.45]],I.shade('#5d6876',[0,0,1]));                         // canopy
I.window('y',Y1,9.4,.9,1.7,1.5);
for(const u of [3.2,5.3,7.5,9.6]) I.window('y',Y1,u,3.5,1.4,1.4);
I.window('x',X1,3,3.6,1.6,1.3);I.window('x',X1,5.6,3.6,1.4,1.3);
// front roof slope with panels, then gable
I.fill([[X0-o,Y1+o,H],[X1+o,Y1+o,H],[X1+o,ym,H+R],[X0-o,ym,H+R]],I.grad([X0,ym,H+R],[X0,Y1+o,H],I.shade('#4a5768',[0,.7,.7],.66),I.shade('#3a4555',[0,.7,.7],.6)));
I.fill([[X0-o,Y1+o,H],[X1+o,Y1+o,H],[X1+o,Y1+o,H-.12],[X0-o,Y1+o,H-.12]],'#2c3440');
const slope=[0,-(Y1+o-ym),R],sl=Math.hypot(slope[1],slope[2]),up=slope,along=[1,0,0];
I.panels(t,[X0+.35,Y1+o-.25*(Y1+o-ym)/sl*1, H+.25*R/sl],along,up,7,2,1.12,1.72,.05);
I.fill([[X1,Y0,H],[X1,Y1,H],[X1,ym,H+R]],I.shade('#eceef0',[1,0,0],.6));
I.fill([[X1+o,Y0-o,H],[X1+o,ym,H+R],[X1+o,ym,H+R+.14],[X1+o,Y0-o,H+.14]],'#2c3440');
I.fill([[X1+o,ym,H+R],[X1+o,Y1+o,H],[X1+o,Y1+o,H+.14],[X1+o,ym,H+R+.14]],'#3a4452');
I.window('x',X1,ym-.45,H+.5,.9,1.1,{mullion:false});
// chimney
I.box(4.2,3,H+.9,.9,.9,2.3,'#9aa3ad');
// garage with flat roof and panels
const GX=X1,GW=4.4,GY0=3.4,GY1=8.6,GH=3.1;
I.shadow(GX,GY0,GW,GY1-GY0,.5,.2,.1);
I.box(GX,GY0,0,GW,GY1-GY0,GH,'#e4e7ea');
I.box(GX-.05,GY0-.05,GH,GW+.1,GY1-GY0+.1,.25,'#c7ccd2');
I.onY(GY1+.006,GX+.5,0,GX+3.9,2.3,I.grad([0,GY1,2.3],[0,GY1,0],'#cfd4da','#aab2bb'));
for(let k=0;k<6;k++)I.onY(GY1+.01,GX+.5,.35+k*.33,GX+3.9,.37+k*.33,'rgba(120,130,140,.45)');
I.window('x',GX+GW,GY0+1.3,1,1.4,1.2);
for(const yF of [5.9,8.2]){I.box(GX+.45,yF-1.45,GH+.25,3.45,.08,.65,'#9aa4ae');I.panels(t,[GX+.45,yF,GH+.32],[1,0,0],[0,-1,.38],3,1,1.1,1.55,.05);}
// wall-mounted inverter + meter
I.box(GX+GW,GY0+.5,1.2,.18,.6,.8,'#f4f6f8');I.onX(GX+GW+.19,GY0+.62,1.65,GY0+.98,1.85,'#3a8d6a');
// driveway and garden
I.slab(GX+.4,GY1,3.6,13.5-GY1,.02,'#c3c8ce',.6);
for(const u of [2.8,4.3,5.8]) I.bush(u,Y1+.9,.9);I.bush(9.6,Y1+.9,.85,'#5aa646');
I.tree(1.6,11.3,1.15,'#62aa4c');
I.fill([[0,13.5,0],[10.6,13.5,0],[10.6,13.5,.9],[0,13.5,.9]],'rgba(0,0,0,0)');
I.lit=false;return c;};
const c=draw(false),cl=draw(true);
return await I.export(c,'solar-home',{lit:cl});
})()
