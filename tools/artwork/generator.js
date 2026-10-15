(async()=>{const I=ISO;const c=I.init(2000,1600,150,860,700);
const Y='#e5a93b',D='#3d4652';
I.shadow(0,0,4.6,1.9,.35,.26,.15);
I.box(-.1,-.1,0,4.8,2.1,.32,D);                                     // fuel-tank skid
for(const x of [.3,4.3])I.box(x,-.12,0,.2,2.14,.1,'#2b323b');
I.box(0,0,.32,4.6,1.9,2.1,Y);                                       // canopy
I.box(-.04,-.04,2.42,4.68,1.98,.12,I.mix(Y,.92).replace('rgba','rgb').replace(/,1\)$/,')').length?'#d79a2e':'#d79a2e');
// doors with louvres on +y
for(const [u0,u1] of [[.25,1.6],[1.75,3.1],[3.25,4.35]]){I.onY(1.9+.004,u0,.55,u1,2.2,I.shade(I.hex?'#d99d31':'#d99d31',[0,1,0]));I.onY(1.9+.006,u0+.06,.61,u1-.06,2.14,I.shade('#e5a93b',[0,1,0],.62));for(let v=.95;v<1.9;v+=.13)I.onY(1.9+.008,u0+.2,v,u1-.2,v+.05,'rgba(60,45,20,.35)');I.onY(1.9+.01,u1-.22,1.3,u1-.14,1.5,'#3d4652');}
// radiator end (+x) with grille, control panel
I.onX(4.6+.004,.2,.55,1.7,2.2,I.shade('#d99d31',[1,0,0]));
for(let u=.3;u<1.62;u+=.1)I.onX(4.6+.008,u,.65,u+.05,2.1,'rgba(50,40,20,.42)');
I.onY(1.9+.012,3.4,1.55,4.2,2.05,'#232a33');I.onY(1.9+.016,3.48,1.72,3.95,1.98,I.grad([3.5,1.9,1.98],[3.9,1.9,1.72],'#69e0a6','#2f9e6a'));
for(const [u,col] of [[4.04,'#e5604d'],[4.12,'#9aa4af']])I.onY(1.9+.016,u,1.62,u+.05,1.68,col);
// exhaust stack with rain cap
I.cyl([1,.6,2.54],'z',.12,1.05,'#9aa4af',{n:20});I.cyl([1,.6,3.5],'z',.16,.08,'#6d7681',{n:20});
// lifting eyes and brand stripe
for(const x of [.4,4.2])I.cyl([x,.95,2.54],'z',.05,.16,'#6d7681',{n:10});
I.onY(1.9+.012,.25,2.28,4.35,2.34,'#3d4652');
return await I.export(c,'generator');
})()
