/* Theme state is independent of product variants and shopping data. */
const specificationSamples = [
 ['کتان پنبه‌ای با دوخت عمودی','۳۵ × ۳۰ × ۱۰ سانتی‌متر','حمل کتاب و وسایل روزانه'],
 ['پنبهٔ چهارخانه با لایهٔ میانی پارچه‌ای','دستکش ۲۸ × ۱۷؛ دستگیره ۲۰ × ۲۰ سانتی‌متر','همراهی دکور آشپزخانه؛ مقاومت حرارتی تأیید نشده است'],
 ['کتان با آستر پنبه‌ای','۲۱ × ۸ × ۶ سانتی‌متر','نگهداری مداد و لوازم تحریر'],
 ['پنبهٔ چهارخانه با بند پارچه‌ای','ارتفاع ۲۳؛ قطر ۸ سانتی‌متر','حمل قمقمه؛ قمقمه در محصول نمونه لحاظ نشده'],
 ['برزنت پنبه‌ای','۶۰ × ۳۵ سانتی‌متر در حالت باز','نظم‌دهی سیخ‌های سرد و تمیز؛ سیخ همراه نیست'],
 ['کتان پنبه‌ای با دوخت لحافی','۳۴ × ۲۵ سانتی‌متر','حمل لپ‌تاپ؛ سازگاری ابعاد باید پیش از خرید تأیید شود'],
 ['لینن پنبه‌ای','۷۵ × ۶۰ سانتی‌متر','نقاشی و آشپزی روزانه'],
 ['پنبهٔ چاپ‌دار با آستر ساده','۳۲ × ۲۸ × ۹ سانتی‌متر','حمل وسایل سبک روزمره']
];
// Availability and specifications are demonstration records, never live inventory.
const unavailableVariants={2:['کرم'],6:['زیتونی']};
function variantAvailable(p,color){return p.colors.includes(color)&&!(unavailableVariants[p.id]||[]).includes(color);}
// Optional per-colour image records: { productId: { colourName: {src, alt} } }.
// No colour-specific photographs have been supplied; keep the original photograph honest.
const variantImages={};
let activeGallery=0, productQuantity=1;
const homeMain=$('#main'), productMain=$('#product-page');
function productHref(id){return `${location.pathname}?product=${id}`;}
function showHome(push=true){
 if(productMain.hidden)return;
 if(modal.open)closeModal();productMain.hidden=true;homeMain.hidden=false;
 document.title='بقچه | با نخ، با عشق، برای زندگی';
 if(push)history.pushState({},'',location.pathname);selectedProduct=null;
}
function navigateProduct(id,push=true){
 const p=validProduct(id);if(modal.open)closeModal();closeNavigation();
 if(push)history.pushState({},'',productHref(id));
 homeMain.hidden=true;productMain.hidden=false;
 selectedProduct=p;selectedColor=p&&p.colors.length===1&&variantAvailable(p,p.colors[0])?p.colors[0]:'';
 activeGallery=0;productQuantity=1;
 if(!p){document.title='محصول پیدا نشد | بقچه';productMain.innerHTML='<div class="empty-state"><h1>این دوخته پیدا نشد</h1><p>ممکن است آدرس محصول درست نباشد.</p><a class="button outline" href="index.html" data-home>بازگشت به فروشگاه</a></div>';}
 else{document.title=p.name+' | بقچه';renderProductPage();}
 productMain.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
}
function syncProductRoute(){const id=new URLSearchParams(location.search).get('product');if(id!==null){if(productMain.hidden||String(selectedProduct?.id)!==id)navigateProduct(id,false);}else showHome(false);}
function productMessage(message,error=true){const el=$('#product-message');if(el){el.textContent=message;el.dataset.error=String(error);}else toast(message);}
function galleryPhoto(p,index=activeGallery){
 const image=variantImages[p.id]?.[selectedColor];
 const inner=image?`<img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt||p.name)}">`:photo(p);
 return `<div class="gallery-picture ${index===1?'detail-crop':''}">${inner}</div>`;
}
function renderProductPage(){
 const p=selectedProduct;if(!p)return;const specs=specificationSamples[p.id-1];
 productMain.innerHTML=`<nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="index.html" data-home>خانه</a><span>/</span><a href="index.html#catalog" data-home-category="${p.category}">${categories[p.category]}</a><span>/</span><span>${p.name}</span></nav>
 <div class="product-layout"><section class="product-gallery" aria-label="گالری ${p.name}"><button class="gallery-main" id="zoom-product" aria-label="بزرگ‌نمایی تصویر ${p.name}">${galleryPhoto(p)}<span class="zoom-label">${icon('search')} بزرگ‌نمایی</span></button><div class="gallery-thumbnails" aria-label="انتخاب تصویر">${['نمای کامل','جزئیات بافت (برش تصویر)'].map((label,i)=>`<button data-gallery="${i}" aria-pressed="${activeGallery===i}" aria-label="${label}">${galleryPhoto(p,i)}<span>${label}</span></button>`).join('')}</div><p class="modal-note">تصویر نمونه است. نمای جزئیات، برشی از همین عکس است. تصویر اختصاصی رنگ‌های دیگر هنوز ارائه نشده است.</p></section>
 <section class="product-purchase" aria-labelledby="product-name"><span class="section-kicker">${categories[p.category]} · دوخته‌های بقچه</span><h1 id="product-name">${p.name}</h1><a href="#reviews" class="review-anchor" id="rating-summary"></a><div class="purchase-price">${money(p.price)}</div><span class="stock-label">${p.colors.some(c=>variantAvailable(p,c))?'موجود در کاتالوگ آزمایشی':'ناموجود در کاتالوگ آزمایشی'}</span><p class="product-intro">${p.description}</p>
 <fieldset class="variant-field"><legend>رنگ محصول <small>${p.colors.length>1?'انتخاب الزامی':'رنگ ارائه‌شده'}</small></legend><div class="variant-options">${p.colors.map((c,i)=>`<button type="button" class="variant-option" data-variant="${c}" aria-pressed="${selectedColor===c}" ${variantAvailable(p,c)?'':'disabled'}><i style="--swatch:${p.hex[i]}" aria-hidden="true"></i><span>${c}</span><span class="variant-check" aria-hidden="true">${selectedColor===c?'✓':''}</span>${variantAvailable(p,c)?'':'<small>ناموجود</small>'}</button>`).join('')}</div><p id="selected-color-label">${selectedColor?'رنگ انتخاب‌شده: '+selectedColor:'هنوز رنگی انتخاب نکرده‌ای.'}</p></fieldset>
 <div class="purchase-actions"><label for="product-quantity">تعداد<input id="product-quantity" type="number" min="1" max="99" step="1" value="${productQuantity}" inputmode="numeric"></label><button class="button primary" id="add-product">${icon('bag')} افزودن به سبد خرید</button><button class="icon-button" id="product-favorite" aria-pressed="${favorites.has(p.id)}" aria-label="علاقه‌مندی ${p.name}">${icon('heart')}</button></div><p id="product-message" class="form-status" role="status" aria-live="polite"></p><p class="demo-label">کاتالوگ آزمایشی · قیمت و موجودی واقعی تأیید نشده‌اند.</p>
 <div class="product-specs"><h2>از پارچه تا کاربرد</h2><p>مشخصات زیر پیشنهادی و نمونه هستند و پیش از فروش واقعی باید تأیید شوند.</p><dl><div><dt>کاربرد</dt><dd>${specs[2]}</dd></div><div><dt>جنس پارچه (نمونه)</dt><dd>${specs[0]}</dd></div><div><dt>ابعاد (نمونه)</dt><dd>${specs[1]}</dd></div><div><dt>روش نگهداری پیشنهادی</dt><dd>شست‌وشوی ملایم با آب سرد و شویندهٔ رقیق، خشک‌کردن در سایه؛ دستور قطعی پس از تأیید پارچه اعلام می‌شود.</dd></div></dl></div></section></div>
 <section class="reviews-section" id="reviews" aria-labelledby="reviews-title"><div class="section-heading"><div><span class="section-kicker">تجربهٔ تو از این دوخته</span><h2 id="reviews-title">دیدگاه‌ها</h2></div><span class="demo-label">آزمایشی · فقط در همین مرورگر</span></div><p class="review-disclosure">دیدگاه‌ها به سرور متصل نیستند و نظر واقعی یا تأییدشدهٔ مشتریان محسوب نمی‌شوند. هیچ نظر از پیش‌ساخته‌ای نمایش داده نمی‌شود.</p><div class="reviews-layout"><div><div id="review-stats"></div><div id="review-list"></div></div><form id="review-form"><h3>دیدگاه آزمایشی خودت را بنویس</h3><label class="form-field">نام نمایشی<input class="form-input" name="displayName" required minlength="2" maxlength="40" value="${escapeHtml(profile?.name||'')}" autocomplete="nickname"></label><fieldset class="rating-field"><legend>امتیاز تو (الزامی)</legend><div class="star-input">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="rating" value="${n}" required><span aria-hidden="true">★</span><span class="sr-only">${fa(n)} ستاره</span></label>`).join('')}</div><span id="rating-label">از ۱ تا ۵ ستاره انتخاب کن</span></fieldset><label class="form-field">متن دیدگاه<textarea class="form-input" name="reviewText" required minlength="10" maxlength="1000" rows="4" placeholder="حداقل ۱۰ نویسه دربارهٔ این محصول بنویس…"></textarea></label><button class="button primary full" type="submit">ثبت دیدگاه آزمایشی</button><p id="review-status" class="form-status" role="status" aria-live="polite"></p></form></div></section>`;
 renderReviews();bindReviewForm();
 $('#product-quantity').addEventListener('input',e=>{productQuantity=Number(e.target.value);});
}
function getReviews(id){try{const data=JSON.parse(localStorage.getItem('boghche-reviews-'+id)||'[]');return Array.isArray(data)?data.filter(r=>r&&typeof r.name==='string'&&r.name.length<=40&&typeof r.text==='string'&&r.text.length<=1000&&Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5&&Number.isFinite(Date.parse(r.date))):[];}catch{return [];}}
function renderReviews(){const p=selectedProduct;if(!p)return;const list=getReviews(p.id);const avg=list.length?list.reduce((n,r)=>n+r.rating,0)/list.length:0;const summary=list.length?`${avg.toLocaleString('fa-IR',{maximumFractionDigits:1})} از ۵ · ${fa(list.length)} دیدگاه آزمایشی`:'هنوز دیدگاهی ثبت نشده؛ اولین نفر باش';$('#rating-summary').textContent='★ '+summary;$('#review-stats').textContent=list.length?summary:'اولین دیدگاه را تو بنویس.';
 $('#review-list').innerHTML=list.length?list.slice().reverse().map(r=>`<article class="review-item"><div><strong>${escapeHtml(r.name)}</strong><span class="review-stars" aria-label="${fa(r.rating)} از ۵ ستاره">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div><time datetime="${escapeHtml(r.date)}">${new Date(r.date).toLocaleDateString('fa-IR')}</time><span class="review-local-tag">دیدگاه محلی آزمایشی</span><button class="review-delete" data-review-delete="${escapeHtml(r.date)}" aria-label="حذف دیدگاه آزمایشی ${escapeHtml(r.name)}">حذف از این مرورگر</button><p>${escapeHtml(r.text)}</p></article>`).join(''):'<div class="empty-state"><h3>این قصه هنوز دیدگاهی ندارد</h3><p>می‌توانی اولین دیدگاه آزمایشی را ثبت کنی.</p></div>';
}
function bindReviewForm(){
 const form=$('#review-form');let sending=false, timer;
 form.addEventListener('change',e=>{if(e.target.name==='rating'){$('#rating-label').textContent=fa(e.target.value)+' از ۵ ستاره';form.querySelectorAll('.star-input label').forEach((l,i)=>l.classList.toggle('filled',i<Number(e.target.value)));}});
 form.addEventListener('input',()=>{const status=$('#review-status');if(!sending){status.textContent='';delete status.dataset.error;}});
 form.addEventListener('submit',e=>{
  e.preventDefault();if(sending)return;
  const data=new FormData(form),name=String(data.get('displayName')||'').trim(),text=String(data.get('reviewText')||'').trim(),rating=Number(data.get('rating'));const status=$('#review-status'),submit=form.querySelector('[type="submit"]');
  if(name.length<2||name.length>40||text.length<10||text.length>1000||!Number.isInteger(rating)||rating<1||rating>5){status.textContent='نام دست‌کم ۲ حرف، متن دست‌کم ۱۰ نویسه و امتیاز بین ۱ تا ۵ الزامی است.';status.dataset.error='true';return;}
  const id=selectedProduct.id;
  sending=true;submit.disabled=true;form.setAttribute('aria-busy','true');status.textContent='در حال ذخیرهٔ محلی دیدگاه…';
  timer=setTimeout(()=>{try{
   const list=getReviews(id);const duplicate=list.some(r=>normal(r.name)===normal(name)&&normal(r.text)===normal(text)&&r.rating===rating);
   if(duplicate){status.textContent='این دیدگاه قبلاً ثبت شده است؛ دوباره ذخیره نشد.';status.dataset.error='true';return;}
   list.push({name,text,rating,date:new Date().toISOString()});localStorage.setItem('boghche-reviews-'+id,JSON.stringify(list));
   if(selectedProduct?.id===id)renderReviews();form.reset();form.querySelectorAll('.filled').forEach(el=>el.classList.remove('filled'));const label=form.querySelector('#rating-label');if(label)label.textContent='از ۱ تا ۵ ستاره انتخاب کن';status.textContent='دیدگاه آزمایشی در همین مرورگر ذخیره شد.';status.dataset.error='false';
  }catch{status.textContent='ذخیره انجام نشد. دسترسی حافظهٔ مرورگر را بررسی کن و دوباره تلاش کن.';status.dataset.error='true';}finally{sending=false;submit.disabled=false;form.removeAttribute('aria-busy');}},300);
 });
}
function openThemePicker(){openModal('رنگ‌و‌حال بقچه','theme');const active=document.documentElement.dataset.theme||'olive';$('#modal-content').innerHTML=`<p class="info-text">پالت دلخواهت را انتخاب کن؛ این انتخاب فقط رنگ رابط سایت را عوض می‌کند.</p><div class="theme-options">${Object.entries(palettes).map(([id,name])=>`<button data-palette="${id}" class="theme-option" aria-pressed="${active===id}"><span class="palette-preview palette-${id}" aria-hidden="true"><i></i><i></i><i></i></span><strong>${name}</strong><span>${active===id?'✓ انتخاب‌شده':'انتخاب پالت'}</span></button>`).join('')}</div><p class="form-status" id="theme-status" role="status" aria-live="polite"></p>`;}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.dataset.reviewDelete&&selectedProduct){try{const list=getReviews(selectedProduct.id).filter(r=>r.date!==b.dataset.reviewDelete);localStorage.setItem('boghche-reviews-'+selectedProduct.id,JSON.stringify(list));renderReviews();}catch{toast('حذف از حافظهٔ مرورگر انجام نشد.');}}
 if(b.dataset.action==='theme')openThemePicker();
 if(b.dataset.palette&&Object.hasOwn(palettes,b.dataset.palette)){const id=b.dataset.palette;document.documentElement.dataset.theme=id;openThemePicker();try{localStorage.setItem('boghche-theme',id);$('#theme-status').textContent='پالت '+palettes[id]+' ذخیره شد.';}catch{$('#theme-status').textContent='پالت اعمال شد؛ ذخیره‌سازی مرورگر در دسترس نیست.';$('#theme-status').dataset.error='true';}}
 if(b.dataset.variant&&selectedProduct&&variantAvailable(selectedProduct,b.dataset.variant)){selectedColor=b.dataset.variant;productMain.querySelectorAll('[data-variant]').forEach(el=>{const selected=el.dataset.variant===selectedColor;el.setAttribute('aria-pressed',String(selected));el.querySelector('.variant-check').textContent=selected?'✓':'';});$('#selected-color-label').textContent='رنگ انتخاب‌شده: '+selectedColor;productMessage('');if(variantImages[selectedProduct.id]?.[selectedColor])updateGallery();}
 if(b.dataset.gallery!==undefined){activeGallery=Number(b.dataset.gallery);updateGallery();}
 if(b.id==='zoom-product'){openModal(selectedProduct.name+' · بزرگ‌نمایی','zoom');$('#modal-content').innerHTML=`<div class="zoom-controls"><button class="button outline" id="toggle-zoom" aria-pressed="false">بزرگ‌نمایی بیشتر +</button><p>برای جابه‌جایی نمای بزرگ، تصویر را پیمایش کن.</p></div><div class="zoom-viewport" tabindex="0" aria-label="تصویر بزرگ محصول، قابل پیمایش">${galleryPhoto(selectedProduct)}</div>`;}
 if(b.id==='toggle-zoom'){const zoomed=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(zoomed));b.textContent=zoomed?'نمای کامل −':'بزرگ‌نمایی بیشتر +';$('.zoom-viewport').classList.toggle('magnified',zoomed);}
 if(b.id==='product-favorite'){toggleFavorite(selectedProduct.id);b.setAttribute('aria-pressed',String(favorites.has(selectedProduct.id)));}
 if(b.id==='add-product'){
  const p=selectedProduct;if(!selectedColor){productMessage('لطفاً ابتدا رنگ محصول را انتخاب کن.');$('.variant-options button:not(:disabled)')?.focus();return;}
  const quantity=Number($('#product-quantity').value);if(addToCart(p.id,selectedColor,quantity))productMessage(`${fa(quantity)} عدد با رنگ ${selectedColor} به سبد خرید اضافه شد.`,false);
 }
});
function updateGallery(){const p=selectedProduct;$('#zoom-product').innerHTML=galleryPhoto(p)+`<span class="zoom-label">${icon('search')} بزرگ‌نمایی</span>`;productMain.querySelectorAll('[data-gallery]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.gallery)===activeGallery)));}
// Return to visible home sections before following their anchors. Capture runs before legacy handlers.
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.hasAttribute('data-product'))return;const href=a.getAttribute('href')||'';if(a.hasAttribute('data-home-category')){e.preventDefault();showHome();selectCategory(a.dataset.homeCategory);return;}if(a.hasAttribute('data-home')||['#','#catalog','#categories','#story','#main'].includes(href)){if(!productMain.hidden){e.preventDefault();const anchor=href.includes('#')?href.slice(href.indexOf('#')):'#';showHome();if(anchor!=='#')$(anchor)?.scrollIntoView({behavior:'smooth'});else window.scrollTo({top:0,behavior:'smooth'});}}},true);
window.addEventListener('popstate',syncProductRoute);
syncProductRoute();
