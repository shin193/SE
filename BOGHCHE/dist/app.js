/* Brand and catalog can be replaced here. All catalog values are demonstration data. */
const BRAND = { name: 'بقچه', storageKey: 'boghche-v1' };
const categories = ['کیف','لوازم آشپزخانه','جامدادی','جا قمقمه‌ای','جا سیخی','کیف لپ‌تاپ','پیش‌بند نقاشی و آشپزخانه'];
const products = [
  {id:1,name:'کیف دوشی زیتون',category:0,price:485000,cell:0,colors:['زیتونی','کرم'],hex:['#737953','#d7c5a2'],description:'یک همراه پارچه‌ای برای کتاب، دفتر و خرده‌ریزهای روزانه. دوخت‌های عمودی و دسته‌های روشن، ظاهر سادهٔ این کیف را کامل می‌کنند.',featured:true,new:false},
  {id:2,name:'ست آشپزخانه چهارخونه',category:1,price:325000,cell:1,colors:['سبز چهارخانه','کرم'],hex:['#9b9b7d','#d8ccb2'],description:'ترکیب چهارخانه‌های آرام و لبه‌دوزی زیتونی برای گوشهٔ آشپزخانه. این ست نمونه شامل دستکش پارچه‌ای و دستگیره است؛ مشخصات مقاومت حرارتی هنوز تأیید نشده است.',featured:true,new:true},
  {id:3,name:'جامدادی دارچین',category:2,price:185000,cell:2,colors:['دارچینی','زیتونی'],hex:['#ac6c46','#7b815e'],description:'جایی جمع‌وجور برای مدادها و ایده‌های کوچک. فرم ساده، زیپ سرتاسری و رنگ گرم دارچینی، آن را به همراهی برای میز کار تبدیل می‌کند.',featured:true,new:true},
  {id:4,name:'جا قمقمه‌ای چهارخونه',category:3,price:265000,cell:3,colors:['سبز چهارخانه'],hex:['#8d9471'],description:'برای وقتی که قمقمه هم با تو راهی می‌شود. یک کاور پارچه‌ای با بند بلند و طرح چهارخانه؛ قمقمهٔ داخل تصویر صرفاً برای نمایش کاربرد است.',featured:false,new:true},
  {id:5,name:'جا سیخی سفر',category:4,price:295000,cell:4,colors:['خاکی'],hex:['#8d8969'],description:'یک نظم‌دهندهٔ رول‌شونده برای وسایل پیک‌نیک. پارچهٔ خاکی و بند گره‌ای، فرم ساده و جمع‌شوندهٔ آن را شکل می‌دهند؛ سیخ همراه محصول نیست.',featured:false,new:false},
  {id:6,name:'کیف لپ‌تاپ ابر',category:5,price:545000,cell:5,colors:['کرم','زیتونی'],hex:['#d5c7ab','#7b815e'],description:'دوخت‌های موج‌دار، رنگ روشن و فرم پاکتی؛ همراه پارچه‌ای میز کار تو. اندازه و سازگاری با مدل‌های لپ‌تاپ باید پیش از فروش واقعی تکمیل شود.',featured:true,new:false},
  {id:7,name:'پیش‌بند باغچه',category:6,price:395000,cell:6,colors:['زیتونی'],hex:['#7c805e'],description:'برای آشپزی، رنگ‌زدن و ساختن چیزهای تازه. یک پیش‌بند زیتونی با جیب روشن برای ابزارهایی که دوست داری دم دست باشند.',featured:false,new:true},
  {id:8,name:'کیف گل‌های ریز',category:0,price:465000,cell:7,colors:['گل‌دار کرم'],hex:['#ded4b8'],description:'گل‌های کوچک روی زمینهٔ روشن؛ یک کیف پارچه‌ای برای روزهای سبک و قدم‌های بی‌عجله. دسته‌های هم‌طرح، قصهٔ گل‌ها را ادامه می‌دهند.',featured:false,new:true}
];
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
let favorites = new Set(Array.isArray(stored.favorites) ? stored.favorites.filter(id=>validProduct(id)).map(Number) : []);
let cart = Array.isArray(stored.cart) ? stored.cart.filter(row=>row && validProduct(row.id) && Number.isInteger(row.quantity) && row.quantity>0 && row.quantity<=99 && validProduct(row.id).colors.includes(row.color)) : [];
let profile = stored.profile && typeof stored.profile.name==='string' && typeof stored.profile.email==='string' ? stored.profile : null;
let collection = 'featured', category = -1, query = '', sort = 'default', currentView = '', selectedProduct = null, selectedColor = '', toastTimer;
function persist(){try{localStorage.setItem(BRAND.storageKey,JSON.stringify({cart,favorites:[...favorites],profile}));}catch{toast('ذخیره‌سازی مرورگر در دسترس نیست؛ انتخاب‌ها تا بستن صفحه باقی می‌مانند.');}updateCounts();}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function photo(p,cls=''){return `<div class="product-photo ${cls}" style="--col:${p.cell%3};--row:${Math.floor(p.cell/3)}" role="img" aria-label="${escapeHtml(p.name)}؛ تصویر نمونه"></div>`;}
function updateCounts(){const n=cart.reduce((sum,r)=>sum+r.quantity,0);$('#cart-count').textContent=fa(n);$('[data-action="cart"]').setAttribute('aria-label',`سبد خرید، ${fa(n)} قلم`);$('#favorite-count').textContent=fa(favorites.size);$('#favorite-count').hidden=!favorites.size;$('#account-label').textContent=profile?profile.name:'ورود / ثبت‌نام';}
function renderCategories(){
  $('#category-grid').innerHTML=categories.map((c,i)=>`<button class="category-card" data-category="${i}"><div class="category-art">${photo(products.find(p=>p.category===i))}</div><h3>${c}</h3><small>${fa(products.filter(p=>p.category===i).length)} محصول</small></button>`).join('');
  $('#category-menu').innerHTML=`<button data-category="-1">همه محصولات</button>`+categories.map((c,i)=>`<button data-category="${i}">${c}</button>`).join('');
  $('#mobile-nav').innerHTML=`<a href="#">خانه</a><button data-category="-1">همه محصولات</button>`+categories.map((c,i)=>`<button class="mobile-category" data-category="${i}">${c}</button>`).join('')+`<a href="#story">داستان ما</a><button data-action="account">ورود / ثبت‌نام</button>`;
}
function productCard(p){return `<article class="product-card"><div class="product-image"><button class="photo-button" data-product="${p.id}" aria-label="مشاهده ${p.name}">${photo(p)}</button><button class="favorite-toggle" data-favorite="${p.id}" aria-label="${favorites.has(p.id)?'حذف از':'افزودن به'} علاقه‌مندی‌ها: ${p.name}" aria-pressed="${favorites.has(p.id)}">${icon('heart')}</button><span class="product-badge">${p.new?'تازه‌دوخته':'منتخب بقچه'}</span><button class="quick-add" data-add="${p.id}" aria-label="افزودن ${p.name} به سبد خرید">${icon('plus')}</button></div><div class="product-meta"><span>${categories[p.category]}</span><span class="color-dots" aria-label="${p.colors.join('، ')}">${p.hex.map(c=>`<i style="--dot:${c}"></i>`).join('')}</span></div><button class="product-title" data-product="${p.id}">${p.name}</button><div class="product-price">${money(p.price)}</div></article>`;}
function renderCatalog(){
  let list=products.filter(p=>(category<0||p.category===category) && (!query||normal(p.name+' '+categories[p.category]+' '+p.description).includes(normal(query))) && (collection==='all'||(collection==='featured'?p.featured:p.new)));
  if(sort==='low')list.sort((a,b)=>a.price-b.price);if(sort==='high')list.sort((a,b)=>b.price-a.price);if(sort==='new')list.sort((a,b)=>b.id-a.id);
  $('#filter-chips').innerHTML=[-1,...categories.map((_,i)=>i)].map(i=>`<button class="filter-chip ${category===i?'selected':''}" data-category="${i}" aria-pressed="${category===i}">${i<0?'همه دسته‌ها':categories[i]}</button>`).join('');
  $('#product-grid').innerHTML=list.length?list.map(productCard).join(''):`<div class="empty-state">${icon('search')}<h3>دوخته‌ای با این مشخصات پیدا نشد</h3><p>دسته‌بندی یا عبارت جست‌وجو را تغییر بده.</p><button class="button outline" data-reset>دیدن همه محصولات</button></div>`;
  $('#result-count').innerHTML=`${fa(list.length)} محصول${query?` · <span class="search-term">${escapeHtml(query)}<button data-clear-search aria-label="پاک کردن جست‌وجو">×</button></span>`:''}`;
  $('#catalog-title').textContent=category>=0?categories[category]:'دوخته‌های دوست‌داشتنی';
  document.querySelectorAll('[data-collection]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.collection===collection)));
  $('#show-all').hidden=collection==='all'&&category===-1&&!query;
}
function selectCategory(i){category=Number(i);collection='all';query='';renderCatalog();closeNavigation();document.querySelector('#catalog').scrollIntoView({behavior:'smooth'});}
function closeNavigation(){$('#category-menu').hidden=true;$('#products-menu').setAttribute('aria-expanded','false');$('#mobile-nav').hidden=true;$('[data-action="menu"]').setAttribute('aria-expanded','false');}
function toggleFavorite(id){id=Number(id);favorites.has(id)?favorites.delete(id):favorites.add(id);persist();renderCatalog();if(currentView==='favorites')renderFavorites();else if(currentView==='detail')renderDetail();toast(favorites.has(id)?'به علاقه‌مندی‌ها اضافه شد':'از علاقه‌مندی‌ها حذف شد');}
function addToCart(id,color){const p=validProduct(id);if(!p)return;color=color||p.colors[0];const row=cart.find(r=>r.id===p.id&&r.color===color);if(row){if(row.quantity>=99){toast('حداکثر تعداد برای هر گزینه ۹۹ است');return;}row.quantity++;}else cart.push({id:p.id,color,quantity:1});persist();toast(`${p.name} به سبد خرید اضافه شد`);}
const modal=$('#modal');
function openModal(title,view){closeNavigation();currentView=view;$('#modal-title').textContent=title;if(!modal.open){modal.showModal();document.body.style.overflow='hidden';}$('#modal-content').scrollTop=0;}
function closeModal(){modal.close();}
modal.addEventListener('close',()=>{document.body.style.overflow='';currentView='';});
$('#close-modal').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function showProduct(id){selectedProduct=validProduct(id);if(!selectedProduct)return;selectedColor=selectedProduct.colors[0];openModal(selectedProduct.name,'detail');renderDetail();}
function renderDetail(){const p=selectedProduct;$('#modal-content').innerHTML=`<div class="detail-content"><div class="modal-photo">${photo(p)}</div><p>${p.description}</p><div class="swatch-selector"><span>رنگ نمونه:</span>${p.colors.map(c=>`<button data-color="${c}" aria-pressed="${c===selectedColor}">${c}</button>`).join('')}</div><div class="detail-line"><span class="product-price">${money(p.price)}</span><button class="icon-button" data-favorite="${p.id}" aria-pressed="${favorites.has(p.id)}" aria-label="علاقه‌مندی">${icon('heart')}</button></div><button class="button primary" data-detail-add="${p.id}">${icon('plus')} افزودن به سبد خرید</button><p class="modal-note">محصول، تصویر و قیمت نمونه است. مشخصات نهایی پارچه، ابعاد، موجودی و روش نگهداری هنوز ارائه نشده‌اند. تغییر رنگ، گزینهٔ سبد خرید را عوض می‌کند؛ تصویر نمونه ثابت است.</p></div>`;}
function renderCart(){openModal('سبد خرید تو','cart');if(!cart.length){$('#modal-content').innerHTML=`<div class="empty-state">${icon('bag')}<h3>جای یک دوختهٔ دوست‌داشتنی خالی است</h3><p>از مجموعه دیدن کن و همراه روزت را انتخاب کن.</p><button class="button primary" data-browse>مشاهده محصولات ${icon('arrow-left')}</button></div>`;return;}
  $('#modal-content').innerHTML=cart.map((r,i)=>{const p=validProduct(r.id);return `<div class="cart-row"><button class="cart-thumb" data-product="${p.id}" aria-label="جزئیات ${p.name}" style="padding:0">${photo(p)}</button><div class="cart-row-info"><h3>${p.name}</h3><small>${escapeHtml(r.color)}</small><div class="quantity"><button data-quantity="${i}" data-delta="1" aria-label="افزایش تعداد ${p.name}">${icon('plus')}</button><span>${fa(r.quantity)}</span><button data-quantity="${i}" data-delta="-1" aria-label="کاهش تعداد ${p.name}">${icon('minus')}</button><button class="remove" data-remove="${i}" aria-label="حذف ${p.name}">${icon('trash')}</button></div></div><div class="cart-price">${money(p.price*r.quantity)}</div></div>`;}).join('')+`<div class="cart-total"><span>جمع محصولات</span><strong>${money(cart.reduce((s,r)=>s+validProduct(r.id).price*r.quantity,0))}</strong></div><button class="button primary full" data-summary>مرور سفارش نمونه ${icon('arrow-left')}</button><p class="modal-note">هزینه و روش ارسال هنوز مشخص نشده است. این سبد نمایشی است و هیچ پرداخت یا سفارش واقعی ثبت نمی‌کند.</p>`;
}
function renderFavorites(){openModal('دوخته‌های مورد علاقه','favorites');const list=products.filter(p=>favorites.has(p.id));$('#modal-content').innerHTML=list.length?`<div class="product-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${list.map(productCard).join('')}</div>`:`<div class="empty-state">${icon('heart')}<h3>کدام دوخته دلت را می‌برد؟</h3><p>قلب کنار محصولات را بزن تا اینجا نگه‌شان داریم.</p><button class="button primary" data-browse>دیدن مجموعه</button></div>`;}
function openSearch(){openModal('دنبال چه دوخته‌ای می‌گردی؟','search');$('#modal-content').innerHTML=`<form id="search-form"><label for="search-input" class="modal-note">نام محصول یا دسته‌بندی را بنویس</label><input id="search-input" class="search-input" placeholder="مثلاً کیف، جامدادی یا چهارخونه…" autocomplete="off" value="${escapeHtml(query)}"><div class="search-list" id="search-list"></div><button class="button outline full" type="submit">نمایش نتایج در فروشگاه ${icon('arrow-left')}</button></form>`;$('#search-input').addEventListener('input',renderSearch);$('#search-form').addEventListener('submit',e=>{e.preventDefault();query=$('#search-input').value.trim();category=-1;collection='all';renderCatalog();closeModal();$('#catalog').scrollIntoView({behavior:'smooth'});});renderSearch();setTimeout(()=>$('#search-input')?.focus(),30);}
function renderSearch(){const term=normal($('#search-input').value);const list=products.filter(p=>!term||normal(p.name+' '+categories[p.category]).includes(term));$('#search-list').innerHTML=list.length?list.slice(0,5).map(p=>`<button type="button" class="search-result" data-product="${p.id}"><div class="cart-thumb">${photo(p)}</div><div><h3>${p.name}</h3><p>${money(p.price)}</p></div>${icon('arrow-left')}</button>`).join(''):`<div class="empty-state"><p>نتیجه‌ای پیدا نشد. عبارت کوتاه‌تری را امتحان کن.</p></div>`;}
function openAccount(mode='login'){openModal(profile?'حساب نمایشی تو':'ورود / ثبت‌نام','account');if(profile){$('#modal-content').innerHTML=`<div class="empty-state">${icon('user')}<h3>سلام ${escapeHtml(profile.name)}</h3><p dir="ltr">${escapeHtml(profile.email)}</p><p>این پروفایل فقط در همین مرورگر ذخیره شده است.</p><button class="button outline" data-logout>خروج از پروفایل نمایشی</button></div>`;return;}
  $('#modal-content').innerHTML=`<div class="account-tabs"><button data-account-mode="login" class="${mode==='login'?'selected':''}">ورود</button><button data-account-mode="signup" class="${mode==='signup'?'selected':''}">ثبت‌نام</button></div><p class="account-notice">پیش‌نمایش حساب کاربری — احراز هویت و ارسال کد فعال نیست. برای امتحان رابط، یک نام و ایمیل نمونه وارد کن؛ اطلاعات فقط در همین مرورگر ذخیره می‌شود.</p><form id="account-form"><label class="form-field">نام نمایشی<input class="form-input" name="name" autocomplete="nickname" required minlength="2" maxlength="40" placeholder="مثلاً نگار"></label><label class="form-field">ایمیل نمونه<input class="form-input" name="email" type="email" dir="ltr" required maxlength="100" placeholder="negar@example.com" autocomplete="off"></label><button class="button primary full" type="submit">${mode==='login'?'ورود به':'ساخت'} پروفایل نمایشی</button></form>`;$('#account-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.target);const name=String(data.get('name')).trim();if(name.length<2){toast('نام باید دست‌کم دو حرف داشته باشد');return;}profile={name,email:String(data.get('email')).trim()};persist();openAccount();toast('پروفایل نمایشی در این مرورگر فعال شد');});}
const info = {
  rules:['قوانین خرید','این وب‌سایت نسخهٔ اول و نمایشی فروشگاه است. محصولات، تصاویر و قیمت‌ها برای بررسی طراحی و تعاملات آماده شده‌اند. پرداخت، ثبت سفارش واقعی و تعهد ارسال فعال نیست. قوانین نهایی خرید پس از دریافت اطلاعات فروشگاه در همین بخش قرار می‌گیرند.'],
  shipping:['ارسال و مرجوعی','محدودهٔ ارسال، هزینه، زمان آماده‌سازی و شرایط مرجوعی هنوز از طرف فروشگاه اعلام نشده‌اند. تا زمان تکمیل این اطلاعات، سفارش واقعی ثبت نمی‌شود.'],
  privacy:['حریم خصوصی','سبد خرید، علاقه‌مندی‌ها و پروفایل نمایشی در حافظهٔ محلی همین مرورگر ذخیره می‌شوند. این نسخه فرم پرداخت و رمز عبور ندارد. با پاک‌کردن داده‌های سایت در مرورگر، اطلاعات ذخیره‌شده حذف می‌شود.'],
  contact:['تماس با ما','شماره تماس، نشانی و ایمیل رسمی فروشگاه هنوز ارائه نشده است. این بخش پس از تعیین اطلاعات برند تکمیل می‌شود.'],
  social:['شبکه‌های اجتماعی','نشانی رسمی شبکه‌های اجتماعی هنوز مشخص نشده است. بعد از دریافت نشانی معتبر، لینک مستقیم در این بخش قرار می‌گیرد.'],
  story:['از خیال تا دوخت','بقچه دنیایی از دوخته‌های پارچه‌ای است. هویت بصری از رنگ‌های طبیعی، بافت پارچه و ریتم دوخت الهام گرفته است. مسیر «خیال و طرح، رنگ و پارچه، نخ و دوخت» روایت پیشنهادی برند است؛ معرفی واقعی کارگاه، سازنده و فرایند تولید بعد از دریافت اطلاعات جایگزین می‌شود.']
};
function showInfo(key){const entry=info[key];if(!entry)return;openModal(entry[0],'info');$('#modal-content').innerHTML=`<p class="info-text">${entry[1]}</p>`;}
document.addEventListener('click',e=>{
  const b=e.target.closest('button,a');if(!b)return;
  if(b.dataset.category!==undefined){e.preventDefault();selectCategory(b.dataset.category);}
  if(b.dataset.collection){collection=b.dataset.collection;renderCatalog();}
  if(b.dataset.product)showProduct(b.dataset.product);
  if(b.dataset.favorite)toggleFavorite(b.dataset.favorite);
  if(b.dataset.add)addToCart(b.dataset.add);
  if(b.dataset.color){selectedColor=b.dataset.color;renderDetail();}
  if(b.dataset.detailAdd)addToCart(b.dataset.detailAdd,selectedColor);
  if(b.dataset.quantity!==undefined){const row=cart[Number(b.dataset.quantity)];row.quantity=Math.min(99,row.quantity+Number(b.dataset.delta));cart=cart.filter(r=>r.quantity>0);persist();renderCart();}
  if(b.dataset.remove!==undefined){cart.splice(Number(b.dataset.remove),1);persist();renderCart();}
  if(b.hasAttribute('data-browse')){closeModal();selectCategory(-1);}
  if(b.hasAttribute('data-reset')){category=-1;query='';collection='all';sort='default';$('#sort').value='default';renderCatalog();}
  if(b.hasAttribute('data-clear-search')){query='';renderCatalog();}
  if(b.dataset.info)showInfo(b.dataset.info);
  if(b.dataset.accountMode)openAccount(b.dataset.accountMode);
  if(b.hasAttribute('data-logout')){profile=null;persist();openAccount();}
  if(b.hasAttribute('data-summary')){openModal('مرور سفارش نمونه','summary');$('#modal-content').innerHTML=`<p class="account-notice">این یک پیش‌نمایش است؛ سفارشی ثبت نشده و پرداختی انجام نمی‌شود.</p><div class="info-text" style="margin-top:18px">${cart.map(r=>`${escapeHtml(validProduct(r.id).name)} — ${escapeHtml(r.color)} × ${fa(r.quantity)}`).join('<br>')}</div><div class="cart-total"><span>جمع نمونه</span><strong>${money(cart.reduce((s,r)=>s+validProduct(r.id).price*r.quantity,0))}</strong></div><button class="button outline full" data-action="cart">بازگشت به سبد</button>`;}
  if(b.dataset.action==='cart')renderCart();if(b.dataset.action==='favorites')renderFavorites();if(b.dataset.action==='search')openSearch();if(b.dataset.action==='account')openAccount();
  if(b.dataset.action==='menu'){const open=$('#mobile-nav').hidden;$('#mobile-nav').hidden=!open;b.setAttribute('aria-expanded',String(open));}
  if(b.closest('#mobile-nav')&&b.tagName==='A')closeNavigation();
  if(b.hasAttribute('data-new-link')){collection='new';category=-1;query='';renderCatalog();}
});
$('#products-menu').addEventListener('click',()=>{const open=$('#category-menu').hidden;$('#category-menu').hidden=!open;$('#products-menu').setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown')){$('#category-menu').hidden=true;$('#products-menu').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNavigation();});
$('#sort').addEventListener('change',e=>{sort=e.target.value;renderCatalog();});
['show-all','all-categories','footer-all'].forEach(id=>$('#'+id).addEventListener('click',()=>selectCategory(-1)));
document.querySelectorAll('[data-brand]').forEach(el=>el.textContent=BRAND.name);
hydrateIcons();renderCategories();renderCatalog();updateCounts();

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
