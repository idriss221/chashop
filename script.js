// ===========================
// CHACHA — Boutique
// ===========================

let allProducts = [];
let allOrders = [];
let productsLoaded = false;
let cart = [];
let currentCategoryFilter = 'all';
let currentPriceSort = 'default';

let pdCurrentProduct = null;
let pdSelectedSize = null;
let pdSelectedColor = null;
let pdQty = 1;

// ===========================
// Skeleton helpers
// ===========================
function skeletonCardHTML(){
  return `
  <div class="skeleton-card">
    <div class="skeleton-img skeleton"></div>
    <div class="skeleton-line skeleton w40" style="margin-top:14px;"></div>
    <div class="skeleton-line skeleton w80"></div>
    <div class="skeleton-line skeleton w60"></div>
    <div class="skeleton-btn skeleton"></div>
  </div>`;
}
function renderSkeletonGrid(containerId, count){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = Array.from({length: count}).map(skeletonCardHTML).join('');
}
function renderSkeletonChips(containerId, count){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = Array.from({length: count}).map(()=> `<div class="skeleton-chip skeleton"></div>`).join('');
}
function renderSkeletonUniverse(containerId, count){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = Array.from({length: count}).map(()=> `<div class="universe-skeleton skeleton"></div>`).join('');
}
['newArrivals','shoesGrid','clothesGrid','promoGrid'].forEach(id => renderSkeletonGrid(id, id === 'newArrivals' ? 4 : 6));
renderSkeletonChips('categoryChipRow', 6);
renderSkeletonUniverse('universeGrid', 8);

// ===========================
// Rendu des cartes produit
// ===========================
function priceHTML(p){
  if(p.old){
    return `<span class="product-price"><span class="old">${formatFCFA(p.old)}</span>${formatFCFA(p.price)}</span>`;
  }
  return `<span class="product-price">${formatFCFA(p.price)}</span>`;
}
function cardHTML(p){
  return `
  <article class="product-card" data-id="${p.id}">
    <div class="product-img-wrap">
      ${p.badge ? `<span class="product-badge ${badgeClass(p.badge)}">${p.badge}</span>` : ''}
      <img src="${p.img}" alt="${p.name}" loading="lazy" draggable="false">
      <span class="product-zoom-hint"><i class="fa-solid fa-eye"></i></span>
    </div>
    <div class="product-info">
      <span class="product-cat">${p.cat}</span>
      <h3 class="product-name">${p.name}</h3>
      ${priceHTML(p)}
      <button class="add-cart-btn" data-add="${p.id}"><i class="fa-solid fa-bag-shopping"></i> Ajouter au panier</button>
    </div>
  </article>`;
}
function renderGrid(containerId, items){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = items.length
    ? items.map(cardHTML).join('')
    : `<p class="admin-empty">Aucun produit dans cette catégorie pour le moment.</p>`;
  el.classList.add('fade-in-content');
  initCardAnimations(el);
}

function currentCategoryList(){
  const cats = [...new Set(allProducts.map(p => p.cat))];
  return cats;
}
function sortByPrice(items){
  if(currentPriceSort === 'asc') return [...items].sort((a,b) => a.price - b.price);
  if(currentPriceSort === 'desc') return [...items].sort((a,b) => b.price - a.price);
  return items;
}
function renderCategoryChips(){
  const el = document.getElementById('categoryChipRow');
  if(!el) return;
  const cats = currentCategoryList();
  el.innerHTML = `<button type="button" class="category-chip ${currentCategoryFilter==='all'?'active':''}" data-cat="all">Toutes</button>` +
    cats.map(c => `<button type="button" class="category-chip ${currentCategoryFilter===c?'active':''}" data-cat="${c}">${c}</button>`).join('');
}

// Détermine à quel(s) rayon(s) (chaussures / vêtements) appartient une catégorie donnée
function typesForCategory(cat){
  if(cat === 'all') return null; // null = pas de filtre, tout est visible
  const types = new Set(allProducts.filter(p => p.cat === cat).map(p => p.type));
  return types;
}

// N'affiche que le(s) rayon(s) correspondant à la catégorie choisie ; masque
// complètement les autres (titre + grille) tant qu'un filtre est actif.
function applySectionVisibility(){
  const chaussuresSection = document.getElementById('chaussures');
  const vetementsSection = document.getElementById('vetements');
  const types = typesForCategory(currentCategoryFilter);

  if(!types){
    chaussuresSection.hidden = false;
    vetementsSection.hidden = false;
    return;
  }
  chaussuresSection.hidden = !types.has('shoe');
  vetementsSection.hidden = !types.has('cloth');
}

// Applique un filtre de catégorie (utilisé par les chips ET par les cartes
// "univers") puis fait défiler vers le rayon correspondant.
function applyCategoryFilter(cat, scroll){
  currentCategoryFilter = cat;
  renderCategoryChips();
  const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.cat === cat);
  renderGrid('shoesGrid', sortByPrice(filtered.filter(p => p.type === 'shoe')));
  renderGrid('clothesGrid', sortByPrice(filtered.filter(p => p.type === 'cloth')));
  applySectionVisibility();

  if(scroll === false) return;
  const target = cat === 'all'
    ? document.getElementById('chaussures')
    : (document.getElementById('chaussures').hidden ? document.getElementById('vetements') : document.getElementById('chaussures'));
  target.scrollIntoView({ behavior:'smooth' });
}

document.getElementById('categoryChipRow').addEventListener('click', (e)=>{
  const chip = e.target.closest('.category-chip');
  if(!chip) return;
  applyCategoryFilter(chip.dataset.cat);
});

// ===========================
// Grille "Univers" (catégories façon Jumia : type × public + Nouveautés/Promotions)
// Un tap ouvre directement l'album de la catégorie, sans avoir à scroller la page.
// ===========================
const AUDIENCE_ORDER = ['homme', 'femme', 'enfant', 'unisexe'];

function productAudience(p){ return p.audience || 'unisexe'; }

function categoryTileData(){
  const tiles = [];
  [['shoe','Chaussures','fa-shoe-prints'], ['cloth','Vêtements','fa-shirt']].forEach(([type, typeLabel, icon]) => {
    AUDIENCE_ORDER.forEach(aud => {
      const items = allProducts.filter(p => p.type === type && productAudience(p) === aud);
      const cover = items.find(p => p.badge) || items[0];
      tiles.push({
        type, audience: aud, special: null,
        label: `${typeLabel} ${audiencePlural(aud)}`,
        count: items.length,
        img: cover ? cover.img : '',
        icon
      });
    });
  });
  const nouveautes = allProducts.filter(p => p.badge === 'NOUVEAU');
  if(nouveautes.length){
    tiles.push({ type:null, audience:null, special:'nouveau', label:'Nouveautés', count: nouveautes.length, img: nouveautes[0].img, icon:'fa-sparkles' });
  }
  const promos = allProducts.filter(p => p.badge === 'PROMO');
  if(promos.length){
    tiles.push({ type:null, audience:null, special:'promo', label:'Promotions', count: promos.length, img: promos[0].img, icon:'fa-tags' });
  }
  return tiles;
}
function universeCardHTML(c){
  const media = c.img
    ? `<img src="${c.img}" alt="${c.label}" loading="lazy">`
    : `<i class="fa-solid ${c.icon} universe-card-icon"></i>`;
  return `
  <button type="button" class="universe-card" data-type="${c.type || ''}" data-audience="${c.audience || ''}" data-special="${c.special || ''}" data-label="${c.label}">
    <span class="universe-card-media">${media}</span>
    <span class="universe-card-name">${c.label}</span>
    <span class="universe-card-count">${c.count} pièce${c.count > 1 ? 's' : ''}</span>
  </button>`;
}
function renderUniverseGrid(){
  const el = document.getElementById('universeGrid');
  if(!el) return;
  const data = categoryTileData();
  el.innerHTML = data.length
    ? data.map(universeCardHTML).join('')
    : `<p class="admin-empty">Aucune catégorie disponible pour le moment.</p>`;
}

// Filtre les produits correspondant à une tuile de catégorie (type+public, ou spécial)
function productsForTile(tile){
  if(tile.special === 'nouveau') return allProducts.filter(p => p.badge === 'NOUVEAU');
  if(tile.special === 'promo') return allProducts.filter(p => p.badge === 'PROMO');
  return allProducts.filter(p => p.type === tile.type && productAudience(p) === tile.audience);
}

// Ouvre l'album (page dédiée) de la catégorie : pas de scroll, redirection immédiate.
// Utilise l'historique du navigateur : le bouton retour (natif, téléphone ou navigateur)
// referme l'album, comme n'importe quelle page web — pas de bouton "Retour" custom.
const categoryOverlay = document.getElementById('categoryOverlay');
function slugify(str){
  return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function renderCategoryAlbum(tile){
  const items = sortByPrice(productsForTile(tile));
  document.getElementById('categoryPageTitle').textContent = tile.label;
  document.getElementById('categoryPageCount').textContent = `${items.length} pièce${items.length > 1 ? 's' : ''}`;
  const grid = document.getElementById('categoryPageGrid');
  grid.innerHTML = items.length
    ? items.map(cardHTML).join('')
    : `<p class="admin-empty">Aucun produit dans cette catégorie pour le moment.</p>`;
  initCardAnimations(grid);
}
function openCategoryAlbum(tile, pushHistory){
  renderCategoryAlbum(tile);
  categoryOverlay.classList.add('open');
  categoryOverlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  mainNav.classList.remove('open');
  if(pushHistory !== false){
    history.pushState({ chachaCategory: tile }, '', '#categorie/' + slugify(tile.special || (tile.type + '-' + tile.audience)));
  }
}
function closeCategoryAlbum(fromPopState){
  categoryOverlay.classList.remove('open');
  document.body.style.overflow = '';
  if(!fromPopState && location.hash.startsWith('#categorie/')) history.back();
}
document.getElementById('universeGrid').addEventListener('click', (e)=>{
  const card = e.target.closest('.universe-card');
  if(!card) return;
  openCategoryAlbum({
    type: card.dataset.type || null,
    audience: card.dataset.audience || null,
    special: card.dataset.special || null,
    label: card.dataset.label
  });
});
document.getElementById('categoryCloseBtn').addEventListener('click', ()=> closeCategoryAlbum(false));
categoryOverlay.addEventListener('click', (e)=>{
  const cardEl = e.target.closest('.product-card');
  if(cardEl){ openProductDetail(cardEl.dataset.id); return; }
});
// Bouton retour du navigateur / geste retour du téléphone : referme l'album s'il est ouvert.
window.addEventListener('popstate', (e)=>{
  if(e.state && e.state.chachaCategory){
    openCategoryAlbum(e.state.chachaCategory, false);
  } else if(categoryOverlay.classList.contains('open')){
    categoryOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && categoryOverlay.classList.contains('open')) closeCategoryAlbum(false);
});

// ===========================
// Articles récemment vus (mémorisés sur cet appareil)
// ===========================
const RECENTLY_VIEWED_KEY = 'chacha_recently_viewed';
const RECENTLY_VIEWED_MAX = 10;

function getRecentlyViewedIds(){
  try{
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  }catch(e){ return []; }
}
function addToRecentlyViewed(id){
  try{
    let ids = getRecentlyViewedIds().filter(x => x !== id);
    ids.unshift(id);
    ids = ids.slice(0, RECENTLY_VIEWED_MAX);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  }catch(e){ /* stockage indisponible, on ignore silencieusement */ }
  renderRecentlyViewed();
}
function renderRecentlyViewed(){
  const section = document.getElementById('recemmentVus');
  const grid = document.getElementById('recentlyViewedGrid');
  if(!section || !grid) return;
  const ids = getRecentlyViewedIds();
  const items = ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
  if(!items.length){
    section.hidden = true;
    return;
  }
  section.hidden = false;
  grid.innerHTML = items.map(cardHTML).join('');
  initCardAnimations(grid);
}

function renderAllGrids(){
  const newArrivals = allProducts.filter(p => p.badge === 'NOUVEAU').concat(
    allProducts.filter(p => p.badge !== 'NOUVEAU')
  ).slice(0, 4);

  const filtered = currentCategoryFilter === 'all' ? allProducts : allProducts.filter(p => p.cat === currentCategoryFilter);

  renderGrid('newArrivals', newArrivals);
  renderGrid('shoesGrid', sortByPrice(filtered.filter(p => p.type === 'shoe')));
  renderGrid('clothesGrid', sortByPrice(filtered.filter(p => p.type === 'cloth')));
  renderGrid('promoGrid', sortByPrice(allProducts.filter(p => p.badge === 'PROMO')));
  renderCategoryChips();
  renderUniverseGrid();
  renderRecentlyViewed();
  applySectionVisibility();
}

// ===========================
// Filtrer par prix
// ===========================
const sortDropdown = document.querySelector('.sort-dropdown');
const sortBtn = document.getElementById('priceSortBtn');
const sortMenu = document.getElementById('priceSortMenu');
const sortLabel = document.getElementById('priceSortLabel');
const sortLabels = { default:'Filtrer par prix', asc:'Prix croissant', desc:'Prix décroissant' };

sortBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  sortDropdown.classList.toggle('open');
});
sortMenu.addEventListener('click', (e)=>{
  const opt = e.target.closest('.sort-option');
  if(!opt) return;
  currentPriceSort = opt.dataset.sort;
  sortLabel.textContent = sortLabels[currentPriceSort];
  sortBtn.classList.toggle('active', currentPriceSort !== 'default');
  sortMenu.querySelectorAll('.sort-option').forEach(o => o.classList.toggle('active', o.dataset.sort === currentPriceSort));
  sortDropdown.classList.remove('open');
  renderAllGrids();
});
document.addEventListener('click', (e)=>{
  if(!sortDropdown.contains(e.target)) sortDropdown.classList.remove('open');
});

function initCardAnimations(scopeEl){
  const cards = (scopeEl || document).querySelectorAll('.product-card');
  const cardObserver = new IntersectionObserver((entries)=>{
    entries.forEach((entry, i)=>{
      if(entry.isIntersecting){
        entry.target.style.transition = `opacity .5s var(--ease) ${i*0.04}s, transform .5s var(--ease) ${i*0.04}s`;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.1 });
  cards.forEach(card =>{
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    cardObserver.observe(card);
  });
}

// ===========================
// Panier
// ===========================
function getCartDetails(){
  return cart.map(item => {
    const product = allProducts.find(p => p.id === item.id);
    if(!product) return null;
    return { ...product, qty: item.qty, size: item.size, color: item.color, lineTotal: product.price * item.qty };
  }).filter(Boolean);
}
function getCartTotal(){ return getCartDetails().reduce((sum, item) => sum + item.lineTotal, 0); }
function getCartCount(){ return cart.reduce((sum, item) => sum + item.qty, 0); }

function cartKey(id, size, color){ return [id, size||'', color||''].join('__'); }

function addToCart(id, qty, size, color){
  qty = qty || 1; size = size || null; color = color || null;
  const key = cartKey(id, size, color);
  const existing = cart.find(item => cartKey(item.id, item.size, item.color) === key);
  if(existing){ existing.qty += qty; } else { cart.push({ id, qty, size, color }); }
  renderCart();
  const product = allProducts.find(p => p.id === id);
  if(product){ showToast(`${product.name} ajouté au panier`); }
  pulseCartIcon();
}
function changeQty(id, size, color, delta){
  const key = cartKey(id, size, color);
  const item = cart.find(i => cartKey(i.id, i.size, i.color) === key);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ cart = cart.filter(i => cartKey(i.id, i.size, i.color) !== key); }
  renderCart();
}
function removeFromCart(id, size, color){
  const key = cartKey(id, size, color);
  cart = cart.filter(i => cartKey(i.id, i.size, i.color) !== key);
  renderCart();
}
function pulseCartIcon(){
  const el = document.getElementById('cartCount');
  el.style.transform = 'scale(1.4)';
  setTimeout(()=> el.style.transform = 'scale(1)', 200);
}

function renderCart(){
  const items = getCartDetails();
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartFooterEl = document.getElementById('cartFooter');
  const cartCountEl = document.getElementById('cartCount');
  cartCountEl.textContent = getCartCount();

  if(items.length === 0){
    cartItemsEl.style.display = 'none';
    cartEmptyEl.style.display = 'flex';
    cartFooterEl.style.display = 'none';
    return;
  }
  cartItemsEl.style.display = 'flex';
  cartEmptyEl.style.display = 'none';
  cartFooterEl.style.display = 'block';

  cartItemsEl.innerHTML = items.map(item => {
    const metaParts = [];
    if(item.size) metaParts.push(`Taille ${item.size}`);
    if(item.color) metaParts.push(`Couleur`);
    return `
    <div class="cart-item" data-id="${item.id}" data-size="${item.size||''}" data-color="${item.color||''}">
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${metaParts.length ? `<div class="cart-item-meta">${metaParts.join(' · ')}</div>` : ''}
        <div class="cart-item-price">${formatFCFA(item.lineTotal)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-qty-down><i class="fa-solid fa-minus"></i></button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-qty-up><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
      <button class="cart-item-remove" data-remove><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }).join('');

  document.getElementById('cartTotal').textContent = formatFCFA(getCartTotal());
}

document.getElementById('cartItems').addEventListener('click', (e)=>{
  const row = e.target.closest('.cart-item');
  if(!row) return;
  const id = row.dataset.id, size = row.dataset.size || null, color = row.dataset.color || null;
  if(e.target.closest('[data-qty-up]')) changeQty(id, size, color, 1);
  if(e.target.closest('[data-qty-down]')) changeQty(id, size, color, -1);
  if(e.target.closest('[data-remove]')) removeFromCart(id, size, color);
});

document.body.addEventListener('click', (e)=>{
  const addBtn = e.target.closest('[data-add]');
  if(addBtn){ e.stopPropagation(); addToCart(addBtn.dataset.add); return; }

  const card = e.target.closest('.product-card');
  if(card){ openProductDetail(card.dataset.id); return; }
});

// ===========================
// Toast
// ===========================
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove('show'), 2400);
}

// ===========================
// Navbar mobile + recherche
// ===========================
const mainNav = document.getElementById('mainNav');
const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', ()=>{
  const isOpen = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  navToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
});
document.getElementById('navHomeBtn').addEventListener('click', (e)=>{ e.preventDefault(); mainNav.classList.remove('open'); window.scrollTo({top:0, behavior:'smooth'}); });

const searchPanel = document.getElementById('searchPanel');
const searchInput = document.getElementById('searchInput');
function openSearch(){
  searchPanel.classList.add('open');
  mainNav.classList.remove('open');
  setTimeout(()=> searchInput.focus(), 200);
  renderSearchResults('');
}
function closeSearch(){ searchPanel.classList.remove('open'); searchInput.value=''; }
document.getElementById('navSearchBtn').addEventListener('click', (e)=>{ e.preventDefault(); openSearch(); });
document.getElementById('closeSearch').addEventListener('click', closeSearch);
searchInput.addEventListener('input', ()=> renderSearchResults(searchInput.value));

function renderSearchResults(query){
  const el = document.getElementById('searchResults');
  const q = query.trim().toLowerCase();
  if(!productsLoaded){
    el.innerHTML = Array.from({length:4}).map(skeletonCardHTML).join('');
    return;
  }
  if(!q){
    el.innerHTML = `<p class="search-empty-hint">Tape un nom de produit, une catégorie ou un type pour commencer.</p>`;
    return;
  }
  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || (p.type === 'shoe' ? 'chaussure' : 'vêtement').includes(q)
  );
  el.innerHTML = results.length
    ? results.map(cardHTML).join('')
    : `<p class="search-empty-hint">Aucun résultat pour « ${query} ».</p>`;
}

// ===========================
// Drawer panier
// ===========================
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');
function openCart(){ cartDrawer.classList.add('open'); overlay.classList.add('show'); }
function closeCartDrawer(){ cartDrawer.classList.remove('open'); overlay.classList.remove('show'); }
document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCartDrawer);
overlay.addEventListener('click', ()=>{ closeCartDrawer(); closeCheckout(); });
document.getElementById('emptyShopBtn').addEventListener('click', closeCartDrawer);

// ===========================
// TUNNEL DE COMMANDE
// ===========================
const checkoutOverlay = document.getElementById('checkoutOverlay');
const dpFill = document.getElementById('dpFill');
const dpStations = document.querySelectorAll('.dp-station');
let currentStep = 1;
let orderAddress = {};

function setStep(step){
  currentStep = step;
  document.querySelectorAll('.checkout-step').forEach(el => el.hidden = true);
  document.getElementById('step' + step).hidden = false;
  const progressPercent = { 1: 8, 2: 50, 3: 100 }[step];
  dpFill.style.width = progressPercent + '%';
  dpStations.forEach(station => {
    const s = parseInt(station.dataset.step, 10);
    station.classList.remove('active','done');
    if(s < step) station.classList.add('done');
    if(s === step) station.classList.add('active');
  });
}
function openCheckout(){
  if(getCartCount() === 0){
    showToast('Ton panier est vide — ajoute un article avant de commander');
    return;
  }
  renderCheckoutSummary();
  setStep(1);
  checkoutOverlay.classList.add('open');
  closeCartDrawer();
}
function closeCheckout(){ checkoutOverlay.classList.remove('open'); }
function renderCheckoutSummary(){
  const items = getCartDetails();
  document.getElementById('checkoutSummary').innerHTML = items.map(item => `
    <div class="summary-line">
      <span>${item.name}${item.size ? ' · '+item.size : ''} <span class="s-qty">×${item.qty}</span></span>
      <span>${formatFCFA(item.lineTotal)}</span>
    </div>`).join('');
  document.getElementById('checkoutTotal').textContent = formatFCFA(getCartTotal());
}
document.getElementById('goToCheckout').addEventListener('click', openCheckout);
document.getElementById('closeCheckout').addEventListener('click', closeCheckout);
document.getElementById('toStep2').addEventListener('click', ()=> setStep(2));
document.getElementById('backToStep1').addEventListener('click', ()=> setStep(1));

document.getElementById('addressForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  orderAddress = {
    fullName: document.getElementById('fullName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    city: document.getElementById('city').value.trim(),
    neighborhood: document.getElementById('neighborhood').value.trim(),
    addressDetails: document.getElementById('addressDetails').value.trim(),
    addressNote: document.getElementById('addressNote').value.trim()
  };
  const items = getCartDetails();
  const total = getCartTotal();
  const order = {
    id: genOrderId(),
    items: items.map(i => ({ id:i.id, name:i.name, price:i.price, qty:i.qty, lineTotal:i.lineTotal, img:i.img, size:i.size||null, color:i.color||null })),
    total,
    fullName: orderAddress.fullName,
    phone: orderAddress.phone,
    city: orderAddress.city,
    neighborhood: orderAddress.neighborhood,
    addressDetails: orderAddress.addressDetails,
    addressNote: orderAddress.addressNote,
    status: 'nouvelle',
    createdAt: new Date().toISOString()
  };

  const submitBtn = document.getElementById('addressForm').querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';

  saveOrderRemote(order).then(()=>{
    document.getElementById('confirmName').textContent = order.fullName;
    document.getElementById('confirmOrderId').textContent = '#' + order.id;
    document.getElementById('confirmRecap').innerHTML = `
      <div><i class="fa-solid fa-box"></i> <strong>${items.reduce((s,i)=>s+i.qty,0)} article(s)</strong> — ${formatFCFA(total)}</div>
      <div><i class="fa-solid fa-location-dot"></i> ${order.neighborhood}, ${order.city}</div>
      <div><i class="fa-solid fa-phone"></i> ${order.phone}</div>
      <div><i class="fa-solid fa-tag"></i> Numéro de suivi : <strong>${order.id}</strong></div>
    `;

    const lines = [
      `Nouvelle commande CHACHA #${order.id}`,
      ``,
      `Client : ${order.fullName}`,
      `Téléphone : ${order.phone}`,
      `Adresse : ${order.addressDetails}, ${order.neighborhood}, ${order.city}`,
      order.addressNote ? `Note : ${order.addressNote}` : null,
      ``,
      `Articles :`,
      ...items.map(i => `- ${i.name}${i.size ? ' ('+i.size+')' : ''} x${i.qty} — ${formatFCFA(i.lineTotal)}`),
      ``,
      `Total : ${formatFCFA(total)}`,
      `Merci de me contacter pour finaliser le paiement.`
    ].filter(Boolean);
    const whatsappMessage = encodeURIComponent(lines.join('\n'));
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;
    document.getElementById('sendWhatsappBtn').onclick = ()=> window.open(whatsappURL, '_blank');

    setStep(3);
    document.getElementById('addressForm').reset();
    cart = [];
    renderCart();
  }).catch(()=>{
    showToast("Impossible d'enregistrer ta commande — vérifie ta connexion internet et réessaie");
  }).finally(()=>{
    submitBtn.disabled = false;
    submitBtn.textContent = 'Valider ma commande';
  });
});
document.getElementById('closeConfirm').addEventListener('click', closeCheckout);

// ===========================
// SUIVI DE COMMANDE (client)
// ===========================
const trackOverlay = document.getElementById('trackOverlay');
function openTrack(){
  document.getElementById('trackError').style.display = 'none';
  document.getElementById('trackResult').style.display = 'none';
  document.getElementById('trackResult').innerHTML = '';
  document.getElementById('trackForm').reset();
  trackOverlay.classList.add('open');
  mainNav.classList.remove('open');
}
function closeTrack(){ trackOverlay.classList.remove('open'); }
document.getElementById('navTrackBtn').addEventListener('click', (e)=>{ e.preventDefault(); openTrack(); });
document.getElementById('footerTrackLink').addEventListener('click', (e)=>{ e.preventDefault(); openTrack(); });
document.getElementById('closeTrack').addEventListener('click', closeTrack);

function findOrder(orderId, phone){
  const idNorm = String(orderId || '').trim().toUpperCase();
  const phoneNorm = normalizePhone(phone);
  return allOrders.find(o => o.id.toUpperCase() === idNorm && normalizePhone(o.phone) === phoneNorm) || null;
}
document.getElementById('trackForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const orderId = document.getElementById('trackOrderId').value.trim();
  const phone = document.getElementById('trackPhone').value.trim();
  const order = findOrder(orderId, phone);
  const errorEl = document.getElementById('trackError');
  const resultEl = document.getElementById('trackResult');
  if(!order){
    errorEl.style.display = 'block';
    resultEl.style.display = 'none';
    resultEl.innerHTML = '';
    return;
  }
  errorEl.style.display = 'none';
  resultEl.style.display = 'block';
  resultEl.innerHTML = trackResultHTML(order);
});

function trackResultHTML(order){
  const meta = getStatusMeta(order.status);
  let timelineHTML = '';
  if(order.status === 'annulee'){
    timelineHTML = `<div class="track-timeline"><div class="track-timeline-item cancelled"><span class="track-timeline-dot"><i class="fa-solid fa-xmark"></i></span><span class="track-timeline-label">Commande annulée</span></div></div>`;
  } else {
    const currentIdx = TIMELINE_STEPS.indexOf(order.status);
    timelineHTML = `<div class="track-timeline">` + TIMELINE_STEPS.map((key, i)=>{
      const stepMeta = getStatusMeta(key);
      let cls = '', icon = '';
      if(i < currentIdx){ cls = 'done'; icon = '<i class="fa-solid fa-check"></i>'; }
      else if(i === currentIdx){ cls = 'current'; icon = '<i class="fa-solid fa-circle-dot"></i>'; }
      return `<div class="track-timeline-item ${cls}"><span class="track-timeline-dot">${icon}</span><span class="track-timeline-label">${stepMeta.label}</span></div>`;
    }).join('') + `</div>`;
  }
  return `
    <div class="track-result-head"><strong>Commande #${order.id}</strong><span class="track-result-date">${formatDate(order.createdAt)}</span></div>
    <span class="track-status-badge" style="background:${meta.color}22;color:${meta.color};"><i class="fa-solid fa-circle"></i> ${meta.label}</span>
    ${timelineHTML}
    <div class="track-recap">
      <div><i class="fa-solid fa-box"></i> ${order.items.reduce((s,i)=>s+i.qty,0)} article(s) — ${formatFCFA(order.total)}</div>
      <div><i class="fa-solid fa-location-dot"></i> ${order.neighborhood}, ${order.city}</div>
    </div>`;
}

// ===========================
// PAGE DÉTAIL PRODUIT
// ===========================
const productOverlay = document.getElementById('productOverlay');

function openProductDetail(id){
  const product = allProducts.find(p => p.id === id);
  if(!product) return;
  pdCurrentProduct = product;
  pdQty = 1;
  document.getElementById('pdQty').textContent = '1';
  addToRecentlyViewed(id);

  const images = getProductImages(product);
  document.getElementById('pdMainImg').src = images[0];
  document.getElementById('pdMainImg').alt = product.name;

  const thumbsEl = document.getElementById('pdThumbs');
  thumbsEl.innerHTML = images.map((img, i) => `<div class="pd-thumb ${i===0?'active':''}" data-img="${img}"><img src="${img}" alt="Miniature ${i+1}"></div>`).join('');

  document.getElementById('pdCat').textContent = product.cat;
  document.getElementById('pdName').textContent = product.name;
  document.getElementById('pdPrice').textContent = formatFCFA(product.price);
  const disc = discountPercent(product);
  if(product.old){
    document.getElementById('pdOldPrice').textContent = formatFCFA(product.old);
    document.getElementById('pdOldPrice').style.display = 'inline';
  } else {
    document.getElementById('pdOldPrice').style.display = 'none';
  }
  const discEl = document.getElementById('pdDiscount');
  if(disc > 0){ discEl.textContent = `-${disc}%`; discEl.style.display = 'inline-block'; } else { discEl.style.display = 'none'; }

  const availEl = document.getElementById('pdAvailability');
  const inStock = product.inStock !== false;
  availEl.classList.toggle('out', !inStock);
  availEl.innerHTML = inStock ? `<i class="fa-solid fa-circle-check"></i> En stock` : `<i class="fa-solid fa-circle-xmark"></i> Rupture de stock`;

  document.getElementById('pdDesc').textContent = product.desc || `${product.name} — ${product.cat}, une pièce CHACHA pensée pour durer.`;

  // Tailles
  const sizes = getSizesForProduct(product);
  const sizeBlock = document.getElementById('pdSizeBlock');
  pdSelectedSize = null;
  if(sizes){
    sizeBlock.style.display = 'block';
    pdSelectedSize = sizes[0];
    document.getElementById('pdSizes').innerHTML = sizes.map((s,i) => `<button type="button" class="pd-size-btn ${i===0?'active':''}" data-size="${s}">${s}</button>`).join('');
  } else {
    sizeBlock.style.display = 'none';
  }

  // Couleurs
  const colorBlock = document.getElementById('pdColorBlock');
  pdSelectedColor = null;
  if(product.colors && product.colors.length){
    colorBlock.style.display = 'block';
    pdSelectedColor = product.colors[0];
    document.getElementById('pdColors').innerHTML = product.colors.map((c,i) => `<span class="pd-color-swatch ${i===0?'active':''}" data-color="${c}" style="background:${c}"></span>`).join('');
  } else {
    colorBlock.style.display = 'none';
  }

  // Produits similaires
  const similar = getSimilarProducts(product, allProducts, 4);
  renderGrid('pdSimilarGrid', similar);

  productOverlay.classList.add('open');
  productOverlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}
function closeProductDetail(){
  productOverlay.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('closeProductDetail').addEventListener('click', closeProductDetail);
productOverlay.addEventListener('click', (e)=>{ if(e.target === productOverlay) closeProductDetail(); });

document.getElementById('pdThumbs').addEventListener('click', (e)=>{
  const thumb = e.target.closest('.pd-thumb');
  if(!thumb) return;
  document.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  document.getElementById('pdMainImg').src = thumb.dataset.img;
});
document.getElementById('pdSizes').addEventListener('click', (e)=>{
  const btn = e.target.closest('.pd-size-btn');
  if(!btn) return;
  pdSelectedSize = btn.dataset.size;
  document.querySelectorAll('.pd-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});
document.getElementById('pdColors').addEventListener('click', (e)=>{
  const swatch = e.target.closest('.pd-color-swatch');
  if(!swatch) return;
  pdSelectedColor = swatch.dataset.color;
  document.querySelectorAll('.pd-color-swatch').forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
});
document.getElementById('pdQtyUp').addEventListener('click', ()=>{
  pdQty++; document.getElementById('pdQty').textContent = pdQty;
});
document.getElementById('pdQtyDown').addEventListener('click', ()=>{
  if(pdQty > 1) pdQty--;
  document.getElementById('pdQty').textContent = pdQty;
});
document.getElementById('pdAddToCart').addEventListener('click', ()=>{
  if(!pdCurrentProduct) return;
  addToCart(pdCurrentProduct.id, pdQty, pdSelectedSize, pdSelectedColor);
});
document.getElementById('pdBuyNow').addEventListener('click', ()=>{
  if(!pdCurrentProduct) return;
  addToCart(pdCurrentProduct.id, pdQty, pdSelectedSize, pdSelectedColor);
  closeProductDetail();
  openCheckout();
});

document.getElementById('pdMediaMain').addEventListener('click', ()=>{
  if(!pdCurrentProduct) return;
  openLightbox(document.getElementById('pdMainImg').src, pdCurrentProduct.name);
});

// ===========================
// Zoom plein écran (lightbox)
// ===========================
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxZoomWrap = document.getElementById('lightboxZoomWrap');
const lightboxClose = document.getElementById('lightboxClose');
const LB_MIN_SCALE = 1, LB_MAX_SCALE = 3, LB_TAP_SCALE = 2.2;
let lbScale = 1, lbPosX = 0, lbPosY = 0;

function lbApplyTransform(){
  lightboxImg.style.transform = `translate(${lbPosX}px, ${lbPosY}px) scale(${lbScale})`;
  lightboxZoomWrap.classList.toggle('is-zoomed', lbScale > 1.01);
}
function lbClampPos(){
  const rect = lightboxZoomWrap.getBoundingClientRect();
  const maxX = Math.max(0, (rect.width * (lbScale - 1)) / 2);
  const maxY = Math.max(0, (rect.height * (lbScale - 1)) / 2);
  lbPosX = Math.min(maxX, Math.max(-maxX, lbPosX));
  lbPosY = Math.min(maxY, Math.max(-maxY, lbPosY));
}
function lbResetZoom(){ lbScale = 1; lbPosX = 0; lbPosY = 0; lbApplyTransform(); }
function openLightbox(src, alt){
  lightboxImg.src = src; lightboxImg.alt = alt || '';
  lbResetZoom();
  lightboxOverlay.classList.add('open');
}
function closeLightbox(){ lightboxOverlay.classList.remove('open'); }
lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', (e)=>{ if(e.target === lightboxOverlay) closeLightbox(); });
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  if(lightboxOverlay.classList.contains('open')) closeLightbox();
  else if(productOverlay.classList.contains('open')) closeProductDetail();
});

const lbPointers = new Map();
let lbPinchStartDist = 0, lbPinchStartScale = 1, lbIsPanning = false;
let lbPanStart = { x:0, y:0 }, lbPosStart = { x:0, y:0 }, lbDownPoint = { x:0, y:0 }, lbMoved = false;
function lbDist(p1, p2){ return Math.hypot(p1.x - p2.x, p1.y - p2.y); }

lightboxImg.addEventListener('pointerdown', (e)=>{
  lightboxImg.setPointerCapture(e.pointerId);
  lbPointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  lbMoved = false;
  lbDownPoint = { x:e.clientX, y:e.clientY };
  if(lbPointers.size === 2){
    const pts = Array.from(lbPointers.values());
    lbPinchStartDist = lbDist(pts[0], pts[1]);
    lbPinchStartScale = lbScale;
    lbIsPanning = false;
  } else if(lbPointers.size === 1 && lbScale > 1){
    lbIsPanning = true;
    lbPanStart = { x:e.clientX, y:e.clientY };
    lbPosStart = { x:lbPosX, y:lbPosY };
  }
});
lightboxImg.addEventListener('pointermove', (e)=>{
  if(!lbPointers.has(e.pointerId)) return;
  lbPointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if(lbPointers.size === 2){
    const pts = Array.from(lbPointers.values());
    const dist = lbDist(pts[0], pts[1]);
    if(lbPinchStartDist > 0){
      lbScale = Math.min(LB_MAX_SCALE, Math.max(LB_MIN_SCALE, lbPinchStartScale * (dist / lbPinchStartDist)));
      lbClampPos(); lbApplyTransform();
    }
    lbMoved = true;
  } else if(lbIsPanning){
    const dx = e.clientX - lbPanStart.x, dy = e.clientY - lbPanStart.y;
    if(Math.abs(dx) > 3 || Math.abs(dy) > 3) lbMoved = true;
    lbPosX = lbPosStart.x + dx; lbPosY = lbPosStart.y + dy;
    lbClampPos(); lbApplyTransform();
  }
});
function lbEndPointer(e){
  lbPointers.delete(e.pointerId);
  if(lbPointers.size < 2) lbPinchStartDist = 0;
  if(lbPointers.size === 0){
    lbIsPanning = false;
    const movedDist = Math.hypot(e.clientX - lbDownPoint.x, e.clientY - lbDownPoint.y);
    if(!lbMoved && movedDist < 6){
      if(lbScale > 1){ lbResetZoom(); } else { lbScale = LB_TAP_SCALE; lbClampPos(); lbApplyTransform(); }
    }
  }
}
lightboxImg.addEventListener('pointerup', lbEndPointer);
lightboxImg.addEventListener('pointercancel', lbEndPointer);
lightboxZoomWrap.addEventListener('wheel', (e)=>{
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.25 : -0.25;
  lbScale = Math.min(LB_MAX_SCALE, Math.max(LB_MIN_SCALE, lbScale + delta));
  lbClampPos(); lbApplyTransform();
}, { passive:false });

// ===========================
// WhatsApp flottant + footer
// ===========================
const genericWhatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour CHACHA SHOP VIP, je voudrais passer une commande.')}`;
document.getElementById('whatsappFloat').href = genericWhatsappURL;
document.getElementById('footerWhatsapp').href = genericWhatsappURL;
document.getElementById('footerWhatsapp').target = '_blank';

// ===========================
// Préchargeur
// ===========================
window.addEventListener('load', ()=>{
  const pre = document.getElementById('preloader');
  setTimeout(()=>{
    pre.classList.add('done');
    setTimeout(()=> pre.style.display = 'none', 700);
  }, 350);
});

// ===========================
// Header fixe : ombre légère au scroll
// ===========================
const header = document.getElementById('header');
window.addEventListener('scroll', ()=>{
  header.classList.toggle('scrolled', window.scrollY > 8);
}, { passive:true });

// ===========================
// Reveal au scroll
// ===========================
const revealEls = document.querySelectorAll('[data-reveal]');
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry =>{
    if(entry.isIntersecting){ entry.target.classList.add('in'); observer.unobserve(entry.target); }
  });
}, { threshold:0.15 });
revealEls.forEach(el => observer.observe(el));

// ===========================
// Synchronisation Firebase
// ===========================
subscribeToProducts((list)=>{
  allProducts = list;
  productsLoaded = true;
  renderAllGrids();
  renderCart();
  if(searchPanel.classList.contains('open')) renderSearchResults(searchInput.value);
});
subscribeToOrders((list)=>{
  allOrders = list;
});