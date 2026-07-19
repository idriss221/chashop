// ===========================
// CHACHA — Boutique (script.js)
// La configuration, les données produits par défaut et les fonctions de
// synchronisation Firebase (partagées avec l'espace admin) vivent dans
// common.js (chargé avant ce fichier dans index.html).
// ===========================

// Catalogue et commandes : mis à jour automatiquement en temps réel dès que
// quelque chose change sur n'importe quel appareil (voir subscribeToProducts
// / subscribeToOrders ci-dessous).
let allProducts = [];
let allOrders = [];

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
    <div class="product-img-wrap" role="button" tabindex="0" aria-label="Agrandir la photo de ${p.name}">
      ${p.badge ? `<span class="product-badge ${badgeClass(p.badge)}">${p.badge}</span>` : ''}
      <img src="${p.img}" alt="${p.name}" loading="lazy" draggable="false">
      <span class="product-zoom-hint">🔍</span>
    </div>
    <div class="product-info">
      <span class="product-cat">${p.cat}</span>
      <h3 class="product-name">${p.name}</h3>
      ${priceHTML(p)}
      <button class="add-cart-btn" data-add="${p.id}">Ajouter au panier</button>
    </div>
  </article>`;
}

function renderGrid(containerId, items){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = items.length
    ? items.map(cardHTML).join('')
    : `<p class="admin-empty">Aucun produit dans cette catégorie pour le moment.</p>`;
}

function renderAllGrids(){
  const newArrivals = allProducts.filter(p => p.badge === 'NOUVEAU').concat(
    allProducts.filter(p => p.badge !== 'NOUVEAU')
  ).slice(0, 4);

  renderGrid('newArrivals', newArrivals);
  renderGrid('shoesGrid', allProducts.filter(p => p.type === 'shoe'));
  renderGrid('clothesGrid', allProducts.filter(p => p.type === 'cloth'));
  initCardAnimations();
}

// Apparition en cascade des cartes produit (ré-appliquée à chaque rendu)
function initCardAnimations(){
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

  document.querySelectorAll('.product-card').forEach(card =>{
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    cardObserver.observe(card);
  });
}

// ===========================
// État du panier
// ===========================
let cart = []; // [{id, qty}]

function getCartDetails(){
  return cart.map(item => {
    const product = allProducts.find(p => p.id === item.id);
    if(!product) return null;
    return { ...product, qty: item.qty, lineTotal: product.price * item.qty };
  }).filter(Boolean);
}
function getCartTotal(){
  return getCartDetails().reduce((sum, item) => sum + item.lineTotal, 0);
}
function getCartCount(){
  return cart.reduce((sum, item) => sum + item.qty, 0);
}
function addToCart(id){
  const existing = cart.find(item => item.id === id);
  if(existing){ existing.qty++; } else { cart.push({ id, qty:1 }); }
  renderCart();
  const product = allProducts.find(p => p.id === id);
  if(product){ showToast(`${product.name} ajouté au panier`); }
  pulseCartIcon();
}
function changeQty(id, delta){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ cart = cart.filter(i => i.id !== id); }
  renderCart();
}
function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  renderCart();
}
function pulseCartIcon(){
  const el = document.getElementById('cartCount');
  el.style.transform = 'scale(1.4)';
  setTimeout(()=> el.style.transform = 'scale(1)', 200);
}

// ===========================
// Rendu du panier (drawer)
// ===========================
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

  cartItemsEl.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.img}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatFCFA(item.lineTotal)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-qty-down="${item.id}">−</button>
          <span>${item.qty}</span>
          <button class="qty-btn" data-qty-up="${item.id}">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-remove="${item.id}">Retirer</button>
    </div>
  `).join('');

  document.getElementById('cartTotal').textContent = formatFCFA(getCartTotal());
}

// ===========================
// Délégation d'événements globale
// ===========================
document.body.addEventListener('click', (e)=>{
  const addBtn = e.target.closest('[data-add]');
  if(addBtn){ addToCart(addBtn.dataset.add); return; }

  const qtyUp = e.target.closest('[data-qty-up]');
  if(qtyUp){ changeQty(qtyUp.dataset.qtyUp, 1); return; }

  const qtyDown = e.target.closest('[data-qty-down]');
  if(qtyDown){ changeQty(qtyDown.dataset.qtyDown, -1); return; }

  const removeBtn = e.target.closest('[data-remove]');
  if(removeBtn){ removeFromCart(removeBtn.dataset.remove); return; }

  const imgWrap = e.target.closest('.product-img-wrap');
  if(imgWrap){
    const card = imgWrap.closest('[data-id]');
    if(card) openLightbox(card.dataset.id);
    return;
  }
});

// Ouverture de la photo aussi au clavier (Entrée / Espace) pour l'accessibilité
document.body.addEventListener('keydown', (e)=>{
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const imgWrap = e.target.closest && e.target.closest('.product-img-wrap');
  if(imgWrap){
    e.preventDefault();
    const card = imgWrap.closest('[data-id]');
    if(card) openLightbox(card.dataset.id);
  }
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
// Drawer panier — ouverture/fermeture
// ===========================
const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');

function openCart(){
  cartDrawer.classList.add('open');
  overlay.classList.add('show');
}
function closeCartDrawer(){
  cartDrawer.classList.remove('open');
  overlay.classList.remove('show');
}

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCartDrawer);
overlay.addEventListener('click', ()=>{
  closeCartDrawer();
  closeCheckout();
});
document.getElementById('emptyShopBtn').addEventListener('click', closeCartDrawer);

// ===========================
// TUNNEL DE COMMANDE (sans paiement en ligne)
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
function closeCheckout(){
  checkoutOverlay.classList.remove('open');
}

function renderCheckoutSummary(){
  const items = getCartDetails();
  document.getElementById('checkoutSummary').innerHTML = items.map(item => `
    <div class="summary-line">
      <span>${item.name} <span class="s-qty">×${item.qty}</span></span>
      <span>${formatFCFA(item.lineTotal)}</span>
    </div>
  `).join('');
  document.getElementById('checkoutTotal').textContent = formatFCFA(getCartTotal());
}

document.getElementById('goToCheckout').addEventListener('click', openCheckout);
document.getElementById('closeCheckout').addEventListener('click', closeCheckout);

// Étape 1 -> 2
document.getElementById('toStep2').addEventListener('click', ()=> setStep(2));
document.getElementById('backToStep1').addEventListener('click', ()=> setStep(1));

// Étape 2 : validation adresse -> création directe de la commande (pas de paiement en ligne)
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
    items: items.map(i => ({ id:i.id, name:i.name, price:i.price, qty:i.qty, lineTotal:i.lineTotal })),
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
    // Récap visuel de confirmation
    document.getElementById('confirmName').textContent = order.fullName;
    document.getElementById('confirmOrderId').textContent = '#' + order.id;
    document.getElementById('confirmRecap').innerHTML = `
      <div>📦 <strong>${items.reduce((s,i)=>s+i.qty,0)} article(s)</strong> — ${formatFCFA(total)}</div>
      <div>📍 ${order.neighborhood}, ${order.city}</div>
      <div>📞 ${order.phone}</div>
      <div>🔖 Numéro de suivi : <strong>${order.id}</strong></div>
    `;

    // Message WhatsApp pré-rempli vers la boutique (le client peut l'envoyer pour accélérer le contact)
    const lines = [
      `🛍️ *Nouvelle commande CHACHA* #${order.id}`,
      ``,
      `👤 Client : ${order.fullName}`,
      `📞 Téléphone : ${order.phone}`,
      `📍 Adresse : ${order.addressDetails}, ${order.neighborhood}, ${order.city}`,
      order.addressNote ? `📝 Note : ${order.addressNote}` : null,
      ``,
      `🧾 Articles :`,
      ...items.map(i => `• ${i.name} ×${i.qty} — ${formatFCFA(i.lineTotal)}`),
      ``,
      `💰 Total : ${formatFCFA(total)}`,
      `Merci de me contacter pour finaliser le paiement 🙏`
    ].filter(Boolean);
    const whatsappMessage = encodeURIComponent(lines.join('\n'));
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;
    document.getElementById('sendWhatsappBtn').href = whatsappURL;
    document.getElementById('sendWhatsappBtn').onclick = ()=> window.open(whatsappURL, '_blank');

    setStep(3);
    document.getElementById('addressForm').reset();

    // Vider le panier après confirmation
    cart = [];
    renderCart();
  }).catch(()=>{
    showToast('Impossible d\'enregistrer ta commande — vérifie ta connexion internet et réessaie');
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
}
function closeTrack(){
  trackOverlay.classList.remove('open');
}
document.getElementById('trackOpenBtn').addEventListener('click', openTrack);
document.getElementById('trackOpenBtn2').addEventListener('click', openTrack);
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
    timelineHTML = `
      <div class="track-timeline">
        <div class="track-timeline-item cancelled">
          <span class="track-timeline-dot">✕</span>
          <span class="track-timeline-label">Commande annulée</span>
        </div>
      </div>`;
  } else {
    const currentIdx = TIMELINE_STEPS.indexOf(order.status);
    timelineHTML = `<div class="track-timeline">` + TIMELINE_STEPS.map((key, i)=>{
      const stepMeta = getStatusMeta(key);
      let cls = '';
      let icon = '';
      if(i < currentIdx){ cls = 'done'; icon = '✓'; }
      else if(i === currentIdx){ cls = 'current'; icon = '●'; }
      return `
        <div class="track-timeline-item ${cls}">
          <span class="track-timeline-dot">${icon}</span>
          <span class="track-timeline-label">${stepMeta.label}</span>
        </div>`;
    }).join('') + `</div>`;
  }

  return `
    <div class="track-result-head">
      <strong>Commande #${order.id}</strong>
      <span class="track-result-date">${formatDate(order.createdAt)}</span>
    </div>
    <span class="track-status-badge" style="background:${meta.color}22;color:${meta.color};">● ${meta.label}</span>
    ${timelineHTML}
    <div class="track-recap">
      <div>📦 ${order.items.reduce((s,i)=>s+i.qty,0)} article(s) — ${formatFCFA(order.total)}</div>
      <div>📍 ${order.neighborhood}, ${order.city}</div>
    </div>
  `;
}

// ===========================
// Bouton flottant WhatsApp + footer
// ===========================
const genericWhatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour CHACHA, je voudrais passer une commande 🙂')}`;
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
// Header : masquer au scroll vers le bas
// ===========================
let lastScroll = 0;
const header = document.getElementById('header');
window.addEventListener('scroll', ()=>{
  const current = window.scrollY;
  if(current > lastScroll && current > 200){
    header.classList.add('hide');
  } else {
    header.classList.remove('hide');
  }
  lastScroll = current;
}, { passive:true });

// ===========================
// Reveal au scroll
// ===========================
const revealEls = document.querySelectorAll('[data-reveal]');
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry =>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold:0.15 });
revealEls.forEach(el => observer.observe(el));

// ===========================
// PHOTO PRODUIT — vue zoom (façon Jumia)
// Clic/tap sur la photo = zoom avant/arrière · glisser = déplacer la photo
// zoomée · pincer à deux doigts = zoom progressif · molette = zoom (desktop)
// ===========================
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxZoomWrap = document.getElementById('lightboxZoomWrap');
const lightboxName = document.getElementById('lightboxName');
const lightboxPrice = document.getElementById('lightboxPrice');
const lightboxAddBtn = document.getElementById('lightboxAddBtn');
const lightboxClose = document.getElementById('lightboxClose');

const LB_MIN_SCALE = 1;
const LB_MAX_SCALE = 3;
const LB_TAP_SCALE = 2.2;

let lbScale = 1, lbPosX = 0, lbPosY = 0;
let lbCurrentId = null;

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
function lbResetZoom(){
  lbScale = 1; lbPosX = 0; lbPosY = 0;
  lbApplyTransform();
}

function openLightbox(id){
  const product = allProducts.find(p => p.id === id);
  if(!product) return;
  lbCurrentId = id;
  lightboxImg.src = product.img;
  lightboxImg.alt = product.name;
  lightboxName.textContent = product.name;
  lightboxPrice.textContent = formatFCFA(product.price);
  lbResetZoom();
  lightboxOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(){
  lightboxOverlay.classList.remove('open');
  document.body.style.overflow = '';
  lbCurrentId = null;
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', (e)=>{
  if(e.target === lightboxOverlay) closeLightbox();
});
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && lightboxOverlay.classList.contains('open')) closeLightbox();
});
lightboxAddBtn.addEventListener('click', ()=>{
  if(lbCurrentId){ addToCart(lbCurrentId); }
});

// --- Interactions tactiles / souris : tap pour zoomer, glisser pour déplacer, pincer pour ajuster ---
const lbPointers = new Map(); // pointerId -> {x, y}
let lbPinchStartDist = 0;
let lbPinchStartScale = 1;
let lbIsPanning = false;
let lbPanStart = { x:0, y:0 };
let lbPosStart = { x:0, y:0 };
let lbDownPoint = { x:0, y:0 };
let lbMoved = false;

function lbDist(p1, p2){
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

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
      lbClampPos();
      lbApplyTransform();
    }
    lbMoved = true;
  } else if(lbIsPanning){
    const dx = e.clientX - lbPanStart.x;
    const dy = e.clientY - lbPanStart.y;
    if(Math.abs(dx) > 3 || Math.abs(dy) > 3) lbMoved = true;
    lbPosX = lbPosStart.x + dx;
    lbPosY = lbPosStart.y + dy;
    lbClampPos();
    lbApplyTransform();
  }
});

function lbEndPointer(e){
  lbPointers.delete(e.pointerId);
  if(lbPointers.size < 2) lbPinchStartDist = 0;
  if(lbPointers.size === 0){
    lbIsPanning = false;
    const movedDist = Math.hypot(e.clientX - lbDownPoint.x, e.clientY - lbDownPoint.y);
    // Un simple tap/clic (sans glissement) bascule le zoom avant/arrière
    if(!lbMoved && movedDist < 6){
      if(lbScale > 1){
        lbResetZoom();
      } else {
        lbScale = LB_TAP_SCALE;
        lbClampPos();
        lbApplyTransform();
      }
    }
  }
}
lightboxImg.addEventListener('pointerup', lbEndPointer);
lightboxImg.addEventListener('pointercancel', lbEndPointer);

// Molette de souris (desktop) : zoom progressif sans avoir à cliquer
lightboxZoomWrap.addEventListener('wheel', (e)=>{
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.25 : -0.25;
  lbScale = Math.min(LB_MAX_SCALE, Math.max(LB_MIN_SCALE, lbScale + delta));
  lbClampPos();
  lbApplyTransform();
}, { passive:false });

// ===========================
// Synchronisation en temps réel (Firebase)
// Dès qu'un produit ou une commande change — sur CET appareil ou sur
// n'importe quel autre — ces fonctions se redéclenchent automatiquement.
// ===========================
subscribeToProducts((list)=>{
  allProducts = list;
  renderAllGrids();
  renderCart(); // les prix/noms affichés dans le panier peuvent avoir changé
});
subscribeToOrders((list)=>{
  allOrders = list; // utilisé par le suivi de commande
});