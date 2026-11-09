import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/auth.js',import.meta.url),'utf8');
const motionSource=await readFile(new URL('../dist/mascot-motion.js',import.meta.url),'utf8');
const context=vm.createContext({});vm.runInContext(motionSource,context);
const {Clock,duration,walk}=context.MascotMotion;
function advance(clock,ms){while(ms>0){const step=Math.min(ms,8);clock.advance(step);ms-=step;}return clock.pose();}
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,a+' versus '+b);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function clock(){const c=new Clock();c.setDistance(82,.65);c.request('signup');return c;}
test('the tour gathers both feet and returns home after 5.9 seconds',()=>{
 const c=clock();const p=advance(c,950);assert.equal(p.walking,true);assert.ok(p.x>0&&p.x<82);
 const title=advance(c,1200);assert.equal(title.phase,'greeting');near(title.x,82);assert.ok(title.legs.every(l=>l.contact));
 const home=advance(c,duration-2150);assert.equal(home.phase,'home');near(home.x,0);assert.equal(home.active,false);assert.ok(home.legs.every(l=>l.contact));
});
test('planted feet stay at the same world position throughout each contact',()=>{
 for(const direction of [1,-1])for(const length of [12,55,126,160]){
  let previous=walk(0,length,direction);
  for(let i=1;i<=1700;i++){
   const next=walk(i/1700,length,direction);
   next.feet.forEach((foot,j)=>{if(foot.contact&&previous.feet[j].contact){near(foot.x,previous.feet[j].x);near(foot.y,151);}});
   assert.ok(next.feet.some(f=>f.contact),'there is always a supporting foot');
   previous=next;
  }
 }
});
test('knees bend, arms counter-swing, and bone lengths stay bounded',()=>{
 const c=clock();let minKneeBend=Infinity,maxKneeBend=0,handRange=[Infinity,-Infinity];
 for(let i=0;i<1700;i++){
  const p=advance(c,1);if(!p.walking)continue;
  for(const leg of p.legs){assert.ok(distance(leg.hip,leg.knee)<=28.001);assert.ok(distance(leg.knee,leg.ankle)<=30.001);maxKneeBend=Math.max(maxKneeBend,Math.abs(leg.knee.x-leg.hip.x));minKneeBend=Math.min(minKneeBend,Math.abs(leg.knee.x-leg.hip.x));}
  for(const arm of [p.leftArm,p.rightArm]){near(distance(arm.shoulder,arm.elbow),20,.001);near(distance(arm.elbow,arm.hand),21,.001);}
  const forward=p.legs[0].worldX-p.legs[1].worldX+24;
  assert.ok(forward*(p.leftArm.hand.x-p.leftArm.shoulder.x+7)<=.0001,'left arm opposes left leg');
  const h=p.leftArm.hand.x-p.leftArm.shoulder.x;handRange=[Math.min(handRange[0],h),Math.max(handRange[1],h)];
 }
 assert.ok(maxKneeBend-minKneeBend>10);assert.ok(handRange[1]-handRange[0]>10);
});
test('all joint transitions stay continuous at walk, greeting, turn and home boundaries',()=>{
 const c=clock();let previous=c.pose(),maxDelta=0;
 for(let i=1;i<=duration;i++){
  const p=advance(c,1);
  const joints=q=>[q.pelvis,q.torso,...q.legs.flatMap(l=>[l.hip,l.knee,l.ankle]),...['leftArm','rightArm'].flatMap(n=>[q[n].shoulder,q[n].elbow,q[n].hand])];
  const a=joints(previous),b=joints(p);maxDelta=Math.max(maxDelta,...a.map((v,j)=>distance(v,b[j])));
  previous=p;
 }
 assert.ok(maxDelta<1.1,'largest joint jump per millisecond: '+maxDelta);
});
test('signup waves through elbow and wrist while login adds a distinct head nod',()=>{
 const signup=clock(),login=new Clock();login.setDistance(82,.65);login.request('login');
 let elbowRange=[Infinity,-Infinity],wristRange=[Infinity,-Infinity],headDifference=0;
 for(let i=0;i<3430;i+=8){
  const a=advance(signup,8),b=advance(login,8);if(a.phase!=='greeting')continue;
  elbowRange=[Math.min(elbowRange[0],a.rightArm.elbow.x),Math.max(elbowRange[1],a.rightArm.elbow.x)];
  wristRange=[Math.min(wristRange[0],a.rightArm.wrist),Math.max(wristRange[1],a.rightArm.wrist)];
  headDifference=Math.max(headDifference,Math.abs(a.headTilt-b.headTilt));
 }
 assert.ok(elbowRange[1]-elbowRange[0]>5);assert.ok(wristRange[1]-wristRange[0]>20);assert.ok(headDifference>3);
});
test('jump anticipates on the ground, lifts both feet, then compresses on landing',()=>{
 const c=new Clock();c.react(0);
 const prepare=advance(c,260);assert.ok(prepare.crouch>2);near(prepare.jump,0);assert.ok(prepare.legs.every(l=>l.contact));
 const flight=advance(c,300);assert.ok(flight.jump>15);assert.ok(flight.legs.every(l=>!l.contact));assert.ok(flight.smile>.5);
 const land=advance(c,320);near(land.jump,0);assert.ok(land.crouch>3);assert.ok(land.legs.every(l=>l.contact));
 const recover=advance(c,320);assert.equal(recover.active,false);near(recover.crouch,0);
});
test('interrupting mid-step freezes root and restores every joint before resuming',()=>{
 const c=clock();advance(c,990);const before=c.pose(),elapsed=c.elapsed;c.react(0);
 for(let i=0;i<1199;i++){const p=advance(c,1);near(p.x,before.x);assert.equal(c.elapsed,elapsed);}
 const end=advance(c,1);assert.equal(c.reaction,null);near(end.x,before.x);
 for(let i=0;i<2;i++){near(distance(end.legs[i].knee,before.legs[i].knee),0);near(distance(end.legs[i].ankle,before.legs[i].ankle),0);}
 advance(c,16);assert.ok(c.elapsed>elapsed);
});
test('each reaction blends at both ends without abrupt limb or face changes',()=>{
 for(const random of [0,.4,.99]){
  const c=clock();advance(c,850);c.react(random);let prev=c.pose(),maxDelta=0;
  for(let i=0;i<1200;i++){const p=advance(c,1);maxDelta=Math.max(maxDelta,...p.legs.map((l,j)=>distance(l.knee,prev.legs[j].knee)),distance(p.rightArm.hand,prev.rightArm.hand));prev=p;}
  assert.ok(maxDelta<1,'reaction joint jump: '+maxDelta);
 }
});
test('rapid clicks are dropped, no reaction queues, no immediate repeat',()=>{
 const c=new Clock();c.react(0);const first=c.reaction.type;
 for(let i=0;i<30;i++)assert.equal(c.react(0),false);
 advance(c,1200);assert.equal(c.reaction,null);assert.equal(c.pose().active,false);
 c.react(0);assert.notEqual(c.reaction.type,first);
});
test('mode requests wait for home and the active form never replays its tour',()=>{
 const c=clock();advance(c,700);const x=c.pose().x;c.request('login');near(c.pose().x,x);assert.equal(c.mode,'signup');
 advance(c,duration-700);assert.equal(c.mode,'login');near(c.pose().x,0);advance(c,duration);c.request('login');assert.equal(c.running,false);
});
test('resizing does not change a planted route mid-step; new distance applies at home',()=>{
 const c=clock();advance(c,800);const before=c.pose();c.setDistance(40);near(c.pose().x,before.x);advance(c,16);assert.ok(c.pose().x>=before.x);
 advance(c,duration);assert.equal(c.distance,40);
});
test('a stalled browser frame is capped, preventing a timeline jump',()=>{
 const c=clock();c.advance(5000);assert.equal(c.elapsed,40);
});
test('the active form guard prevents field clearing and greeting replay',()=>{
 let resets=0,greetings=0;
 const ctx=vm.createContext({authMode:'login',authBusy:false,modeCopy:{login:{},signup:{}},clearSecrets(){resets++;},playSpoolGreeting(){greetings++;}});
 vm.runInContext(source.slice(source.indexOf('function setAuthMode'),source.indexOf('function validateAuthField')),ctx);vm.runInContext("setAuthMode('login')",ctx);
 assert.equal(resets,0);assert.equal(greetings,0);
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
