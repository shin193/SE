import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/auth-client.js',import.meta.url),'utf8');
function client({enabled=false,fetch}={}){
 const context=vm.createContext({location:{protocol:enabled?'https:':'file:'},fetch,setTimeout,clearTimeout,AbortController,window:{addEventListener(){}},document:{documentElement:{dataset:{}}},Object,Error});
 vm.runInContext(source,context);
 return vm.runInContext('AuthClient',context);
}
test('a directly opened file never sends credentials to a network endpoint',async()=>{
 let calls=0;const api=client({fetch:async()=>{calls++;}});
 await assert.rejects(api.request('login',{email:'test@example.com',password:'TestValue123'}),/AUTH_NOT_CONFIGURED/);
 assert.equal(calls,0);
});
test('enabled adapter uses same-origin cookies and a CSRF header, with credentials only in the POST body',async()=>{
 const requests=[];
 const api=client({enabled:true,fetch:async(url,options)=>{requests.push({url,options:{...options,headers:{...options.headers}}});return {ok:true,json:async()=>url.endsWith('/csrf')?{token:'csrf-test'}:{user:{name:'Test',email:'test@example.com'}}};}});
 const result=await api.request('login',{email:'test@example.com',password:'TestValue123',remember:true});
 assert.equal(result.user.name,'Test');assert.equal(requests.length,2);
 assert.equal(requests[0].url,'/api/auth/csrf');assert.equal(requests[1].url,'/api/auth/login');
 assert.equal(requests[1].options.credentials,'same-origin');assert.equal(requests[1].options.cache,'no-store');
 assert.equal(requests[1].options.method,'POST');assert.equal(requests[1].options.headers['X-CSRF-Token'],'csrf-test');
 assert.equal(JSON.parse(requests[1].options.body).remember,true);
 assert.equal(requests.some(r=>r.url.includes('TestValue123')),false);
});
test('a successful HTTP response without a valid user cannot count as login success',async()=>{
 const api=client({enabled:true,fetch:async url=>({ok:true,json:async()=>url.endsWith('/csrf')?{token:'csrf-test'}:{success:true}})});
 await assert.rejects(api.request('login',{}),/INVALID_RESPONSE/);
});
test('request limits produce a distinct retryable error',async()=>{
 const api=client({enabled:true,fetch:async url=>url.endsWith('/csrf')?{ok:true,json:async()=>({token:'csrf-test'})}:{ok:false,status:429}});
 await assert.rejects(api.request('login',{}),/RATE_LIMITED/);
});
test('the storefront rechecks the server after a session signal instead of trusting broadcast user data',async()=>{
 const sync=await readFile(new URL('../dist/account-sync.js',import.meta.url),'utf8');
 let handler,calls=0;const label={textContent:''};const window={addEventListener(){}};
 class Channel{constructor(){}addEventListener(type,fn){handler=fn;}}
 const context=vm.createContext({AuthClient:{enabled:true,request:async()=>{calls++;return {user:{name:'Server verified name',email:'test@example.com'}};}},window,location:{protocol:'https:'},document:{querySelector:selector=>selector==='#account-label'?label:{setAttribute(){}},querySelectorAll:()=>[],documentElement:{}},BroadcastChannel:Channel,MutationObserver:class{observe(){}},URL});
 vm.runInContext(sync,context);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(label.textContent,'Server verified name');assert.equal(calls,1);
 handler({data:{type:'session-changed',user:{name:'Untrusted broadcast name'}}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,2);assert.equal(label.textContent,'Server verified name');
});
test('local-file authentication links retain the selected palette after repeated theme changes',async()=>{
 const sync=await readFile(new URL('../dist/account-sync.js',import.meta.url),'utf8');
 let onThemeChange;const root={dataset:{theme:'clay'}};
 const link={href:'auth.html?mode=login',getAttribute(){return this.href;}};
 const context=vm.createContext({AuthClient:{enabled:false},window:{addEventListener(){}},location:{protocol:'file:',href:'file:///demo/index.html'},document:{querySelectorAll:()=>[link],documentElement:root},BroadcastChannel:class{addEventListener(){}},MutationObserver:class{constructor(fn){onThemeChange=fn;}observe(){}},URL});
 vm.runInContext(sync,context);
 assert.equal(new URL(link.href).searchParams.get('theme'),'clay');
 root.dataset.theme='sea';onThemeChange();
 assert.equal(new URL(link.href).searchParams.get('theme'),'sea');
 assert.equal(new URL(link.href).searchParams.get('mode'),'login');
});
