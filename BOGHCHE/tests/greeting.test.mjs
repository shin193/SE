import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/auth.js',import.meta.url),'utf8');
test('the welcome character exits after 2.7 seconds, and recovery has no greeting',()=>{
 const classes=new Set();let callback,delay;
 const stage={dataset:{},offsetWidth:104,classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)}};
 const context=vm.createContext({document:{querySelector:()=>stage},setTimeout:(fn,ms)=>{callback=fn;delay=ms;return 1;},clearTimeout(){}});
 vm.runInContext(source.slice(0,source.indexOf('const authForm')),context);
 vm.runInContext("playSpoolGreeting('signup')",context);
 assert.equal(stage.dataset.greeting,'signup');assert.equal(classes.has('is-greeting'),true);assert.equal(delay,2700);
 callback();assert.equal(classes.has('is-greeting'),false);
 vm.runInContext("playSpoolGreeting('login')",context);assert.equal(stage.dataset.greeting,'login');
 vm.runInContext("playSpoolGreeting('forgot')",context);assert.equal(classes.has('is-greeting'),false);
});
test('selecting the active form cannot clear fields or restart its welcome animation',()=>{
 let resets=0,greetings=0;
 const context=vm.createContext({authMode:'login',authBusy:false,modeCopy:{login:{},signup:{}},clearSecrets(){resets++;},playSpoolGreeting(){greetings++;}});
 vm.runInContext(source.slice(source.indexOf('function setAuthMode'),source.indexOf('function validateAuthField')),context);
 vm.runInContext("setAuthMode('login')",context);
 assert.equal(resets,0);assert.equal(greetings,0);
});
