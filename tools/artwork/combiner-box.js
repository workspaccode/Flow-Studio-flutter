/* PV combiner box (RESC): a light-grey wall enclosure with the RESC logo, a rotary DC isolator, status LEDs and a row of cable glands,
   mounted on two galvanised posts on a small concrete pad. Needs window.__resc (data URL of resc-inverter.png) for the logo. */
(async()=>{const I=ISO;const c=I.init(1300,1500,300,600,720);
const RESC=await new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src=window.__resc;});
// front-face artwork (1 px = 1 mm), mapped onto the +y face of the enclosure
const W=800,H=1000;
const face=(()=>{const t=document.createElement('canvas');t.width=W;t.height=H;const x=t.getContext('2d');
 const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();};
 // door
 rr(0,0,W,H,34);let g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#f1f3f5');g.addColorStop(1,'#dcdfe3');x.fillStyle=g;x.fill();
 rr(26,26,W-52,H-52,22);x.strokeStyle='rgba(120,128,138,.35)';x.lineWidth=4;x.stroke();
 // hinges (left) and latch (right)
 for(const hy of [130,H-210]){rr(0,hy,26,80,8);x.fillStyle='#9aa3ad';x.fill();}
 rr(W-34,H/2-70,34,140,10);x.fillStyle='#8f98a3';x.fill();
 // logo cropped from the product photo, then wordmark text strip
 x.drawImage(RESC,50,340,160,60,70,70,400,150);
 // model label
 x.fillStyle='#6b7480';x.font='bold 40px Helvetica,Arial,sans-serif';x.textBaseline='alphabetic';x.fillText('PV COMBINER BOX',70,300);
 x.font='28px Helvetica,Arial,sans-serif';x.fillStyle='#8a93a0';x.fillText('6 IN  /  1 OUT  ·  1000 V DC',70,345);
 // status LEDs
 for(const [i,col] of [[0,'#39c47a'],[1,'#39c47a'],[2,'#e5484d']]){const lx=560+i*70;x.beginPath();x.arc(lx,120,20,0,7);x.fillStyle='rgba(60,70,82,.18)';x.fill();x.beginPath();x.arc(lx,120,14,0,7);x.fillStyle=col;x.fill();x.beginPath();x.arc(lx-4,115,5,0,7);x.fillStyle='rgba(255,255,255,.5)';x.fill();}
 x.fillStyle='#8a93a0';x.font='bold 20px Helvetica,Arial,sans-serif';x.fillText('ON',548,175);x.fillText('OK',618,175);x.fillText('ERR',682,175);
 // rotary DC isolator: black base, yellow plate, red handle (ON)
 const IX=W/2,IY=590;rr(IX-150,IY-150,300,300,28);g=x.createLinearGradient(0,IY-150,0,IY+150);g.addColorStop(0,'#2e343c');g.addColorStop(1,'#1b1f25');x.fillStyle=g;x.fill();
 x.beginPath();x.arc(IX,IY,118,0,7);x.fillStyle='#f2c21b';x.fill();x.lineWidth=6;x.strokeStyle='#c99a10';x.stroke();
 x.beginPath();x.arc(IX,IY,76,0,7);g=x.createRadialGradient(IX-20,IY-24,10,IX,IY,76);g.addColorStop(0,'#ee5a50');g.addColorStop(1,'#bd2b25');x.fillStyle=g;x.fill();
 x.save();x.translate(IX,IY);rr(-30,-100,60,200,22);x.fillStyle='#d8372f';x.fill();rr(-30,-100,60,200,22);x.strokeStyle='#8f1d19';x.lineWidth=5;x.stroke();x.restore();
 x.fillStyle='#1b1f25';x.font='bold 30px Helvetica,Arial,sans-serif';x.fillText('OFF',IX-150-76,IY+10);x.fillText('ON',IX+150+16,IY+10);
  // warning triangle
 x.beginPath();x.moveTo(110,920);x.lineTo(170,920);x.lineTo(140,870);x.closePath();x.fillStyle='#f2c21b';x.fill();x.strokeStyle='#1b1f25';x.lineWidth=4;x.stroke();x.fillStyle='#1b1f25';x.font='bold 34px Helvetica,Arial,sans-serif';x.fillText('!',134,913);
 x.fillStyle='#6b7480';x.font='bold 22px Helvetica,Arial,sans-serif';x.fillText('DANGER · LIVE DC',190,903);x.font='20px Helvetica,Arial,sans-serif';x.fillStyle='#8a93a0';x.fillText('Isolate before opening',190,932);
 return t;})();
I.shadow(.05,.05,1.8,1.4,.3,.2,.08);
I.slab(0,0,1.9,1.5,.14,'#cfd4da',.95);
// two galvanised posts with a mounting plate between them
const PY=.42;
I.shadow(.3,PY-.05,1.3,.55,.18,.32,.04);
for(const x of [.3,1.5])I.box(x,PY,0,.09,.09,2.0,'#b9c1ca',{top:'#d3d9df'});
I.box(.39,PY+.025,.36,1.11,.035,1.52,'#d6dce2',{top:'#e3e7eb'});
// enclosure on the plate
const MW=.88,MX=.6,MY=PY+.06,MD=.3,Z0=.7,MH=MW*H/W;
{const g=I.g;g.save();g.filter=`blur(${.05*I.U}px)`;I.onY(MY+.0,MX-.02,Z0-.02,MX+MW+.04,Z0+MH+.04,'rgba(40,55,75,.22)');g.restore();}
// cable glands + cables down into the pad (6 in, 1 out), drawn before the box so the box sits over them
const gl=[];for(let k=0;k<6;k++)gl.push(MX+.1+k*(MW-.2)/5);
I.box(MX,MY,Z0,MW,MD,MH,'#e6e9ec',{top:'#f3f5f7'});
I.tex(face,[MX+.02,MY+MD+.004,Z0+MH-.02],[MX+MW-.02,MY+MD+.004,Z0+MH-.02],[MX+.02,MY+MD+.004,Z0+.02]);
{const g=I.g;g.save();I.path([[MX+.02,MY+MD+.006,Z0+.02],[MX+MW-.02,MY+MD+.006,Z0+.02],[MX+MW-.02,MY+MD+.006,Z0+MH-.02],[MX+.02,MY+MD+.006,Z0+MH-.02]]);g.fillStyle='rgba(40,55,75,.08)';g.fill();g.restore();}
for(const gx of gl){I.cyl([gx,MY+.15,Z0-.12],'z',.028,.12,'#2a2f37',{n:16});I.cyl([gx,MY+.15,.12],'z',.011,Z0-.24,'#23272e',{n:10,amb:.75});}
I.cyl([MX+MW/2,MY+.15,Z0+MH],'z',.04,.12,'#2a2f37',{n:16});
I.bush(1.66,1.22,.2,'#5aa646');I.bush(.2,1.28,.16,'#4e9a3e');
return await I.export(c,'combiner-box');
})()
