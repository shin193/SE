/* Product routes and reviews use the same-origin API. */
function normalizeProduct(product) {
  return {
    ...product,
    colors: product.variants.map(variant=>variant.name),
    hex: product.variants.map(variant=>variant.hex)
  };
}

function variantStock(product,color) {
  return product.variants.find(variant=>variant.name===color)?.stock ?? 0;
}

function variantAvailable(product,color) {
  return variantStock(product,color)>0;
}

let activeGallery=0, routeVersion=0, reviewVersion=0, loadingCatalog=false;
const homeMain=$('#main'), productMain=$('#product-page');

function productHref(id){return location.pathname+'?product='+encodeURIComponent(id);}

function showHome(push=true) {
  if(productMain.hidden)return;
  routeVersion++;
  if(modal.open)closeModal();
  productMain.hidden=true;
  homeMain.hidden=false;
  document.title='بقچه | با نخ، با عشق، برای زندگی';
  if(push)history.pushState({},'',location.pathname);
  selectedProduct=null;
}

async function navigateProduct(id,push=true,fromCard=false,message='') {
  const version=++routeVersion;
  const known=validProduct(id);
  if(modal.open)closeModal();
  closeNavigation();
  if(push)history.pushState({},'',productHref(id));
  homeMain.hidden=true;
  productMain.hidden=false;
  productMain.classList.toggle('card-arrival',fromCard);
  selectedProduct=null;
  selectedColor='';
  activeGallery=0;
  productMain.setAttribute('aria-busy','true');
  productMain.innerHTML=known
    ? '<div class="product-layout"><div class="gallery-main">'+photo(known.images[0])+'</div><div class="product-purchase"><h1>'+escapeHtml(known.name)+'</h1><p role="status">در حال دریافت جزئیات…</p></div></div>'
    : '<p class="form-status" role="status">در حال دریافت جزئیات محصول…</p>';
  productMain.focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
  try {
    const {product}=await AuthClient.get('/api/products/'+encodeURIComponent(id));
    if(version!==routeVersion)return;
    selectedProduct=normalizeProduct(product);
    const index=products.findIndex(item=>item.id===selectedProduct.id);
    if(index>=0)products[index]=selectedProduct;
    if(selectedProduct.colors.length===1 && variantAvailable(selectedProduct,selectedProduct.colors[0])) {
      selectedColor=selectedProduct.colors[0];
    }
    document.title=selectedProduct.name+' | بقچه';
    renderProductPage();
    if(message)productMessage(message);
  } catch(error) {
    if(version!==routeVersion)return;
    const missing=error.status===404||error.status===400;
    const heading=missing?'این دوخته پیدا نشد':'دریافت جزئیات محصول انجام نشد';
    document.title=heading+' | بقچه';
    productMain.innerHTML='<div class="empty-state"><h1>'+heading+'</h1><a class="button outline" href="index.html" data-home>بازگشت به فروشگاه</a>'+
      (missing?'':'<button type="button" class="button outline" id="retry-product">تلاش دوباره</button>')+'</div>';
    $('#retry-product')?.addEventListener('click',()=>navigateProduct(id,false));
  } finally {
    if(version===routeVersion)productMain.removeAttribute('aria-busy');
  }
}

function syncProductRoute() {
  if(!catalogReady)return;
  const params=new URLSearchParams(location.search);
  if(params.has('product')) {
    navigateProduct(params.get('product'),false);
  } else if(params.has('category')||location.hash==='#catalog') {
    const requested=Number(params.get('category')??-1);
    selectCategory(Object.hasOwn(categories,requested)?requested:-1,false);
  } else {
    showHome(false);
    category=-1;
    collection='featured';
    query='';
    renderCatalog();
  }
}

async function initializeCatalog() {
  if(loadingCatalog)return;
  loadingCatalog=true;
  $('#product-grid').innerHTML='<p class="form-status" role="status">در حال دریافت محصولات…</p>';
  try {
    const [categoryData,productData]=await Promise.all([
      AuthClient.get('/api/categories'),
      AuthClient.get('/api/products')
    ]);
    categoryRecords=categoryData.categories;
    categories=Object.fromEntries(categoryRecords.map(record=>[record.id,record.name]));
    products=productData.products.map(normalizeProduct);
    catalogReady=true;
    restoreShoppingState();
    renderCategories();
    updateCounts();
    syncProductRoute();
  } catch {
    const message=AuthClient.enabled?'دریافت کاتالوگ انجام نشد.':'برای نمایش کاتالوگ، فروشگاه را از طریق سرور اجرا کن.';
    $('#product-grid').innerHTML='<div class="empty-state"><p role="status">'+message+'</p><button type="button" class="button outline" id="retry-catalog">تلاش دوباره</button></div>';
    $('#category-menu').textContent=message;
    $('#retry-catalog').addEventListener('click',initializeCatalog);
  } finally {
    loadingCatalog=false;
  }
}

function productMessage(message,error=true) {
  const element=$('#product-message');
  if(!element){toast(message);return;}
  element.textContent=message;
  element.dataset.error=String(error);
}

function galleryItems(product) {
  const selected=product.variants.find(variant=>variant.name===selectedColor)?.image;
  const ordered=selected?[selected,...product.images.filter(image=>image.id!==selected.id)]:product.images;
  const items=ordered.map((image,index)=>({image,label:index===0?'نمای کامل':'تصویر '+fa(index+1),crop:false}));
  if(items.length===1 && items[0].image.atlasCell!==null) {
    items.push({image:items[0].image,label:'جزئیات بافت',crop:true});
  }
  return items;
}

function galleryPhoto(product,index=activeGallery) {
  const item=galleryItems(product)[index];
  return '<div class="gallery-picture'+(item?.crop?' detail-crop':'')+'">'+photo(item?.image)+'</div>';
}

function galleryThumbnails(product) {
  return galleryItems(product).map((item,index)=>
    '<button type="button" data-gallery="'+index+'" aria-pressed="'+(activeGallery===index)+'" aria-label="'+item.label+'">'+galleryPhoto(product,index)+'<span>'+item.label+'</span></button>'
  ).join('');
}

function variantStatus(product) {
  if(selectedColor)return 'موجودی رنگ '+selectedColor+'، '+fa(variantStock(product,selectedColor))+' عدد';
  return product.variants.some(variant=>variant.stock>0)?'موجود':'ناموجود';
}

function renderProductPage() {
  const product=selectedProduct;
  const name=escapeHtml(product.name);
  const categoryName=escapeHtml(categories[product.category]??'محصولات');
  const variants=product.variants.map(variant=>{
    const label=escapeHtml(variant.name);
    const selected=selectedColor===variant.name;
    const stock=variant.stock>0?fa(variant.stock)+' عدد':'ناموجود';
    return '<button type="button" class="variant-option" data-variant="'+label+'" aria-pressed="'+selected+'"'+
      (variant.stock>0?'':' disabled')+'><i style="--swatch:'+variant.hex+'" aria-hidden="true"></i><span>'+label+
      '</span><span class="variant-check" aria-hidden="true">'+(selected?'✓':'')+'</span><small>'+stock+'</small></button>';
  }).join('');
  productMain.innerHTML=
    '<nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="index.html" data-home>خانه</a><span>/</span><a href="'+catalogHref(product.category)+'" data-home-category="'+product.category+'">'+categoryName+'</a><span>/</span><span>'+name+'</span></nav>'+
    '<div class="product-layout"><section class="product-gallery" aria-label="گالری '+name+'"><button type="button" class="gallery-main" id="zoom-product" aria-label="بزرگ‌نمایی تصویر '+name+'">'+galleryPhoto(product)+'<span class="zoom-label">'+icon('search')+' بزرگ‌نمایی</span></button><div class="gallery-thumbnails" aria-label="انتخاب تصویر">'+galleryThumbnails(product)+'</div></section>'+
    '<section class="product-purchase" aria-labelledby="product-name"><span class="section-kicker">'+categoryName+'</span><h1 id="product-name">'+name+'</h1><a href="#reviews" class="review-anchor" id="rating-summary"></a><div class="purchase-price">'+money(product.price)+'</div><span class="stock-label" id="stock-label">'+escapeHtml(variantStatus(product))+'</span><p class="product-intro">'+escapeHtml(product.description)+'</p>'+
    '<fieldset class="variant-field"><legend>رنگ محصول</legend><div class="variant-options">'+variants+'</div><p id="selected-color-label">'+(selectedColor?'رنگ انتخاب‌شده: '+escapeHtml(selectedColor):'رنگ مورد نظر را انتخاب کن.')+'</p></fieldset>'+
    '<div class="purchase-actions"><label for="product-quantity">تعداد<input id="product-quantity" type="number" min="1" max="'+(selectedColor?Math.min(99,variantStock(product,selectedColor)):99)+'" step="1" value="1" inputmode="numeric"></label><button class="button primary" id="add-product" '+(product.variants.some(variant=>variant.stock>0)?'':'disabled')+'>'+icon('bag')+' افزودن به سبد خرید</button><button class="icon-button" id="product-favorite" aria-pressed="'+favorites.has(product.id)+'" aria-label="علاقه‌مندی '+name+'">'+icon('heart')+'</button></div><p id="product-message" class="form-status" role="status" aria-live="polite"></p>'+
    '<div class="product-specs"><h2>مشخصات محصول</h2><dl>'+[
      ['کاربرد',product.usage],['جنس پارچه',product.material],['ابعاد',product.dimensions],['روش نگهداری',product.care]
    ].map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+escapeHtml(value)+'</dd></div>').join('')+'</dl></div></section></div>'+
    '<section class="reviews-section" id="reviews" aria-labelledby="reviews-title"><div class="section-heading"><h2 id="reviews-title">دیدگاه‌ها</h2></div><div class="reviews-layout"><div><div id="review-stats" role="status">در حال دریافت دیدگاه‌ها…</div><div id="review-list"></div></div><div>'+
    '<p id="review-access" class="review-disclosure"><a class="subtle-link" href="auth.html?mode=login" target="_blank" rel="noopener">برای ثبت دیدگاه وارد حساب شو</a></p>'+
    '<form id="review-form" hidden><h3>دیدگاه تو</h3><p class="modal-note" id="review-account"></p><fieldset class="rating-field"><legend>امتیاز تو</legend><div class="star-input">'+
    [1,2,3,4,5].map(n=>'<label><input type="radio" name="rating" value="'+n+'" required><span aria-hidden="true">★</span><span class="sr-only">'+fa(n)+' ستاره</span></label>').join('')+
    '</div><span id="rating-label">از ۱ تا ۵ ستاره انتخاب کن</span></fieldset><label class="form-field">متن دیدگاه<textarea class="form-input" name="reviewText" required minlength="10" maxlength="1000" rows="4"></textarea></label><button class="button primary full" type="submit">ثبت دیدگاه</button><p id="review-status" class="form-status" role="status" aria-live="polite"></p></form></div></div></section>';
  syncReviewAccount();
  bindReviewForm(product.id);
  loadReviews(product.id);
}

function syncReviewAccount() {
  const form=$('#review-form');
  if(!form)return;
  const user=window.boghcheUser;
  form.hidden=!user;
  $('#review-access').hidden=!!user;
  $('#review-account').textContent=user?'به نام '+user.name:'';
}

function showRating(form,rating) {
  form.querySelector('#rating-label').textContent=rating?fa(rating)+' از ۵ ستاره':'از ۱ تا ۵ ستاره انتخاب کن';
  form.querySelectorAll('.star-input label').forEach((label,i)=>label.classList.toggle('filled',i<rating));
}

async function loadReviews(productId) {
  const list=$('#review-list'), version=++reviewVersion;
  if(!list)return;
  try {
    const {reviews}=await AuthClient.get('/api/products/'+productId+'/reviews');
    if(version!==reviewVersion||!list.isConnected)return;
    const average=reviews.length?reviews.reduce((total,review)=>total+review.rating,0)/reviews.length:0;
    const summary=reviews.length
      ? average.toLocaleString('fa-IR',{maximumFractionDigits:1})+' از ۵ · '+fa(reviews.length)+' دیدگاه'
      : 'هنوز دیدگاهی ثبت نشده است.';
    $('#rating-summary').textContent='★ '+summary;
    $('#review-stats').textContent=summary;
    list.innerHTML=reviews.map(review=>
      '<article class="review-item"><div><strong>'+escapeHtml(review.name)+'</strong><span class="review-stars" aria-label="'+fa(review.rating)+' از ۵ ستاره">'+
      '★'.repeat(review.rating)+'☆'.repeat(5-review.rating)+'</span></div><time datetime="'+escapeHtml(review.date)+'">'+
      new Date(review.date).toLocaleDateString('fa-IR')+'</time>'+(review.mine?'<button type="button" class="review-delete" data-review-delete="'+review.id+'">حذف دیدگاه</button>':'')+
      '<p>'+escapeHtml(review.text)+'</p></article>'
    ).join('');
    const form=$('#review-form');
    const mine=reviews.find(review=>review.mine);
    form.querySelector('[type="submit"]').textContent=mine?'به‌روزرسانی دیدگاه':'ثبت دیدگاه';
    if(!form.dataset.dirty) {
      form.elements.reviewText.value=mine?.text??'';
      form.querySelectorAll('[name="rating"]').forEach(input=>{input.checked=Number(input.value)===mine?.rating;});
      showRating(form,mine?.rating??0);
    }
  } catch {
    if(version!==reviewVersion||!list.isConnected)return;
    $('#review-stats').textContent='دریافت دیدگاه‌ها انجام نشد.';
    list.innerHTML='<button type="button" class="subtle-link" id="retry-reviews">تلاش دوباره</button>';
    $('#retry-reviews').addEventListener('click',()=>loadReviews(productId));
  }
}

function bindReviewForm(productId) {
  const form=$('#review-form');
  const status=form.querySelector('#review-status');
  const submit=form.querySelector('[type="submit"]');
  form.addEventListener('input',event=>{
    form.dataset.dirty='true';
    if(event.target.name==='rating')showRating(form,Number(event.target.value));
    if(!submit.disabled){status.textContent='';delete status.dataset.error;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(submit.disabled)return;
    const data=new FormData(form);
    const text=String(data.get('reviewText')??'').trim();
    const rating=Number(data.get('rating'));
    const length=[...text].length;
    if(length<10||length>1000||!Number.isInteger(rating)||rating<1||rating>5) {
      status.textContent='متن ۱۰ تا ۱۰۰۰ نویسه و امتیاز ۱ تا ۵ وارد کن.';
      status.dataset.error='true';
      return;
    }
    submit.disabled=true;
    form.setAttribute('aria-busy','true');
    delete status.dataset.error;
    status.textContent='در حال ثبت دیدگاه…';
    try {
      await AuthClient.write('/api/products/'+productId+'/reviews',{text,rating});
      if(!form.isConnected)return;
      delete form.dataset.dirty;
      status.textContent='دیدگاه ثبت شد.';
      await loadReviews(productId);
    } catch(error) {
      status.textContent=error.status===401?'برای ثبت دیدگاه دوباره وارد حساب شو.':'ثبت دیدگاه انجام نشد. دوباره تلاش کن.';
      status.dataset.error='true';
    } finally {
      submit.disabled=false;
      form.removeAttribute('aria-busy');
    }
  });
}

async function deleteReview(button,productId) {
  button.disabled=true;
  try {
    await AuthClient.write('/api/products/'+productId+'/reviews/'+button.dataset.reviewDelete,undefined,'DELETE');
    if(button.isConnected)await loadReviews(productId);
    toast('دیدگاه حذف شد.');
  } catch {
    toast('حذف دیدگاه انجام نشد.');
  } finally {button.disabled=false;}
}

window.addEventListener('boghche-session',()=>{
  syncReviewAccount();
  if(selectedProduct)loadReviews(selectedProduct.id);
});

function openThemePicker(){openModal('رنگ‌و‌حال بقچه','theme');const active=document.documentElement.dataset.theme||'olive';$('#modal-content').innerHTML=`<p class="info-text">پالت دلخواهت را انتخاب کن؛ این انتخاب فقط رنگ رابط سایت را عوض می‌کند.</p><div class="theme-options">${Object.entries(palettes).map(([id,name])=>`<button data-palette="${id}" class="theme-option" aria-pressed="${active===id}"><span class="palette-preview palette-${id}" aria-hidden="true"><i></i><i></i><i></i></span><strong>${name}</strong><span>${active===id?'✓ انتخاب‌شده':'انتخاب پالت'}</span></button>`).join('')}</div><p class="form-status" id="theme-status" role="status" aria-live="polite"></p>`;}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.dataset.reviewDelete&&selectedProduct)deleteReview(b,selectedProduct.id);
 if(b.dataset.action==='theme')openThemePicker();
 if(b.dataset.palette&&Object.hasOwn(palettes,b.dataset.palette)){const id=b.dataset.palette;document.documentElement.dataset.theme=id;openThemePicker();try{localStorage.setItem('boghche-theme',id);$('#theme-status').textContent='پالت '+palettes[id]+' ذخیره شد.';}catch{$('#theme-status').textContent='پالت اعمال شد؛ ذخیره‌سازی مرورگر در دسترس نیست.';$('#theme-status').dataset.error='true';}}
 if(b.dataset.variant&&selectedProduct&&variantAvailable(selectedProduct,b.dataset.variant)){
  selectedColor=b.dataset.variant;
  productMain.querySelectorAll('[data-variant]').forEach(element=>{
   const selected=element.dataset.variant===selectedColor;
   element.setAttribute('aria-pressed',String(selected));
   element.querySelector('.variant-check').textContent=selected?'✓':'';
  });
  const quantity=$('#product-quantity');
  const maximum=Math.min(99,variantStock(selectedProduct,selectedColor));
  quantity.max=maximum;
  if(Number(quantity.value)>maximum)quantity.value=maximum;
  $('#selected-color-label').textContent='رنگ انتخاب‌شده: '+selectedColor;
  $('#stock-label').textContent=variantStatus(selectedProduct);
  productMessage('');
  activeGallery=0;
  $('.gallery-thumbnails').innerHTML=galleryThumbnails(selectedProduct);
  updateGallery();
 }
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
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.hasAttribute('data-product')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const href=a.getAttribute('href')||'';if(a.hasAttribute('data-home-category')){e.preventDefault();selectCategory(a.dataset.homeCategory);return;}if(a.hasAttribute('data-home')||['#','#catalog','#categories','#story','#main'].includes(href)){if(!productMain.hidden){e.preventDefault();const anchor=href.includes('#')?href.slice(href.indexOf('#')):'#';showHome();if(anchor!=='#')$(anchor)?.scrollIntoView({behavior:'smooth'});else window.scrollTo({top:0,behavior:'smooth'});}}},true);
window.addEventListener('popstate',syncProductRoute);
initializeCatalog();
