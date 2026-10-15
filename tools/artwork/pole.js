(async()=>{const I=ISO;const c=I.init(1400,2200,110,700,1500);
I.shadow(-.8,-.8,1.6,1.6,.35,.22,0);
I.slab(-1.1,-1.1,2.2,2.2,.25,'#cfd4da',2.2);
I.cyl([0,0,0],'z',.2,10.6,'#c9ced4',{n:32});
// cross-arm (along x) with insulators
I.box(-1.6,-.09,9.7,3.2,.18,.22,'#8a939d');
for(const x of [-1.35,0,1.35]){I.cyl([x,0,9.92],'z',.06,.12,'#6b7580',{n:12});for(let k=0;k<3;k++)I.cyl([x,0,10.04+k*.13],'z',.13-k*.01,.08,'#7fa8a0',{n:20});}
// conductors leaving along y (short sagging stubs)
{const g=I.g;g.strokeStyle='#4a525d';g.lineWidth=I.U*.035;for(const x of [-1.35,0,1.35])for(const s of [-1,1]){const a=I.P(x,0,10.38),b=I.P(x,s*3.2,10.1),m=I.P(x,s*1.6,9.9);g.beginPath();g.moveTo(...a);g.quadraticCurveTo(m[0],m[1],b[0],b[1]);g.stroke();}}
// transformer on a bracket
I.box(.18,-.12,6.2,.5,.24,.16,'#8a939d');I.box(.18,-.12,7.7,.5,.24,.16,'#8a939d');
I.cyl([.95,0,6],'z',.55,1.9,'#9fb3c4',{n:40});
for(const z of [6.3,6.9,7.5])I.cyl([.95,0,z],'z',.56,.06,'#7e93a6',{n:40,noCap:true});
for(const dx of [-.22,.22]){I.cyl([.95+dx,dx*.4,7.9],'z',.07,.35,'#e9eef2',{n:12});}
{const g=I.g;g.strokeStyle='#4a525d';g.lineWidth=I.U*.025;for(const dx of [-.22,.22]){const a=I.P(.95+dx,dx*.4,8.25),b=I.P(dx*4,0,10.2);g.beginPath();g.moveTo(...a);g.quadraticCurveTo((a[0]+b[0])/2,a[1]-I.U*.6,b[0],b[1]);g.stroke();}}
// warning plate and street-level conduit
I.onX(.205,-.1,2.4,.1,2.8,'#f2c230');I.cyl([-.05,.21,0],'z',.06,2.2,'#7d8894',{n:12});
return await I.export(c,'utility-pole');
})()
