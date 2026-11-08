const authForm=document.querySelector('#auth-form');
const authFields={name:document.querySelector('#auth-name'),email:document.querySelector('#auth-email'),password:document.querySelector('#auth-password'),confirm:document.querySelector('#auth-confirm')};
let authMode='login', authBusy=false;
const modeCopy={
 login:{title:'دوباره، از سرِ نخ.',subtitle:'یک قدم تا دنیای دوخته‌های دوست‌داشتنی.',button:'ورود به حساب'},
 signup:{title:'قصه‌ات را اینجا بدوز.',subtitle:'شروع یک همراهی تازه، با رنگ و پارچه.',button:'ساخت حساب'},
 forgot:{title:'سرِ نخ را پیدا کنیم.',subtitle:'ایمیل حسابت را برای بازیابی رمز وارد کن.',button:'درخواست بازیابی رمز'}
};
function authError(key,text){const input=authFields[key];document.querySelector('#'+key+'-error').textContent=text;input.setAttribute('aria-invalid',String(Boolean(text)));}
function setAuthMessage(text,state='notice'){const status=document.querySelector('#auth-status');status.dataset.state=state;document.querySelector('#status-text').textContent=text;}
function clearSecrets(){['password','confirm'].forEach(key=>{authFields[key].value='';authFields[key].type='password';});document.querySelectorAll('[data-reveal]').forEach(b=>{b.textContent='نمایش';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',b.dataset.reveal==='auth-password'?'نمایش رمز عبور':'نمایش تکرار رمز عبور');});}
function setAuthMode(mode,push=true){
 if(authBusy||!Object.hasOwn(modeCopy,mode))return;
 authMode=mode;clearSecrets();Object.keys(authFields).forEach(key=>authError(key,''));setAuthMessage('');
 const signup=mode==='signup',forgot=mode==='forgot',copy=modeCopy[mode];
 document.querySelector('#name-field').hidden=!signup;authFields.name.disabled=!signup;authFields.name.required=signup;
 document.querySelector('#confirm-field').hidden=!signup;authFields.confirm.disabled=!signup;authFields.confirm.required=signup;
 document.querySelector('#password-field').hidden=forgot;authFields.password.disabled=forgot;authFields.password.required=!forgot;
 authFields.password.autocomplete=signup?'new-password':'current-password';
 document.querySelector('#password-hint').hidden=!signup;
 document.querySelector('#login-options').hidden=mode!=='login';
 document.querySelector('#remember').checked=false;
 document.querySelector('#auth-title').textContent=copy.title;document.querySelector('#auth-subtitle').textContent=copy.subtitle;
 document.querySelector('#submit-label').textContent=AuthClient.enabled?copy.button:({login:'بررسی فرم ورود (نمایشی)',signup:'بررسی فرم ثبت‌نام (نمایشی)',forgot:'بررسی ایمیل بازیابی (نمایشی)'}[mode]);
 document.querySelectorAll('[data-mode]').forEach(tab=>{const selected=tab.dataset.mode===(signup?'signup':'login');tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
 document.querySelector('#auth-content').setAttribute('aria-labelledby',signup?'signup-tab':'login-tab');
 document.querySelector('.auth-shell').dataset.mode=mode;
 document.querySelector('#auth-content').classList.remove('form-enter');void document.querySelector('#auth-content').offsetWidth;document.querySelector('#auth-content').classList.add('form-enter');
 document.title=(signup?'ثبت‌نام':forgot?'بازیابی رمز':'ورود')+' | بقچه';
 if(push)history.pushState({},'',location.pathname+'?mode='+mode);
}
function validateAuthField(key){
 const input=authFields[key];if(input.disabled)return true;
 const value=input.value;
 let error='';
 if(key==='name'&&(value.trim().length<2||value.trim().length>60))error='نام را بین ۲ تا ۶۰ نویسه وارد کن.';
 if(key==='email'&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())||value.length>254))error='یک ایمیل معتبر وارد کن؛ مثل name@example.com.';
 if(key==='password'){
  if(!value)error='رمز عبور را وارد کن.';
  else if(value.length>128)error='رمز عبور نباید بیشتر از ۱۲۸ نویسه باشد.';
  else if(authMode==='signup'&&(value.length<8||!/[\p{L}]/u.test(value)||!/[\p{N}]/u.test(value)))error='رمز باید حداقل ۸ نویسه و شامل حرف و عدد باشد.';
 }
 if(key==='confirm'){
  if(!value)error='تکرار رمز عبور را وارد کن.';
  else if(value!==authFields.password.value)error='تکرار رمز با رمز عبور یکسان نیست.';
 }
 authError(key,error);return !error;
}
Object.entries(authFields).forEach(([key,input])=>{
 input.addEventListener('blur',()=>{if(input.value||input.getAttribute('aria-invalid')==='true')validateAuthField(key);});
 input.addEventListener('input',()=>{if(input.getAttribute('aria-invalid')==='true')validateAuthField(key);if(key==='password'&&authFields.confirm.value)validateAuthField('confirm');if(!authBusy)setAuthMessage('');});
});
document.querySelectorAll('[data-mode]').forEach(tab=>{
 tab.addEventListener('click',()=>setAuthMode(tab.dataset.mode));
 tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();if(authBusy)return;const next=event.key==='Home'?'login':event.key==='End'?'signup':tab.dataset.mode==='login'?'signup':'login';setAuthMode(next);document.querySelector('[data-mode="'+next+'"]').focus();}});
});
document.querySelector('#forgot-link').addEventListener('click',event=>{event.preventDefault();setAuthMode('forgot');authFields.email.focus();});
document.querySelectorAll('[data-reveal]').forEach(button=>button.addEventListener('click',()=>{const field=document.getElementById(button.dataset.reveal);const show=field.type==='password';field.type=show?'text':'password';button.textContent=show?'پنهان':'نمایش';button.setAttribute('aria-pressed',String(show));button.setAttribute('aria-label',(show?'پنهان‌کردن ':'نمایش ')+(field===authFields.password?'رمز عبور':'تکرار رمز عبور'));}));
function setAuthBusy(busy){
 authBusy=busy;authForm.setAttribute('aria-busy',String(busy));document.querySelector('.auth-shell').classList.toggle('is-processing',busy);
 document.querySelectorAll('#auth-form input,#auth-form button,[data-mode]').forEach(el=>{if(busy){el.dataset.wasDisabled=String(el.disabled);el.disabled=true;}else{el.disabled=el.dataset.wasDisabled==='true';delete el.dataset.wasDisabled;}});
 document.querySelector('#forgot-link').setAttribute('aria-disabled',String(busy));
}
async function announceSessionChange(){
 try{const channel=new BroadcastChannel('boghche-account');channel.postMessage({type:'session-changed'});channel.close();}catch{}
 try{localStorage.setItem('boghche-session-event',String(Date.now()));}catch{}
}
authForm.addEventListener('submit',async event=>{
 event.preventDefault();if(authBusy)return;
 const results=Object.keys(authFields).map(key=>validateAuthField(key));
 if(results.includes(false)){setAuthMessage('فیلدهای مشخص‌شده را بررسی کن.','error');Object.values(authFields).find(input=>input.getAttribute('aria-invalid')==='true')?.focus();return;}
 const mode=authMode;
 const payload={email:authFields.email.value.trim()};
 if(mode!=='forgot'){payload.password=authFields.password.value;if(mode==='signup')payload.name=authFields.name.value.trim();else payload.remember=document.querySelector('#remember').checked;}
 setAuthBusy(true);setAuthMessage(AuthClient.enabled?'در حال ارسال درخواست امن…':'در حال بررسی نمایشی فرم…','processing');
 try{
  if(!AuthClient.enabled){
   // Only simulate the processing indicator. Never persist or transmit the payload.
   await new Promise(resolve=>setTimeout(resolve,650));
   setAuthMessage(mode==='forgot'?'ساختار ایمیل بررسی شد. سرویس بازیابی متصل نیست و ایمیلی ارسال نشد.':'اعتبارسنجی فرم انجام شد. این حالت نمایشی است؛ حسابی ساخته نشد و ورود واقعی انجام نشد.','demo');
  }else{
   const data=await AuthClient.request(mode,payload);
   if(mode==='forgot')setAuthMessage('اگر این ایمیل حسابی داشته باشد، راهنمای بازیابی برای آن ارسال می‌شود.','notice');
   else{await AuthClient.request('session');await announceSessionChange();setAuthMessage(mode==='signup'?'حساب ایجاد شد و وارد شدی. وضعیت حساب در تب فروشگاه به‌روز می‌شود.':'ورود انجام شد. وضعیت حساب در تب فروشگاه به‌روز می‌شود.','success');}
  }
 }catch(error){
  setAuthMessage(error.message==='RATE_LIMITED'?'تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کن.':error.name==='AbortError'?'پاسخ سرویس طول کشید. اتصال اینترنت را بررسی و دوباره تلاش کن.':mode==='login'?'ورود انجام نشد. ایمیل و رمز یا اتصال سرویس را بررسی کن.':'درخواست انجام نشد. اتصال سرویس را بررسی و دوباره تلاش کن.','error');
 }finally{delete payload.password;clearSecrets();setAuthBusy(false);document.querySelector('#auth-status').focus({preventScroll:true});}
});
window.addEventListener('popstate',()=>{if(authBusy){history.replaceState({},'',location.pathname+'?mode='+authMode);return;}const mode=new URLSearchParams(location.search).get('mode');setAuthMode(Object.hasOwn(modeCopy,mode)?mode:'login',false);});
window.addEventListener('pagehide',clearSecrets);
if(AuthClient.enabled){document.querySelector('#auth-disclosure').textContent='ورود از طریق سرویس امن فروشگاه؛ رمز در این مرورگر ذخیره نمی‌شود.';document.querySelector('.auth-footer>span').textContent='حساب کاربری بقچه';}
const initialMode=new URLSearchParams(location.search).get('mode');setAuthMode(Object.hasOwn(modeCopy,initialMode)?initialMode:'login',false);

// Progressive enhancement: keep submission disabled if the controller fails to load.
document.querySelector('.auth-submit').disabled=false;
