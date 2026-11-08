// Authenticate the storefront by asking the server, never by trusting a broadcast.
let sessionCheckRunning = false;
async function refreshAccountSession() {
  if (!AuthClient.enabled || sessionCheckRunning) return;
  sessionCheckRunning = true;
  try {
    const data = await AuthClient.request('session');
    const label=document.querySelector('#account-label');
    window.boghcheAccountName=data.user.name;if(label) label.textContent=data.user.name;
    document.querySelector('.account-button')?.setAttribute('aria-label','حساب '+data.user.name);
  } catch {
    window.boghcheAccountName='';const label=document.querySelector('#account-label');if(label)label.textContent='ورود / ثبت‌نام';
  } finally {sessionCheckRunning=false;}
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
