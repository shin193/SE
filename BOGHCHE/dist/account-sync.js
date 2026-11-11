// Authenticate the storefront by asking the server, never by trusting a broadcast.
let sessionCheckRunning = false;
let sessionCheckPending = false;
async function refreshAccountSession() {
  if (!AuthClient.enabled) return;
  if (sessionCheckRunning) { sessionCheckPending=true; return; }
  sessionCheckRunning = true;
  const previousEmail=window.boghcheUser?.email;
  try {
    const data = await AuthClient.request('session');
    const label=document.querySelector('#account-label');
    window.boghcheUser=data.user;window.boghcheAccountName=data.user.name;if(label) label.textContent=data.user.name;
    document.querySelector('.account-button')?.setAttribute('aria-label','حساب '+data.user.name);
  } catch {
    window.boghcheUser=null;window.boghcheAccountName='';document.querySelector('.account-button')?.setAttribute('aria-label','ورود یا ثبت‌نام، در تب جدید');const label=document.querySelector('#account-label');if(label)label.textContent='ورود / ثبت‌نام';
  } finally {
    sessionCheckRunning=false;
    if(previousEmail!==window.boghcheUser?.email)window.dispatchEvent?.(new Event('boghche-session'));
    if(sessionCheckPending){sessionCheckPending=false;void refreshAccountSession();}
  }
}
let accountChannel;
try { accountChannel=new BroadcastChannel('boghche-account');accountChannel.addEventListener('message',event=>{if(event.data?.type==='session-changed')refreshAccountSession();}); } catch {}
window.addEventListener('storage',event=>{if(event.key==='boghche-session-event')refreshAccountSession();});
window.addEventListener('focus',refreshAccountSession);
refreshAccountSession();

function refreshAuthLinks(){document.querySelectorAll('a[href*="auth.html"]').forEach(link=>{const target=new URL(link.getAttribute('href'),location.href);if(location.protocol==='file:')target.searchParams.set('theme',document.documentElement.dataset.theme||'olive');link.href=target.href;});}
new MutationObserver(refreshAuthLinks).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
refreshAuthLinks();
// The mobile menu is rebuilt by the catalog renderer only at startup.
