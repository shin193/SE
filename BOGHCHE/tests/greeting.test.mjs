import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/auth.js',import.meta.url),'utf8');
const motionSource=await readFile(new URL('../dist/mascot-motion.js',import.meta.url),'utf8');
const motionContext=vm.createContext({});vm.runInContext(motionSource,motionContext);
const {Clock,duration}=motionContext.MascotMotion;
function advance(clock,ms){while(ms>0){const step=Math.min(ms,16);clock.advance(step);ms-=step;}return clock.pose();}
test('the articulated tour returns home after 5.35 seconds',()=>{
 const clock=new Clock();clock.setDistance(180);clock.request('signup');
 const moving=advance(clock,900);assert.equal(moving.walking,true);assert.notEqual(moving.leftLeg,0);assert.equal(moving.rightLeg,-moving.leftLeg);assert.ok(moving.x>0&&moving.x<180);
 const atTitle=advance(clock,1000);assert.equal(atTitle.phase,'greeting');assert.ok(Math.abs(atTitle.x-180)<.1);
 const home=advance(clock,duration-1900);assert.equal(home.phase,'home');assert.equal(home.x,0);assert.equal(home.active,false);assert.equal(home.leftLeg,0);
});
test('a reaction pauses the route position and resumes the same timeline without teleporting',()=>{
 const clock=new Clock();clock.setDistance(180);clock.request('signup');advance(clock,800);
 const before=clock.pose(),time=clock.elapsed;assert.equal(clock.react(0),true);
 const reacting=advance(clock,300);assert.equal(clock.elapsed,time);assert.equal(reacting.x,before.x);assert.equal(reacting.reaction,'jump');assert.ok(reacting.lift<before.lift);
 advance(clock,480);assert.equal(clock.elapsed,time);assert.equal(clock.reaction,null);
 advance(clock,32);assert.ok(clock.elapsed>time);assert.ok(clock.pose().x>=before.x);
});
test('rapid clicks are dropped rather than queued and the last reaction is not immediately repeated',()=>{
 const clock=new Clock();clock.react(0);const first=clock.reaction.type;
 for(let i=0;i<20;i++)assert.equal(clock.react(0),false);
 advance(clock,800);assert.equal(clock.reaction,null);assert.equal(clock.pose().active,false);
 clock.react(0);assert.notEqual(clock.reaction.type,first);
});
test('a new form waits for the current tour to return, retaining only the latest request',()=>{
 const clock=new Clock();clock.setDistance(180);clock.request('signup');advance(clock,700);const x=clock.pose().x;
 clock.request('login');assert.equal(clock.pose().x,x);assert.equal(clock.mode,'signup');
 advance(clock,duration-700);assert.equal(clock.mode,'login');assert.equal(clock.pose().x,0);
});
test('the active mode does not restart its tour after it has returned home',()=>{
 const clock=new Clock();clock.request('login');advance(clock,duration);clock.request('login');assert.equal(clock.running,false);assert.equal(clock.elapsed,duration);
});
test('resizing the route changes its distance gradually while walking',()=>{
 const clock=new Clock();clock.setDistance(180);clock.request('signup');advance(clock,800);const x=clock.pose().x;
 clock.setDistance(80);clock.advance(16);assert.ok(Math.abs(clock.pose().x-x)<10);
});
test('a stalled browser frame cannot cause a large route jump',()=>{
 const clock=new Clock();clock.request('login');clock.advance(5000);assert.equal(clock.elapsed,40);
});
test('selecting the active form cannot clear fields or restart its welcome animation',()=>{
 let resets=0,greetings=0;
 const context=vm.createContext({authMode:'login',authBusy:false,modeCopy:{login:{},signup:{}},clearSecrets(){resets++;},playSpoolGreeting(){greetings++;}});
 vm.runInContext(source.slice(source.indexOf('function setAuthMode'),source.indexOf('function validateAuthField')),context);
 vm.runInContext("setAuthMode('login')",context);
 assert.equal(resets,0);assert.equal(greetings,0);
});
