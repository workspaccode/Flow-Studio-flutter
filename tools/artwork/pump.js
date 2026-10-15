(async()=>{const I=ISO;const c=I.init(2200,1700,140,1000,820);
const B='#2f6fd0',M='#5d7690',PIPE='#a7b0ba';
I.shadow(-.2,-.2,5.4,2.6,.35,.24,.15);
I.box(-.2,-.2,0,5.4,2.6,.35,'#c6ccd3');                               // concrete plinth
I.box(.2,.6,.35,4.6,1.2,.25,'#4a5562');                               // base frame
// suction pipe (enters from +y) behind the volute

// motor along x with cooling fins
I.cyl([.4,1.2,1.25],'x',.72,2.3,M,{n:48});
for(let x=.55;x<2.6;x+=.18)I.cyl([x,1.2,1.25],'x',.76,.06,I.mix(M,.86).replace(/rgba\((\d+),(\d+),(\d+),1\)/,(m,a,b,cc)=>'#'+[a,b,cc].map(v=>(+v).toString(16).padStart(2,'0')).join('')),{n:48,noCap:true});
I.cyl([2.7,1.2,1.25],'x',.5,.3,'#3f4b58',{n:40});                     // coupling guard
I.box(1.1,.95,2.0,.6,.5,.38,'#3f4b58');                                 // terminal box
// pump volute
I.cyl([3.05,1.2,1.25],'x',.95,.85,B,{n:56,cap:'#3d7fe0'});
I.cyl([3.9,1.2,1.25],'x',.36,.25,B,{n:32});
// axial suction pipe with flanges and a support
I.box(5.05,.95,.35,.3,.5,.62,'#4a5562');I.cyl([4.15,1.2,1.25],'x',.3,1.55,PIPE,{n:32});I.cyl([4.15,1.2,1.25],'x',.42,.1,'#8a949f',{n:32,noCap:true});I.cyl([5.6,1.2,1.25],'x',.42,.12,'#8a949f',{n:32});
// discharge pipe: up then along +x, with flange and gauge
I.cyl([3.45,1.2,2.1],'z',.27,1.3,PIPE,{n:32});I.cyl([3.45,1.2,2.05],'z',.38,.1,'#8a949f',{n:32});
I.cyl([3.45,1.2,3.4],'x',.27,1.9,PIPE,{n:32});I.cyl([5.3,1.2,3.4],'x',.38,.12,'#8a949f',{n:32});
{const p=I.P(3.45,1.47,2.95),g=I.g;g.beginPath();g.arc(p[0],p[1],I.U*.2,0,7);g.fillStyle='#f4f6f8';g.fill();g.lineWidth=I.U*.04;g.strokeStyle='#5d6876';g.stroke();g.beginPath();g.moveTo(...p);g.lineTo(p[0]+I.U*.12,p[1]-I.U*.08);g.strokeStyle='#e5604d';g.lineWidth=I.U*.03;g.stroke();}
// valve wheel on discharge
{const p=I.P(4.4,1.2,3.95),g=I.g;g.beginPath();g.ellipse(p[0],p[1],I.U*.32,I.U*.18,0,0,7);g.strokeStyle='#d3483d';g.lineWidth=I.U*.07;g.stroke();}
I.cyl([4.4,1.2,3.6],'z',.05,.35,'#6d7681',{n:10});
return await I.export(c,'pump');
})()
