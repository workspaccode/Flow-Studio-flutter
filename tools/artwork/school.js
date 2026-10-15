(async()=>{const I=ISO;const c=I.init(3000,2300,52,1500,520),t=I.moduleTex();
const W='#f2ede6',ACC='#e0a24a',GRASS=a=>I.grad([0,0,0],[30,22,0],I.shade('#86bd66',[0,0,1],.78),I.shade('#6aa652',[0,0,1],.75));
I.shadow(0,0,30,22,1.4,.15,.5);
I.slab(0,0,30,22,.4,'#dcdfe3',1.2);
I.fill([[0,17,0],[9,17,0],[9,22,0],[0,22,0]],GRASS());I.fill([[26,0,0],[30,0,0],[30,22,0],[26,22,0]],GRASS());
I.tree(28,2.5,1.1,'#5aa646');I.tree(28.2,8.5,1.0,'#62aa4c');
// main block (back) — flat roof, two floors
const BX0=2,BX1=24,BY0=2,BY1=8,BH=7.4;
I.shadow(BX0,BY0,BX1-BX0,BY1-BY0,.8,.24,.2);
I.box(BX0,BY0,0,BX1-BX0,BY1-BY0,BH,W);
I.box(BX0-.1,BY0-.1,BH,BX1-BX0+.2,BY1-BY0+.2,.5,ACC,{top:'#c3c9d0'});
I.onY(BY1+.004,BX0,0,BX1,.4,I.shade('#9aa2ac',[0,1,0]));I.onX(BX1+.004,BY0,0,BY1,.4,I.shade('#9aa2ac',[1,0,0]));
I.onY(BY1+.004,BX0,3.55,BX1,3.75,I.shade('#d9d2c7',[0,1,0]));
for(let u=BX0+.9;u<BX1-1;u+=2.25){if(u>11&&u<15.6)continue;I.window('y',BY1,u,1.0,1.55,1.9);I.window('y',BY1,u,4.5,1.55,1.9);}
for(let u=BY0+.8;u<BY1-1;u+=2.4){I.window('x',BX1,u,1.0,1.5,1.9);I.window('x',BX1,u,4.5,1.5,1.9);}
// entrance: glass doors, canopy, sign band
I.onY(BY1+.006,11.4,0,15.3,3.3,I.grad([0,BY1,3.3],[0,BY1,0],'#7fa9cf','#3f6e99'));
for(const u of [12.4,13.35,14.3])I.onY(BY1+.01,u-.04,0,u+.04,3.3,'#e9edf1');
I.box(11,BY1,3.5,4.7,1.6,.28,'#5d6876');I.onY(BY1+1.6+.004,11,3.5,15.7,3.78,ACC);
I.window('y',BY1,11.6,4.5,3.5,1.9);
// roof panels in rows
for(const yF of [4.1,6.05,7.95]){I.box(BX0+1,yF-1.35,BH+.5,BX1-BX0-2,.06,.55,'#98a2ad');I.panels(t,[BX0+1,yF,BH+.55],[1,0,0],[0,-1,.38],18,1,1.1,1.45,.05);}
// side wing (L) — its +x face looks onto the yard
const WX0=2,WX1=8,WY0=BY1,WY1=17,WH=7.4;
I.shadow(WX0,WY0,WX1-WX0,WY1-WY0,.7,.22,.15);
I.box(WX0,WY0,0,WX1-WX0,WY1-WY0,WH,W);I.box(WX0-.1,WY0,WH,WX1-WX0+.2,WY1-WY0+.1,.5,ACC,{top:'#c3c9d0'});
I.onX(WX1+.004,WY0,0,WY1,.4,I.shade('#9aa2ac',[1,0,0]));I.onY(WY1+.004,WX0,0,WX1,.4,I.shade('#9aa2ac',[0,1,0]));I.onX(WX1+.004,WY0,3.55,WY1,3.75,I.shade('#d9d2c7',[1,0,0]));
for(let u=WY0+.9;u<WY1-1;u+=2.25){I.window('x',WX1,u,1.0,1.5,1.9);I.window('x',WX1,u,4.5,1.5,1.9);}
for(let u=WX0+.8;u<WX1-1;u+=2.3){I.window('y',WY1,u,1.0,1.5,1.9);I.window('y',WY1,u,4.5,1.5,1.9);}
for(const yF of [10.2,12.4,14.6,16.8]){I.box(WX0+.5,yF-1.35,WH+.5,5,.06,.55,'#98a2ad');I.panels(t,[WX0+.5,yF,WH+.55],[1,0,0],[0,-1,.38],4,1,1.1,1.45,.05);}
// yard: sports court
const CX0=11,CX1=24,CY0=14.6,CY1=20.8;
I.fill([[CX0,CY0,.01],[CX1,CY0,.01],[CX1,CY1,.01],[CX0,CY1,.01]],I.shade('#4f8fc9',[0,0,1],.8));
I.fill([[CX0+.6,CY0+.6,.02],[CX1-.6,CY0+.6,.02],[CX1-.6,CY1-.6,.02],[CX0+.6,CY1-.6,.02]],I.shade('#5d9fd8',[0,0,1],.8));
const line=(a,b)=>{const g=I.g;g.strokeStyle='rgba(255,255,255,.92)';g.lineWidth=I.U*.08;g.beginPath();g.moveTo(...I.P(...a));g.lineTo(...I.P(...b));g.stroke();};
const mx=(CX0+CX1)/2,my=(CY0+CY1)/2;line([CX0+.6,CY0+.6,.03],[CX1-.6,CY0+.6,.03]);line([CX1-.6,CY0+.6,.03],[CX1-.6,CY1-.6,.03]);line([CX1-.6,CY1-.6,.03],[CX0+.6,CY1-.6,.03]);line([CX0+.6,CY1-.6,.03],[CX0+.6,CY0+.6,.03]);line([mx,CY0+.6,.03],[mx,CY1-.6,.03]);
{const g=I.g;g.strokeStyle='rgba(255,255,255,.92)';g.lineWidth=I.U*.08;g.beginPath();for(let a=0;a<=64;a++){const q=I.P(mx+1.4*Math.cos(a/64*2*Math.PI),my+1.4*Math.sin(a/64*2*Math.PI),.03);a?g.lineTo(...q):g.moveTo(...q);}g.stroke();}
// solar canopy over the seating area
const KX0=9.8,KX1=23.6,KY0=9.4,KY1=13.4,hB=3.9,hF=3.0;
for(const x of [10.4,16.7,23])I.cyl([x,KY0+.4,0],'z',.12,hB-.1,'#a7b0ba',{n:16});
I.shadow(KX0,KY0+.2,KX1-KX0,KY1-KY0,.9,.2,.0);
for(let x=11;x<23;x+=2.4){I.box(x,10.6,0,1.6,.5,.45,'#b07a4a');I.box(x,10.6,.45,1.6,.12,.5,'#b07a4a');}
for(const x of [10.4,16.7,23])I.cyl([x,KY1-.4,0],'z',.12,hF+.05,'#a7b0ba',{n:16});
I.box(KX0,KY1-.55,hF-.15,KX1-KX0,.25,.18,'#8f98a2');
I.panels(t,[KX0+.15,KY1,hF+.05],[1,0,0],[0,-1,(hB-hF)/(KY1-KY0)],12,2,1.1,1.95,.05);
// flagpole
I.cyl([16.6,8.9,0],'z',.06,7.5,'#d5dade',{n:12});
{const a=I.P(16.6,8.9,7.4),b=I.P(18.1,8.9,7.4),cc=I.P(18.1,8.9,6.5),d=I.P(16.6,8.9,6.5),g=I.g;g.beginPath();g.moveTo(...a);g.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2-I.U*.15,...b);g.lineTo(...cc);g.quadraticCurveTo((cc[0]+d[0])/2,(cc[1]+d[1])/2-I.U*.15,...d);g.closePath();const gr=g.createLinearGradient(a[0],a[1],b[0],b[1]);gr.addColorStop(0,'#2f9e6a');gr.addColorStop(1,'#43b47f');g.fillStyle=gr;g.fill();}
// fence along the front, trees and planters
for(let x=9.5;x<26;x+=.5)I.box(x,21.7,0,.06,.06,1,'#c4cbd2',{flat:true});
I.box(9.5,21.68,.85,16.5,.1,.08,'#aeb6bf',{flat:true});I.box(9.5,21.68,.3,16.5,.1,.08,'#aeb6bf',{flat:true});
I.tree(4.5,19.5,1.1,'#62aa4c');I.tree(27.5,15,1.0,'#579f45');I.tree(27.4,20,1.05,'#62aa4c');
I.bush(25,9.4,.85,'#5aa646');
return await I.export(c,'school');
})()
