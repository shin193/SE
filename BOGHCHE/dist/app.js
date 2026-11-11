/* The catalog is loaded from the same-origin PostgreSQL API. */
const BRAND = { name: 'بقچه', storageKey: 'boghche-v1' };
let categories = {};
let categoryRecords = [];
let products = [];
let catalogReady = false;
const icons = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  user:'<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  bag:'<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  'arrow-left':'<path d="M20 12H4m6-6-6 6 6 6"/>', 'arrow-down':'<path d="M12 4v16m-6-6 6 6 6-6"/>',
  'arrow-up-left':'<path d="M18 18 6 6m0 9V6h9"/>', 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', x:'<path d="m6 6 12 12M6 18 18 6"/>', plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4"/>',
  instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
const $ = s => document.querySelector(s);
const fa = n => Number(n).toLocaleString('fa-IR');
const money = n => `${fa(n)} <small>تومان</small>`;
const escapeHtml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normal = s => String(s).normalize('NFKC').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200d]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
let stored = {};
try { stored = JSON.parse(localStorage.getItem(BRAND.storageKey) || '{}'); } catch {}
if (!stored || typeof stored !== 'object') stored = {};
const validProduct = id => products.find(p=>p.id===Number(id));
let favorites = new Set();
let cart = [];

function restoreShoppingState() {
  favorites = new Set(Array.isArray(stored.favorites) ? stored.favorites.filter(id=>validProduct(id)).map(Number) : []);
  cart = Array.isArray(stored.cart) ? stored.cart.filter(row=>
    row && validProduct(row.id)?.colors.includes(row.color) &&
    Number.isInteger(row.quantity) && row.quantity>0 && row.quantity<=99
  ).map(row=>({id:Number(row.id),color:row.color,quantity:row.quantity})) : [];
}
let collection = 'featured', category = -1, query = '', sort = 'default', currentView = '', selectedProduct = null, selectedColor = '', toastTimer;
function persist(){if(!catalogReady)return;try{localStorage.setItem(BRAND.storageKey,JSON.stringify({cart,favorites:[...favorites]}));}catch{toast('ذخیره‌سازی مرورگر در دسترس نیست؛ انتخاب‌ها تا بستن صفحه باقی می‌مانند.');}updateCounts();}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function photo(image) {
  if (!image) return '<span class="photo-placeholder" aria-hidden="true">'+icon('bag')+'</span>';
  const alt=escapeHtml(image.alt);
  if (image.src==='assets/collection.png' && Number.isInteger(image.atlasCell) && image.atlasCell>=0 && image.atlasCell<=8) {
    return '<div class="product-photo" style="--col:'+image.atlasCell%3+';--row:'+Math.floor(image.atlasCell/3)+'" role="img" aria-label="'+alt+'"></div>';
  }
  if(!URL.canParse(image.src,location.href))return photo(null);
  const source=new URL(image.src,location.href);
  if (source.origin!==location.origin&&source.protocol!=='https:')return photo(null);
  return '<img class="product-photo" src="'+escapeHtml(source.href)+'" alt="'+alt+'" loading="lazy">';
}
function updateCounts(){const n=cart.reduce((sum,r)=>sum+r.quantity,0);$('#cart-count').textContent=fa(n);$('[data-action="cart"]').setAttribute('aria-label',`سبد خرید، ${fa(n)} قلم`);$('#favorite-count').textContent=fa(favorites.size);$('#favorite-count').hidden=!favorites.size;$('#account-label').textContent=window.boghcheAccountName||'ورود / ثبت‌نام';}
function catalogHref(id){return (id<0?'?collection=all':'?category='+id)+'#catalog';}
function categoryLink(record){
  return '<a class="category-tile" href="'+catalogHref(record.id)+'" data-category="'+record.id+'"><span class="category-tile-image" aria-hidden="true">'+(record.image?photo(record.image):icon('grid'))+'</span><span>'+escapeHtml(record.name)+'</span></a>';
}
function renderCategories(){
  const tiles=categoryRecords.map(categoryLink).join('');
  const all='<a class="all-products-link" href="'+catalogHref(-1)+'" data-category="-1">مشاهده همه محصولات '+icon('arrow-left')+'</a>';
  $('#category-grid').innerHTML=categoryRecords.map(record=>
    '<a class="category-card" href="'+catalogHref(record.id)+'" data-category="'+record.id+'"><div class="category-art">'+(record.image?photo(record.image):icon('grid'))+'</div><h3>'+escapeHtml(record.name)+'</h3><small>'+fa(record.count)+' محصول</small></a>'
  ).join('');
  $('#category-menu').innerHTML='<div class="category-menu-grid">'+tiles+'</div>'+all;
  $('#mobile-nav').innerHTML='<a href="#">خانه</a><button id="mobile-products-menu" type="button" aria-expanded="false" aria-controls="mobile-categories">محصولات '+icon('chevron-down')+'</button><div id="mobile-categories" data-open="false" inert><div><div class="category-menu-grid">'+tiles+'</div>'+all+'</div></div><a href="#story">داستان ما</a><a href="auth.html?mode=login" target="_blank" rel="noopener" aria-label="ورود یا ثبت‌نام، در تب جدید">ورود / ثبت‌نام ↗</a>';
}
function productCard(p){return `<article class="product-card"><div class="product-image"><a class="photo-button" href="?product=${p.id}" data-product="${p.id}" aria-label="مشاهده ${escapeHtml(p.name)}">${photo(p.images[0])}</a><button class="favorite-toggle" data-favorite="${p.id}" aria-label="${favorites.has(p.id)?'حذف از':'افزودن به'} علاقه‌مندی‌ها: ${escapeHtml(p.name)}" aria-pressed="${favorites.has(p.id)}">${icon('heart')}</button><span class="product-badge">${p.new?'تازه‌دوخته':'منتخب بقچه'}</span><button class="quick-add" data-add="${p.id}" aria-label="افزودن ${escapeHtml(p.name)} به سبد خرید">${icon('plus')}</button></div><div class="product-meta"><span>${escapeHtml(categories[p.category])}</span><span class="color-dots" aria-label="${escapeHtml(p.colors.join('، '))}">${p.hex.map(c=>`<i style="--dot:${c}"></i>`).join('')}</span></div><a class="product-title" href="?product=${p.id}" data-product="${p.id}">${escapeHtml(p.name)}</a><div class="product-price">${money(p.price)}</div></article>`;}
function renderCatalog(){
  if(!catalogReady)return;
  let list=products.filter(p=>(category<0||p.category===category) && (!query||normal(p.name+' '+categories[p.category]+' '+p.description).includes(normal(query))) && (collection==='all'||(collection==='featured'?p.featured:p.new)));
  if(sort==='low')list.sort((a,b)=>a.price-b.price);if(sort==='high')list.sort((a,b)=>b.price-a.price);if(sort==='new')list.sort((a,b)=>b.id-a.id);
  $('#filter-chips').innerHTML=[-1,...categoryRecords.map(record=>record.id)].map(i=>`<button class="filter-chip ${category===i?'selected':''}" data-category="${i}" aria-pressed="${category===i}">${i<0?'همه دسته‌ها':escapeHtml(categories[i])}</button>`).join('');
  $('#product-grid').innerHTML=list.length?list.map(productCard).join(''):`<div class="empty-state">${icon('search')}<h3>دوخته‌ای با این مشخصات پیدا نشد</h3><p>دسته‌بندی یا عبارت جست‌وجو را تغییر بده.</p><button class="button outline" data-reset>دیدن همه محصولات</button></div>`;
  $('#result-count').innerHTML=`${fa(list.length)} محصول${query?` · <span class="search-term">${escapeHtml(query)}<button data-clear-search aria-label="پاک کردن جست‌وجو">×</button></span>`:''}`;
  $('#catalog-title').textContent=category>=0?categories[category]:'دوخته‌های دوست‌داشتنی';
  document.querySelectorAll('[data-collection]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.collection===collection)));
  $('#show-all').hidden=collection==='all'&&category===-1&&!query;
}
function selectCategory(i,push=true){
  const id=Number(i);
  if(!catalogReady||id!==-1&&!Object.hasOwn(categories,id))return;
  showHome(false);
  category=id;collection='all';query='';renderCatalog();closeNavigation();
  if(push)history.pushState({},'',catalogHref(id));
  $('#catalog-title').focus({preventScroll:true});
  $('#catalog').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function setCategoryMenu(trigger,panel,open){
  if(!trigger||!panel)return;
  trigger.setAttribute('aria-expanded',String(open));
  panel.dataset.open=String(open);
  panel.inert=!open;
}
function closeNavigation(){
  setCategoryMenu($('#products-menu'),$('#category-menu'),false);
  setCategoryMenu($('#mobile-products-menu'),$('#mobile-categories'),false);
  $('#mobile-nav').hidden=true;
  $('[data-action="menu"]').setAttribute('aria-expanded','false');
}
function toggleFavorite(id){id=Number(id);favorites.has(id)?favorites.delete(id):favorites.add(id);persist();renderCatalog();if(currentView==='favorites')renderFavorites();else if(currentView==='detail')renderDetail();toast(favorites.has(id)?'به علاقه‌مندی‌ها اضافه شد':'از علاقه‌مندی‌ها حذف شد');}
function addToCart(id,color,quantity=1){
 const p=validProduct(id);if(!p)return false;
 if(!color&&p.colors.length>1){navigateProduct(p.id,true,false,'لطفاً پیش از افزودن، رنگ محصول را انتخاب کن.');return false;}
 color=color||p.colors[0];
 if(!p.colors.includes(color)||!variantAvailable(p,color)){toast('این رنگ در حال حاضر ناموجود است.');return false;}
 if(!Number.isInteger(quantity)||quantity<1||quantity>99){productMessage('تعداد باید عددی بین ۱ تا ۹۹ باشد.');return false;}
 const row=cart.find(r=>r.id===p.id&&r.color===color);
 const limit=Math.min(99,variantStock(p,color));
 if((row?.quantity||0)+quantity>limit){productMessage('برای این رنگ تا '+fa(limit)+' عدد می‌توانی به سبد اضافه کنی.');return false;}
 if(row)row.quantity+=quantity;else cart.push({id:p.id,color,quantity});persist();toast(p.name+' به سبد خرید اضافه شد');return true;
}
const modal=$('#modal');
function openModal(title,view){closeNavigation();currentView=view;$('#modal-title').textContent=title;if(!modal.open){modal.showModal();document.body.style.overflow='hidden';}$('#modal-content').scrollTop=0;}
function closeModal(){modal.close();}
modal.addEventListener('close',()=>{document.body.style.overflow='';currentView='';});
$('#close-modal').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function renderDetail(){renderProductPage();}
function renderCart(){openModal('سبد خرید تو','cart');if(!cart.length){$('#modal-content').innerHTML=`<div class="empty-state">${icon('bag')}<h3>جای یک دوختهٔ دوست‌داشتنی خالی است</h3><p>از مجموعه دیدن کن و همراه روزت را انتخاب کن.</p><button class="button primary" data-browse>مشاهده محصولات ${icon('arrow-left')}</button></div>`;return;}
  $('#modal-content').innerHTML=cart.map((r,i)=>{const p=validProduct(r.id);return `<div class="cart-row"><button class="cart-thumb" data-product="${p.id}" aria-label="جزئیات ${escapeHtml(p.name)}" style="padding:0">${photo(p.images[0])}</button><div class="cart-row-info"><h3>${escapeHtml(p.name)}</h3><small>${escapeHtml(r.color)}</small><div class="quantity"><button data-quantity="${i}" data-delta="1" aria-label="افزایش تعداد ${escapeHtml(p.name)}">${icon('plus')}</button><span>${fa(r.quantity)}</span><button data-quantity="${i}" data-delta="-1" aria-label="کاهش تعداد ${escapeHtml(p.name)}">${icon('minus')}</button><button class="remove" data-remove="${i}" aria-label="حذف ${escapeHtml(p.name)}">${icon('trash')}</button></div></div><div class="cart-price">${money(p.price*r.quantity)}</div></div>`;}).join('')+`<div class="cart-total"><span>جمع محصولات</span><strong>${money(cart.reduce((s,r)=>s+validProduct(r.id).price*r.quantity,0))}</strong></div><button class="button primary full" data-summary>مرور سفارش نمونه ${icon('arrow-left')}</button><p class="modal-note">هزینه و روش ارسال هنوز مشخص نشده است. این سبد نمایشی است و هیچ پرداخت یا سفارش واقعی ثبت نمی‌کند.</p>`;
}
function renderFavorites(){openModal('دوخته‌های مورد علاقه','favorites');const list=products.filter(p=>favorites.has(p.id));$('#modal-content').innerHTML=list.length?`<div class="product-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${list.map(productCard).join('')}</div>`:`<div class="empty-state">${icon('heart')}<h3>کدام دوخته دلت را می‌برد؟</h3><p>قلب کنار محصولات را بزن تا اینجا نگه‌شان داریم.</p><button class="button primary" data-browse>دیدن مجموعه</button></div>`;}
function openSearch(){openModal('دنبال چه دوخته‌ای می‌گردی؟','search');$('#modal-content').innerHTML=`<form id="search-form"><label for="search-input" class="modal-note">نام محصول یا دسته‌بندی را بنویس</label><input id="search-input" class="search-input" placeholder="مثلاً کیف، جامدادی یا چهارخونه…" autocomplete="off" value="${escapeHtml(query)}"><div class="search-list" id="search-list"></div><button class="button outline full" type="submit">نمایش نتایج در فروشگاه ${icon('arrow-left')}</button></form>`;$('#search-input').addEventListener('input',renderSearch);$('#search-form').addEventListener('submit',e=>{e.preventDefault();showHome();query=$('#search-input').value.trim();category=-1;collection='all';renderCatalog();closeModal();$('#catalog').scrollIntoView({behavior:'smooth'});});renderSearch();setTimeout(()=>$('#search-input')?.focus(),30);}
function renderSearch(){const term=normal($('#search-input').value);const list=products.filter(p=>!term||normal(p.name+' '+categories[p.category]).includes(term));$('#search-list').innerHTML=list.length?list.slice(0,5).map(p=>`<button type="button" class="search-result" data-product="${p.id}"><div class="cart-thumb">${photo(p.images[0])}</div><div><h3>${escapeHtml(p.name)}</h3><p>${money(p.price)}</p></div>${icon('arrow-left')}</button>`).join(''):`<div class="empty-state"><p>نتیجه‌ای پیدا نشد. عبارت کوتاه‌تری را امتحان کن.</p></div>`;}
function openAccount(mode='login'){window.open('auth.html?mode='+encodeURIComponent(mode),'_blank','noopener');}
const info = {
  rules:['قوانین خرید','اطلاعات فعلی محصولات از کاتالوگ اولیه آمده است. سبد برای مرور انتخاب‌هاست و ثبت سفارش و پرداخت پس از تکمیل اطلاعات فروش فعال می‌شوند.'],
  shipping:['ارسال و مرجوعی','محدودهٔ ارسال، هزینه، زمان آماده‌سازی و شرایط مرجوعی هنوز از طرف فروشگاه اعلام نشده‌اند. تا زمان تکمیل این اطلاعات، سفارش واقعی ثبت نمی‌شود.'],
  privacy:['حریم خصوصی','سبد و علاقه‌مندی‌ها در مرورگر ذخیره می‌شوند. حساب و دیدگاه‌ها در سرور نگهداری می‌شوند و رمز عبور به‌شکل هش ذخیره می‌شود.'],
  contact:['تماس با ما','شماره تماس، نشانی و ایمیل رسمی فروشگاه هنوز ارائه نشده است. این بخش پس از تعیین اطلاعات برند تکمیل می‌شود.'],
  social:['شبکه‌های اجتماعی','نشانی رسمی شبکه‌های اجتماعی هنوز مشخص نشده است. بعد از دریافت نشانی معتبر، لینک مستقیم در این بخش قرار می‌گیرد.'],
  story:['از خیال تا دوخت','بقچه دنیایی از دوخته‌های پارچه‌ای است. هویت بصری از رنگ‌های طبیعی، بافت پارچه و ریتم دوخت الهام گرفته است. مسیر «خیال و طرح، رنگ و پارچه، نخ و دوخت» روایت پیشنهادی برند است؛ معرفی واقعی کارگاه، سازنده و فرایند تولید بعد از دریافت اطلاعات جایگزین می‌شود.']
};
function showInfo(key){const entry=info[key];if(!entry)return;openModal(entry[0],'info');$('#modal-content').innerHTML=`<p class="info-text">${entry[1]}</p>`;}
document.addEventListener('click',e=>{
  const b=e.target.closest('button,a');if(!b)return;
  if(b instanceof HTMLAnchorElement && (e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;
  if(b.dataset.category!==undefined){e.preventDefault();selectCategory(b.dataset.category);}
  if(b.dataset.collection){collection=b.dataset.collection;renderCatalog();}
  if(b.dataset.product){e.preventDefault();navigateProduct(b.dataset.product,true,!!b.closest('.product-card'));}
  if(b.dataset.favorite)toggleFavorite(b.dataset.favorite);
  if(b.dataset.add)addToCart(b.dataset.add);
  if(b.dataset.color){selectedColor=b.dataset.color;renderDetail();}
  if(b.dataset.detailAdd)addToCart(b.dataset.detailAdd,selectedColor);
  if(b.dataset.quantity!==undefined){
    const row=cart[Number(b.dataset.quantity)];
    const delta=Number(b.dataset.delta);
    if(delta>0&&row.quantity>=Math.min(99,variantStock(validProduct(row.id),row.color))){
      toast('تعداد این رنگ به سقف موجودی رسیده است.');
    }else{row.quantity+=delta;cart=cart.filter(r=>r.quantity>0);persist();renderCart();}
  }
  if(b.dataset.remove!==undefined){cart.splice(Number(b.dataset.remove),1);persist();renderCart();}
  if(b.hasAttribute('data-browse')){closeModal();selectCategory(-1);}
  if(b.hasAttribute('data-reset')){category=-1;query='';collection='all';sort='default';$('#sort').value='default';renderCatalog();}
  if(b.hasAttribute('data-clear-search')){query='';renderCatalog();}
  if(b.dataset.info)showInfo(b.dataset.info);
  if(b.dataset.accountMode)openAccount(b.dataset.accountMode);
  if(b.hasAttribute('data-summary')){openModal('مرور سفارش نمونه','summary');$('#modal-content').innerHTML=`<p class="account-notice">این یک پیش‌نمایش است؛ سفارشی ثبت نشده و پرداختی انجام نمی‌شود.</p><div class="info-text" style="margin-top:18px">${cart.map(r=>`${escapeHtml(validProduct(r.id).name)} — ${escapeHtml(r.color)} × ${fa(r.quantity)}`).join('<br>')}</div><div class="cart-total"><span>جمع نمونه</span><strong>${money(cart.reduce((s,r)=>s+validProduct(r.id).price*r.quantity,0))}</strong></div><button class="button outline full" data-action="cart">بازگشت به سبد</button>`;}
  if(b.dataset.action==='cart')renderCart();if(b.dataset.action==='favorites')renderFavorites();if(b.dataset.action==='search')openSearch();if(b.dataset.action==='account')openAccount();
  if(b.dataset.action==='menu'){const open=$('#mobile-nav').hidden;$('#mobile-nav').hidden=!open;b.setAttribute('aria-expanded',String(open));}
  if(b.id==='mobile-products-menu')setCategoryMenu(b,$('#mobile-categories'),b.getAttribute('aria-expanded')==='false');
  if(b.closest('#mobile-nav')&&b.tagName==='A')closeNavigation();
  if(b.hasAttribute('data-new-link')){collection='new';category=-1;query='';renderCatalog();}
});
$('#products-menu').addEventListener('click',event=>{
  const trigger=event.currentTarget;
  setCategoryMenu(trigger,$('#category-menu'),trigger.getAttribute('aria-expanded')==='false');
});
document.addEventListener('click',event=>{
  if(!event.target.closest('.nav-dropdown'))setCategoryMenu($('#products-menu'),$('#category-menu'),false);
  if(!event.target.closest('#mobile-nav,[data-action="menu"]')&&!$('#mobile-nav').hidden)closeNavigation();
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||modal.open)return;
  const trigger=$('#products-menu[aria-expanded="true"]')||$('#mobile-products-menu[aria-expanded="true"]');
  if(trigger){
    event.preventDefault();
    setCategoryMenu(trigger,$('#'+trigger.getAttribute('aria-controls')),false);
    trigger.focus();
  }else if(!$('#mobile-nav').hidden){
    event.preventDefault();
    closeNavigation();
    $('[data-action="menu"]').focus();
  }
});
$('#sort').addEventListener('change',e=>{sort=e.target.value;renderCatalog();});
['show-all','all-categories','footer-all'].forEach(id=>$('#'+id).addEventListener('click',()=>selectCategory(-1)));
document.querySelectorAll('[data-brand]').forEach(el=>el.textContent=BRAND.name);
hydrateIcons();updateCounts();

// A particle-drawn sewing machine. The silhouette is defined in a small offscreen canvas.
// Pointer repulsion springs back into place; reduced-motion users get a static silhouette.
function initMachine(){
  const canvas=$('#sewing-machine'),ctx=canvas.getContext('2d');if(!ctx)return;
  const shape=document.createElement('canvas');shape.width=360;shape.height=240;const s=shape.getContext('2d');
  s.fillStyle='#677255';s.beginPath();s.roundRect(76,58,214,42,13);s.fill();s.beginPath();s.roundRect(239,77,51,113,6);s.fill();s.beginPath();s.roundRect(76,80,40,62,5);s.fill();
  s.fillStyle='#566346';s.beginPath();s.roundRect(54,182,259,23,6);s.fill();s.fillRect(70,205,22,8);s.fillRect(275,205,22,8);
  s.fillStyle='#899175';s.beginPath();s.arc(293,89,32,0,Math.PI*2);s.fill();s.fillStyle='#5e6a4e';s.beginPath();s.arc(293,89,21,0,Math.PI*2);s.fill();s.fillStyle='#b9bba2';s.beginPath();s.arc(293,89,7,0,Math.PI*2);s.fill();
  s.fillStyle='#b29b76';s.fillRect(224,39,5,20);s.fillRect(214,25,24,16);s.fillStyle='#d4c4a0';s.fillRect(211,24,30,5);s.fillRect(211,41,30,4);
  s.fillStyle='#a7aa8c';s.fillRect(81,140,24,9);s.fillStyle='#6a715c';s.fillRect(92,149,4,27);s.fillRect(87,173,18,5);s.fillRect(121,176,74,5);
  s.fillStyle='#c3c4ab';s.fillRect(131,73,65,5);s.fillRect(131,82,41,4);s.fillStyle='#b6b798';s.beginPath();s.arc(259,125,9,0,Math.PI*2);s.fill();s.fillStyle='#556243';s.fillRect(257,119,3,12);
  s.fillStyle='#b2b69b';s.beginPath();s.moveTo(117,181);s.lineTo(183,181);s.lineTo(203,223);s.lineTo(136,223);s.closePath();s.fill();s.strokeStyle='#e3e2ce';s.setLineDash([3,4]);s.beginPath();s.moveTo(127,186);s.lineTo(145,222);s.stroke();
  const pixels=s.getImageData(0,0,360,240).data,particles=[];
  for(let y=0;y<240;y+=4)for(let x=0;x<360;x+=4){let k=(y*360+x)*4;if(pixels[k+3]>80)particles.push({x,y,ox:x,oy:y,vx:0,vy:0,color:`rgb(${pixels[k]},${pixels[k+1]},${pixels[k+2]})`});}
  let w=0,h=0,scale=1,px=-999,py=-999,frame=0,visible=true,raf=0,pulse=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(w/390,h/255);if(reduced.matches)draw();}
  function draw(){ctx.clearRect(0,0,w,h);const dx=(w-360*scale)/2,dy=(h-240*scale)/2;const floatY=reduced.matches?0:Math.sin(frame*.018)*2;
    ctx.save();ctx.translate(dx,dy+floatY);ctx.scale(scale,scale);
    for(const p of particles){if(!reduced.matches){let xx=p.x-px,yy=p.y-py,dist=Math.sqrt(xx*xx+yy*yy);if(dist<57&&dist>.01){const force=(57-dist)/57*1.8;p.vx+=xx/dist*force;p.vy+=yy/dist*force;}p.vx+=(p.ox-p.x)*.045;p.vy+=(p.oy-p.y)*.045;p.vx*=.82;p.vy*=.82;p.x+=p.vx;p.y+=p.vy;}ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3.1,3.1);}
    // Moving stitch and thread remain subtle, preserving the recognizable silhouette.
    ctx.strokeStyle='#ad8765';ctx.lineWidth=.8;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(225,45);ctx.bezierCurveTo(190,14,102,34,96,65);ctx.lineTo(96,150);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#626c50';ctx.fillRect(94,153+(reduced.matches?0:Math.sin(frame*.12)*3),1.5,20);ctx.restore();
    frame++;if(pulse>0){pulse--;if(!pulse){px=py=-999;}}
  }
  function tick(){raf=0;if(!visible||document.hidden||reduced.matches)return;draw();raf=requestAnimationFrame(tick);}
  function start(){if(!raf&&!reduced.matches&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
  function pointer(e){if(reduced.matches)return;const r=canvas.getBoundingClientRect();px=(e.clientX-r.left-(w-360*scale)/2)/scale;py=(e.clientY-r.top-(h-240*scale)/2)/scale;}
  canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerdown',e=>{pointer(e);pulse=45;});canvas.addEventListener('pointerleave',()=>{px=py=-999;});
  $('#stitch-button').addEventListener('click',()=>{if(reduced.matches){toast('برای احترام به تنظیم کاهش حرکت، چرخ ثابت نمایش داده می‌شود.');return;}px=165;py=92;pulse=40;});
  new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();},{threshold:.05}).observe(canvas);
  document.addEventListener('visibilitychange',start);reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(raf);raf=0;particles.forEach(p=>{p.x=p.ox;p.y=p.oy;p.vx=p.vy=0;});draw();}else start();});resize();draw();start();
}
initMachine();
