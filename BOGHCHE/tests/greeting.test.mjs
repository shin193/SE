import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/auth.js',import.meta.url),'utf8');
const context=vm.createContext({});vm.runInContext(await readFile(new URL('../dist/mascot-motion.js',import.meta.url),'utf8'),context);
const {Clock,Gait,ground}=context.MascotMotion;
const near=(a,b,t=1e-5)=>assert.ok(Math.abs(a-b)<t,a+' versus '+b);
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function advance(c,ms,step=8){while(ms>0){const d=Math.min(ms,step);c.advance(d);ms-=d;}return c.pose();}
function setup(){const c=new Clock({seed:173});c.setLayout(226,.65);return c;}
function joints(p){return [p.pelvis,...p.legs.flatMap(l=>[l.hip,l.knee,l.ankle]),...['leftArm','rightArm'].flatMap(k=>[p[k].shoulder,p[k].elbow,p[k].hand])];}
test('resting legs are nearly extended, with the corrected body/leg ratio',()=>{
 const c=setup(),p=c.pose();for(const l of p.legs){assert.ok(length(l.hip,l.ankle)>46.4);assert.ok(Math.abs(l.knee.x-l.hip.x)<.2);assert.equal(l.contact,true);}
});
test('uninterrupted tour walks to the title, greets and returns in 4-6 seconds',()=>{
 const c=setup();c.request('signup');const states=new Set();let end;
 for(let time=0;time<6200;time+=8){c.advance(8);states.add(c.state);if(c.state==='idle'){end=time;break;}}
 for(const state of ['anticipate','walk-title','greet','turn-home','walk-home','settle','idle'])assert.ok(states.has(state),state);
 assert.ok(end>=4000&&end<=6000);near(c.x,c.home);assert.ok(c.gait.settled(c.x));
});
test('walk and run planted feet retain their world anchors',()=>{
 for(const kind of ['walk','run']){
  const gait=new Gait(0);let x=0,previous=gait.feet.map(f=>({...f}));const speed=kind==='run'?152:106;
  for(let t=0;t<1500;t+=4){x+=speed*.004;gait.advance(4,x,speed,1000,kind);gait.feet.forEach((f,i)=>{if(f.contact&&previous[i].contact){near(f.x,previous[i].x);near(f.y,ground);}});previous=gait.feet.map(f=>({...f}));}
 }
});
test('run has a flight phase and higher recovery; walking keeps a supporting foot',()=>{
 const sample=kind=>{const g=new Gait(0);let x=0,flight=0,minY=ground;for(let t=0;t<1800;t+=4){x+=(kind==='run'?152:106)*.004;g.advance(4,x,kind==='run'?152:106,1000,kind);if(g.feet.every(f=>!f.contact))flight++;minY=Math.min(minY,...g.feet.map(f=>f.y));}return {flight,minY};};
 const walk=sample('walk'),run=sample('run');assert.equal(walk.flight,0);assert.ok(run.flight>30);assert.ok(run.minY<walk.minY-10);
});
test('walk reach stays within leg length; pelvis travel stays controlled',()=>{
 const c=setup();c.request('signup');let maxHip=0,minHip=200;
 for(let t=0;t<5600;t+=4){const p=c.advance(4);p.legs.forEach(l=>assert.ok(length(l.hip,l.ankle)<=47.001));if(p.walking){maxHip=Math.max(maxHip,p.pelvis.y);minHip=Math.min(minHip,p.pelvis.y);}}
 assert.ok(maxHip-minHip<7);
});
test('joint transitions remain continuous through the complete greeting tour',()=>{
 const c=setup();c.request('signup');let previous=c.pose(),peak=0;
 for(let t=0;t<5600;t++){const p=c.advance(1),a=joints(previous),b=joints(p);peak=Math.max(peak,...a.map((v,i)=>length(v,b[i])));previous=p;}
 assert.ok(peak<1.2,'joint delta per millisecond: '+peak);
});
test('signup wave and login nod use different head/wrist motion',()=>{
 const a=setup(),b=setup();a.request('signup');b.request('login');let difference=0;
 for(let t=0;t<3500;t+=8){const p=a.advance(8),q=b.advance(8);if(p.phase==='greet')difference=Math.max(difference,Math.abs(p.headTilt-q.headTilt)+Math.abs(p.rightArm.wrist-q.rightArm.wrist));}
 assert.ok(difference>10);
});
test('surprise and gaze precede escape, with a click-friendly notice interval',()=>{
 const c=setup(),x=c.x;c.pointer(x+80+70,75,-5,0);
 const early=advance(c,120);assert.equal(c.state,'notice');near(c.x,x);assert.equal(early.emotion,'surprised');assert.ok(early.face.eyeL>1);assert.ok(early.face.gaze.x>0);assert.ok(early.face.smile<0);assert.ok(early.face.browL<0);
 advance(c,400);assert.equal(c.state,'run');assert.ok(c.v<0);assert.ok(c.x<x);
});
test('escape direction uses actual side and recent movement over the body',()=>{
 for(const [offset,dx,wanted]of [[70,-4,-1],[-70,4,1],[0,-6,1],[0,6,-1]]){
  const c=setup();c.pointer(c.x+80+offset,76,dx,0);advance(c,460);assert.equal(c.escapeDirection,wanted);assert.ok(c.v*wanted>0);
 }
});
test('short alternating mouse movements cannot flip the running direction',()=>{
 const c=setup();c.pointer(c.x+150,76,-5,0);advance(c,720);const original=c.escapeDirection;
 for(let t=0;t<160;t+=8){c.pointer(c.x+80,76,t%16?4:-4,0);c.advance(8);}
 assert.equal(c.escapeDirection,original);
});
test('escape respects boundaries and smoothly turns inward at an edge',()=>{
 const c=setup();c.setLayout(65,.65);c.pointer(c.x+150,76,-5,0);let sawTurn=false,sawRight=false,previous=c.x;
 for(let t=0;t<6000;t+=8){c.advance(8);sawTurn||=c.state==='edge-turn';sawRight||=c.state==='run'&&c.v>10;assert.ok(c.x>=-.01&&c.x<=c.max+.01);assert.ok(Math.abs(c.x-previous)<1.4);previous=c.x;}
 assert.ok(sawTurn);assert.ok(sawRight);
});
test('leaving the pointer returns by walking, with no positional reset',()=>{
 const c=setup();c.pointer(c.x+150,76,-6,0);advance(c,800);c.leave();let previous=c.x,sawReturn=false;
 for(let t=0;t<6000;t+=8){const p=c.advance(8);sawReturn||=p.phase==='return-home';assert.ok(Math.abs(c.x-previous)<1.4);previous=c.x;}
 assert.ok(sawReturn);assert.equal(c.state,'idle');near(c.x,c.home);
});
test('a stationary pointer cannot repeatedly trigger escapes on the walk home',()=>{
 const c=setup();c.pointer(c.x+150,76,-5,0);advance(c,7000);assert.equal(c.state,'idle');near(c.x,c.home);
});
test('mouse-down and click take priority over escape; route resumes at the same position',()=>{
 const c=setup();c.request('signup');advance(c,700);const x=c.x,step=c.gait.step?.elapsed;
 c.press(true);c.pointer(c.x+80,70,4,0);advance(c,350);near(c.x,x);assert.equal(c.gait.step?.elapsed,step);
 c.press(false);assert.equal(c.react(0),true);advance(c,1112);near(c.x,x);assert.equal(c.gait.step?.elapsed,step);
 advance(c,8);assert.equal(c.reaction,null);advance(c,32);assert.ok(c.x>x);
});
test('reaction transitions do not jump and rapid clicks never queue',()=>{
 for(const random of [0,.4,.99]){
  const c=setup();c.request('signup');advance(c,850);c.react(random);let previous=c.pose(),peak=0;
  for(let t=0;t<1120;t++){const p=c.advance(1);const a=joints(previous),b=joints(p);peak=Math.max(peak,...a.map((v,i)=>length(v,b[i])));previous=p;}
  assert.ok(peak<1.5,'reaction joint delta: '+peak);
 }
 const c=setup();c.react(0);const first=c.reaction.type;for(let i=0;i<30;i++)assert.equal(c.react(.8),false);advance(c,1120);assert.equal(c.reaction,null);c.react(0);assert.notEqual(c.reaction.type,first);
});
test('expressions blend continuously and blinking intervals vary',()=>{
 const c=setup(),intervals=[];let blinkAt=c.blinkAt;
 c.pointer(c.x+250,76,-3,0);const calm=c.pose().face;advance(c,80);assert.ok(c.pose().face.eyeL<1.23);
 for(let t=0;t<16000;t+=8){c.advance(8);if(c.blinkAt!==blinkAt){intervals.push(c.blinkAt-blinkAt);blinkAt=c.blinkAt;}}
 assert.ok(intervals.length>=3);assert.ok(new Set(intervals.map(n=>Math.round(n))).size>1);
 assert.ok(Object.keys(context.MascotMotion.expressions).every(k=>['calm','curious','happy','surprised','mischief'].includes(k)));
 assert.ok(calm.eyeL>0);
});
test('form switching queues one welcome and repeated active-form requests do not replay',()=>{
 const c=setup();c.request('signup');advance(c,600);const x=c.x;c.request('login');near(c.x,x);
 advance(c,11000);assert.equal(c.mode,'login');assert.equal(c.state,'idle');c.request('login');assert.equal(c.state,'idle');
});
test('small mobile and desktop routes remain inside their reserved heading lane',()=>{
 for(const [range,scale] of [[45,.5125],[97,.55],[226,.65]]){
  const c=new Clock();c.setLayout(range,scale);c.request('signup');for(let t=0;t<6000;t+=8){c.advance(8);assert.ok(c.x>=0&&c.x<=c.max+.01);}near(c.x,c.home);
 }
});
test('a stalled frame cannot jump the physical route',()=>{
 const c=setup();c.request('signup');advance(c,700);const x=c.x;c.advance(5000);assert.ok(Math.abs(c.x-x)<3.5);
});
test('the active form guard prevents field clearing and greeting replay',()=>{
 let resets=0,greetings=0;const ctx=vm.createContext({authMode:'login',authBusy:false,modeCopy:{login:{},signup:{}},clearSecrets(){resets++;},playSpoolGreeting(){greetings++;}});
 vm.runInContext(source.slice(source.indexOf('function setAuthMode'),source.indexOf('function validateAuthField')),ctx);vm.runInContext("setAuthMode('login')",ctx);assert.equal(resets,0);assert.equal(greetings,0);
});

test('machine enamel stays distinct on all four light surfaces and a dark reference',async()=>{
 const css=await readFile(new URL('../dist/mascot.css',import.meta.url),'utf8');
 const themeCSS=await readFile(new URL('../dist/features.css',import.meta.url),'utf8');
 const colors=[...css.matchAll(/--machine-enamel:(#[\da-f]{6});--machine-edge:#[\da-f]{6};--machine-detail:(#[\da-f]{6})/g)];
 const surfaces=[...themeCSS.matchAll(/--soft:(#[\da-f]{6})/g)].map(m=>m[1]);
 assert.equal(colors.length,4);
 const luminance=h=>{const c=h.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 const contrast=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
 colors.forEach((c,i)=>{assert.ok(contrast(c[1],surfaces[i])>3);assert.ok(contrast(c[1],'#171b24')>3);assert.ok(contrast(c[1],c[2])>4.5);});
 const clay=colors[1][1];assert.ok(parseInt(clay.slice(5,7),16)>parseInt(clay.slice(1,3),16)*2,'red/clay theme uses a blue machine');
});

test('a narrow lane permits one edge bounce, then rests until the pointer moves again',()=>{const c=new Clock();c.setLayout(45,.5125);c.pointer(c.x+100,76,-4,0);advance(c,8000);assert.equal(c.state,'calm');near(c.v,0);assert.ok(c.bounces<=1);const x=c.x;advance(c,3000);near(c.x,x);});

test('run flight and jumping cannot stretch either leg past its anatomical length',()=>{const c=setup();c.pointer(c.x+150,76,-5,0);for(let t=0;t<7000;t+=4){const p=c.advance(4);p.legs.forEach(l=>assert.ok(length(l.hip,l.ankle)<=47.001));}c.leave();c.react(0);for(let t=0;t<1120;t+=4)c.advance(4).legs.forEach(l=>assert.ok(length(l.hip,l.ankle)<=47.001));});

// Approximate a 60 Hz render at normal speed and at quarter-speed playback.
const playbackSteps=[16,4];

function samplePhase(clock,phase,step){
 const frames=[];
 for(let time=0;time<6500;time+=step){
  const pose=clock.advance(step);
  if(pose.phase===phase)frames.push({pose,body:clock.bodyFacing});
  else if(frames.length)break;
 }
 assert.ok(frames.length,phase+' should occur');
 return frames;
}

function checkPlantedFeet(previous,current){
 current.legs.forEach((leg,index)=>{
  if(!leg.contact)return;
  near(leg.worldY,ground);
  if(previous.legs[index].contact)near(leg.worldX,previous.legs[index].worldX);
 });
}

const range=values=>Math.max(...values)-Math.min(...values);

test('signup raises the palm, waves twice from the wrist, then lowers the arm',()=>{
 for(const step of playbackSteps){
  const clock=setup();
  clock.request('signup');
  const arms=samplePhase(clock,'greet',step).map(frame=>frame.pose.rightArm);
  const peaks=arms.map((arm,index)=>
   index>0&&index<arms.length-1&&arm.wrist>arms[0].wrist+35&&
   arm.wrist>arms[index-1].wrist&&arm.wrist>=arms[index+1].wrist?index:-1
  ).filter(index=>index>=0);
  assert.equal(peaks.length,2,'wrist crests at '+step+' ms');
  assert.ok(arms[0].hand.y>arms[0].elbow.y);
  assert.ok(arms.at(-1).hand.y>arms.at(-1).elbow.y);
  const raised=arms.map((arm,index)=>arm.hand.y<arm.shoulder.y?index:-1).filter(index=>index>=0);
  assert.ok(raised.length*step>350,'the wave needs a raised pose between transitions');
  for(const arm of arms.slice(raised[0],raised.at(-1)+1)){
   assert.ok(arm.elbow.y>arm.shoulder.y&&arm.elbow.y-arm.shoulder.y<20);
   assert.ok(Math.abs(arm.elbow.x-arm.shoulder.x)<10,'elbow stays near the torso');
   assert.ok(arm.hand.y<arm.elbow.y-8,'palm clears the elbow');
  }
  const beat=arms.slice(peaks[0],peaks[1]+1);
  const forearmAngle=arm=>Math.atan2(arm.hand.x-arm.elbow.x,arm.elbow.y-arm.hand.y)*180/Math.PI;
  assert.ok(range(beat.map(arm=>arm.wrist))>3*range(beat.map(forearmAngle)));
 }
});

test('turns lead with the eyes and head, then pivot over a stationary support foot',()=>{
 for(const step of playbackSteps){
  for(const phase of ['turn-home','edge-turn']){
   const clock=setup();
   if(phase==='turn-home')clock.request('signup');
   else{
    clock.setLayout(65,.65);
    clock.pointer(clock.x+150,76,-5,0);
   }
   const frames=samplePhase(clock,phase,step);
   const first=frames[0],last=frames.at(-1);
   const direction=Math.sign(last.body);
   const gaze=frames.findIndex(frame=>direction*frame.pose.face.gaze.x>.15);
   const head=frames.findIndex(frame=>direction*frame.pose.facing>.025);
   const body=frames.findIndex(frame=>direction*frame.body>.025);
   assert.ok(gaze>=0&&gaze<head&&head<body,phase+' eyes, head and body should follow in order');
   const lift=frames.findIndex(frame=>frame.pose.legs.some(leg=>leg.worldY<ground-.25));
   assert.ok(lift>0,phase+' needs a visible pivot step');
   const swing=frames[lift].pose.legs.findIndex(leg=>!leg.contact);
   const support=1-swing;
   const weight=frames.findIndex(({pose})=>
    (pose.pelvis.x-80)*Math.sign(pose.legs[support].worldX-pose.root)>.25
   );
   assert.ok(weight>=0&&weight<lift,'weight shifts before the pivot foot lifts');
   for(let index=1;index<frames.length;index++){
    const previous=frames[index-1].pose,current=frames[index].pose;
    checkPlantedFeet(previous,current);
    assert.equal(current.legs[support].contact,true);
    near(current.legs[support].worldX,first.pose.legs[support].worldX);
   }
   const distance=Math.abs(last.pose.legs[swing].worldX-first.pose.legs[swing].worldX);
   assert.ok(distance>2&&distance<10,'the lifted foot lands one short step away');
   assert.equal(last.pose.legs[swing].contact,true);
  }
 }
});

test('hop gathers and pushes off, slows at the apex, then lands and flexes on pinned feet',()=>{
 for(const step of playbackSteps){
  const clock=setup();
  const rest=clock.pose();
  clock.react(0);
  const frames=[clock.pose()];
  for(let time=0;time<1120;time+=step)frames.push(clock.advance(step));
  const takeoff=frames.findIndex(pose=>pose.legs.every(leg=>!leg.contact));
  assert.ok(takeoff>1,'a grounded preparation precedes the hop');
  const landing=frames.findIndex((pose,index)=>index>takeoff&&pose.legs.every(leg=>leg.contact));
  assert.ok(landing>takeoff+4,'the hop has a flight interval');
  const preparation=frames.slice(0,takeoff);
  assert.ok(preparation.every(pose=>pose.legs.every(leg=>leg.contact)));
  const crouchY=Math.max(...preparation.map(pose=>pose.pelvis.y));
  assert.ok(crouchY>rest.pelvis.y+2);
  assert.ok(preparation.at(-1).pelvis.y<crouchY-2,'legs extend before leaving the floor');

  const flight=frames.slice(takeoff,landing);
  const apexY=Math.min(...flight.map(pose=>pose.pelvis.y));
  const apex=flight.findIndex(pose=>pose.pelvis.y===apexY);
  const lift=rest.pelvis.y-apexY;
  assert.ok(lift>8&&lift<20,'hop height stays modest');
  assert.ok(apex>0&&apex<flight.length-1);
  assert.ok(flight.every(pose=>pose.legs.every(leg=>!leg.contact&&leg.worldY<ground)));
  const change=(left,right)=>Math.abs(flight[left].pelvis.y-flight[right].pelvis.y);
  const nearApex=Math.max(change(apex-1,apex),change(apex,apex+1));
  assert.ok(nearApex<.45*Math.min(change(0,1),change(flight.length-2,flight.length-1)));

  const recovery=frames.slice(landing);
  const impactY=Math.max(...recovery.map(pose=>pose.pelvis.y));
  const impact=recovery.findIndex(pose=>pose.pelvis.y===impactY);
  assert.ok(impact>0&&impactY>recovery[0].pelvis.y+1,'the body compresses after the feet touch');
  for(const leg of recovery[impact].legs){
   const dx=leg.ankle.x-leg.hip.x,dy=leg.ankle.y-leg.hip.y;
   const bend=Math.abs(dx*(leg.knee.y-leg.hip.y)-dy*(leg.knee.x-leg.hip.x))/Math.hypot(dx,dy);
   assert.ok(bend>.75,'landing knee visibly bends even in front view');
  }
  for(let index=1;index<frames.length;index++){
   checkPlantedFeet(frames[index-1],frames[index]);
   near(frames[index].root,rest.root);
  }
  near(frames.at(-1).pelvis.y,rest.pelvis.y);
  frames.at(-1).legs.forEach((leg,index)=>near(leg.worldX,rest.legs[index].worldX));
 }
});
