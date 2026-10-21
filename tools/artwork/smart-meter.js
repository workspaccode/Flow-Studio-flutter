/* Smart meter: a white grid meter (LCD, pulse LEDs, terminal cover) on a galvanised plate and post, on a small concrete pad. */
(async()=>{const I=ISO;const c=I.init(1300,1500,300,600,720);
// front-face artwork (1 px = 1 mm), mapped onto the +y face of the meter
const face=(()=>{const W=650,H=860,t=document.createElement('canvas');t.width=W;t.height=H;const x=t.getContext('2d');
 const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();};
 // meter window bezel
 rr(40,40,W-80,470,26);x.fillStyle='rgba(60,70,82,.10)';x.fill();rr(52,52,W-104,446,20);let g=x.createLinearGradient(0,52,0,498);g.addColorStop(0,'#fbfcfd');g.addColorStop(1,'#e9ecef');x.fillStyle=g;x.fill();
 // brand strip and LCD
 x.fillStyle='#2f6fd0';rr(90,82,120,20,6);x.fill();x.fillStyle='#9aa4af';rr(225,86,170,12,6);x.fill();
 rr(90,125,W-180,150,14);x.fillStyle='#2c333d';x.fill();rr(104,139,W-208,122,8);g=x.createLinearGradient(0,139,0,261);g.addColorStop(0,'#d5ead6');g.addColorStop(1,'#a9cdb0');x.fillStyle=g;x.fill();
 x.fillStyle='#1d2b22';x.font='bold 84px "Courier New",monospace';x.textBaseline='alphabetic';x.fillText('04827',124,240);x.font='bold 34px Helvetica,Arial,sans-serif';x.fillText('kWh',W-196,236);
 x.fillStyle='rgba(29,43,34,.55)';for(let k=0;k<4;k++){rr(124+k*34,150,24,10,3);x.fill();}x.font='bold 22px Helvetica,Arial,sans-serif';x.fillText('IMP',W-190,170);
 // pulse LEDs, buttons, optical port, QR
 x.beginPath();x.arc(120,330,14,0,7);x.fillStyle='#e5484d';x.fill();x.beginPath();x.arc(120,330,22,0,7);x.fillStyle='rgba(229,72,77,.2)';x.fill();
 x.beginPath();x.arc(170,330,14,0,7);x.fillStyle='#39c47a';x.fill();
 x.fillStyle='#7d8894';x.font='bold 20px Helvetica,Arial,sans-serif';x.fillText('1000 imp/kWh',100,385);
 for(const [bx,col] of [[300,'#2f6fd0'],[370,'#5d6876']]){x.beginPath();x.arc(bx,330,22,0,7);x.fillStyle=col;x.fill();x.beginPath();x.arc(bx-5,324,8,0,7);x.fillStyle='rgba(255,255,255,.35)';x.fill();}
 x.beginPath();x.arc(W-140,340,34,0,7);x.fillStyle='#2c333d';x.fill();x.beginPath();x.arc(W-140,340,18,0,7);x.fillStyle='#5d6876';x.fill();
 x.fillStyle='#2c333d';const qx=100,qy=410;for(let i=0;i<7;i++)for(let j=0;j<7;j++)if((i*3+j*5+i*j)%3!==1||i%6===0&&j%6===0)x.fillRect(qx+i*10,qy+j*10,10,10);
 x.fillStyle='#b5bdc6';for(let k=0;k<3;k++){rr(200,420+k*22,260-k*60,10,5);x.fill();}
 // terminal cover with screws and a seal
 rr(30,540,W-60,290,18);g=x.createLinearGradient(0,540,0,830);g.addColorStop(0,'#b9c1ca');g.addColorStop(1,'#99a3ad');x.fillStyle=g;x.fill();
 x.fillStyle='rgba(255,255,255,.35)';rr(30,540,W-60,8,4);x.fill();
 for(let k=0;k<6;k++){rr(90+k*82,600,52,150,10);x.fillStyle='rgba(60,70,82,.18)';x.fill();}
 for(const sx of [70,W-70]){x.beginPath();x.arc(sx,790,14,0,7);x.fillStyle='#e3e7eb';x.fill();x.strokeStyle='#6d7681';x.lineWidth=4;x.beginPath();x.moveTo(sx-8,790);x.lineTo(sx+8,790);x.stroke();}
 x.strokeStyle='#d3483d';x.lineWidth=4;x.beginPath();x.moveTo(W-70,804);x.quadraticCurveTo(W-60,840,W-90,850);x.stroke();x.fillStyle='#d3483d';x.fillRect(W-100,840,18,14);
 return t;})();
I.shadow(.05,.05,1.8,1.4,.3,.2,.08);
I.slab(0,0,1.9,1.5,.14,'#cfd4da',.95);
// two galvanised posts with the mounting plate between them
const PY=.42;
I.shadow(.3,PY-.05,1.3,.55,.18,.32,.04);
for(const x of [.3,1.5])I.box(x,PY,0,.09,.09,1.86,'#b9c1ca',{top:'#d3d9df'});
I.box(.39,PY+.025,.32,1.11,.035,1.48,'#d6dce2',{top:'#e3e7eb'});
for(const z of [.45,1.65])for(const x of [.3,1.5])I.onY(PY+.094,x+.02,z,x+.07,z+.05,'#7d8894');
// soft shadow of the meter on the plate
{const g=I.g;g.save();g.filter=`blur(${.05*I.U}px)`;I.onY(PY+.062,.56,.52,1.42,1.54,'rgba(40,55,75,.22)');g.restore();}
// conduit from the meter down into the pad
const MX=.6,MY=PY+.06,MW=.7,MD=.28,Z0=.6,MH=.94;
I.cyl([MX+MW/2,MY+.14,0],'z',.05,Z0+.02,'#7d8894',{n:20});I.cyl([MX+MW/2,MY+.14,0],'z',.08,.05,'#6b7580',{n:20,noCap:true});
// meter: white body with the face art, rain hood and antenna stub
I.box(MX,MY,Z0,MW,MD,MH,'#f3f5f7',{top:'#eef1f4'});
I.tex(face,[MX+.035,MY+MD+.004,Z0+MH-.03],[MX+MW-.035,MY+MD+.004,Z0+MH-.03],[MX+.035,MY+MD+.004,Z0+.03]);
{const g=I.g;g.save();I.path([[MX+.035,MY+MD+.006,Z0+.03],[MX+MW-.035,MY+MD+.006,Z0+.03],[MX+MW-.035,MY+MD+.006,Z0+MH-.03],[MX+.035,MY+MD+.006,Z0+MH-.03]]);g.fillStyle='rgba(40,55,75,.12)';g.fill();g.restore();}
I.onX(MX+MW+.004,MY+.05,Z0+.06,MY+MD-.05,Z0+.1,'rgba(90,100,112,.35)');
I.box(MX-.03,MY-.02,Z0+MH,MW+.06,MD+.07,.045,'#d5dadf');
I.cyl([MX+MW-.1,MY+.1,Z0+MH+.045],'z',.022,.14,'#3a424d',{n:14});
// grass tufts at the corner of the pad
I.bush(1.66,1.22,.2,'#5aa646');I.bush(.2,1.28,.16,'#4e9a3e');
return await I.export(c,'smart-meter');
})()
