// ===========================
// CHACHA — Espace Admin
// ===========================

let allProducts = [];
let allOrders = [];
let productFilter = 'all';
let orderFilter = 'all';

const adminLoginScreen = document.getElementById('adminLoginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const adminFormOverlay = document.getElementById('adminFormOverlay');

function showLoginScreen(){
  adminLoginScreen.hidden = false;
  adminLoginScreen.style.display = 'flex';
  adminDashboard.hidden = true;
}
function showDashboard(){
  adminLoginScreen.style.display = 'none';
  adminLoginScreen.hidden = true;
  adminDashboard.hidden = false;
  renderDashboard();
}

if(isAdminLoggedIn()){ showDashboard(); } else { showLoginScreen(); }

document.getElementById('adminLoginForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const val = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('adminLoginError');
  if(val === ADMIN_PASSWORD){
    sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    document.getElementById('adminLoginForm').reset();
    errorEl.style.display = 'none';
    showDashboard();
  } else {
    errorEl.style.display = 'block';
  }
});
document.getElementById('adminLogoutBtn').addEventListener('click', ()=>{
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showToast("Déconnecté(e) de l'espace admin");
  showLoginScreen();
});

const adminNav = document.getElementById('adminNav');
const panelProduits = document.getElementById('panelProduits');
const panelCommandes = document.getElementById('panelCommandes');
function switchAdminTab(tab){
  const isProduits = tab === 'produits';
  panelProduits.hidden = !isProduits;
  panelCommandes.hidden = isProduits;
  adminNav.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  if(isProduits){ renderAdminProductList(); } else { renderAdminOrderList(); }
}
adminNav.addEventListener('click', (e)=>{
  const btn = e.target.closest('.admin-nav-btn');
  if(!btn) return;
  switchAdminTab(btn.dataset.tab);
});

function renderDashboard(){
  renderStats();
  renderAdminProductList();
  renderAdminOrderList();
  updateOrdersCountBadge();
}
function renderStats(){
  const totalProducts = allProducts.length;
  const totalOrders = allOrders.length;
  const newOrders = allOrders.filter(o => o.status === 'nouvelle').length;
  const revenue = allOrders.filter(o => o.status !== 'annulee').reduce((sum, o) => sum + (o.total || 0), 0);
  const stats = [
    { label:'Produits en ligne', value: totalProducts, icon:'fa-shoe-prints' },
    { label:'Commandes reçues', value: totalOrders, icon:'fa-box' },
    { label:'Nouvelles commandes', value: newOrders, icon:'fa-bell', highlight: newOrders > 0 },
    { label:"Chiffre d'affaires estimé", value: formatFCFA(revenue), icon:'fa-sack-dollar' }
  ];
  document.getElementById('adminStatsRow').innerHTML = stats.map(s => `
    <div class="admin-stat-card ${s.highlight ? 'is-highlight' : ''}">
      <span class="admin-stat-icon"><i class="fa-solid ${s.icon}"></i></span>
      <div><div class="admin-stat-value">${s.value}</div><div class="admin-stat-label">${s.label}</div></div>
    </div>`).join('');
}
function updateOrdersCountBadge(){
  document.getElementById('ordersCountBadge').textContent = allOrders.length;
}

subscribeToProducts((list)=>{
  allProducts = list;
  if(!adminDashboard.hidden){ renderAdminProductList(); renderStats(); }
});
subscribeToOrders((list)=>{
  allOrders = list;
  updateOrdersCountBadge();
  if(!adminDashboard.hidden){ renderAdminOrderList(); renderStats(); }
});

// ===========================
// Onglet Produits
// ===========================
const productFilterRow = document.querySelector('#panelProduits .admin-filter-row');
productFilterRow.addEventListener('click', (e)=>{
  const chip = e.target.closest('.admin-filter-chip');
  if(!chip) return;
  productFilter = chip.dataset.filter;
  productFilterRow.querySelectorAll('.admin-filter-chip').forEach(c => c.classList.toggle('active', c === chip));
  renderAdminProductList();
});

function renderAdminProductList(){
  const list = document.getElementById('adminProductList');
  const items = productFilter === 'all' ? allProducts : allProducts.filter(p => p.type === productFilter);
  if(items.length === 0){
    list.innerHTML = `<p class="admin-empty">Aucun produit ${productFilter !== 'all' ? 'dans cette catégorie ' : ''}pour le moment. Clique sur "+ Ajouter un produit" pour commencer.</p>`;
    return;
  }
  list.innerHTML = items.map(p => `
    <div class="admin-product-row" data-id="${p.id}">
      <img src="${p.img}" alt="${p.name}">
      <div class="admin-product-info">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-meta">${p.type === 'shoe' ? 'Chaussure' : 'Vêtement'} · ${audienceLabel(p.audience || 'unisexe')} · ${p.cat} · ${formatFCFA(p.price)}${p.badge ? ' · ' + p.badge : ''}</div>
      </div>
      <div class="admin-product-actions">
        <button class="admin-icon-btn" data-edit="${p.id}" aria-label="Modifier ${p.name}" title="Modifier"><i class="fa-solid fa-pen"></i></button>
        <button class="admin-icon-btn danger" data-delete="${p.id}" aria-label="Supprimer ${p.name}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}

document.getElementById('adminProductList').addEventListener('click', (e)=>{
  const editBtn = e.target.closest('[data-edit]');
  if(editBtn){ openAdminForm(editBtn.dataset.edit); return; }
  const delBtn = e.target.closest('[data-delete]');
  if(delBtn){
    const product = allProducts.find(p => p.id === delBtn.dataset.delete);
    if(product && confirm(`Supprimer "${product.name}" ? Cette action est définitive et s'appliquera sur tous les appareils.`)){
      deleteProductRemote(delBtn.dataset.delete).then(()=>{
        showToast('Produit supprimé');
      }).catch(()=>{
        showToast('Erreur réseau — impossible de supprimer ce produit, réessaie');
      });
    }
  }
});

document.getElementById('adminAddBtn').addEventListener('click', ()=> openAdminForm(null));

function openAdminForm(id){
  const form = document.getElementById('adminProductForm');
  form.reset();
  document.getElementById('adminFormTitle').textContent = id ? 'Modifier le produit' : 'Ajouter un produit';
  document.getElementById('adminProductId').value = id || '';
  adminUploadedImage = null;
  resetAdminImagePreview();

  if(id){
    const p = allProducts.find(x => x.id === id);
    if(p){
      document.getElementById('adminName').value = p.name;
      document.getElementById('adminType').value = p.type;
      document.getElementById('adminAudience').value = p.audience || 'unisexe';
      document.getElementById('adminCat').value = p.cat;
      document.getElementById('adminDesc').value = p.desc || '';
      document.getElementById('adminPrice').value = p.price;
      document.getElementById('adminOldPrice').value = p.old || '';
      document.getElementById('adminBadge').value = p.badge || '';
      document.getElementById('adminColors').value = (p.colors || []).join(',');
      document.getElementById('adminImages').value = (p.images || []).join(',');

      if(p.img && p.img.startsWith('data:')){
        adminUploadedImage = p.img;
        showAdminImagePreview(p.img);
        document.getElementById('adminImg').value = '';
      } else {
        document.getElementById('adminImg').value = p.img || '';
      }
    }
  }
  adminFormOverlay.classList.add('open');
}

let adminUploadedImage = null;
const adminUploadZone = document.getElementById('adminUploadZone');
const adminImgFile = document.getElementById('adminImgFile');
const adminImgPreview = document.getElementById('adminImgPreview');
const adminUploadPlaceholder = document.getElementById('adminUploadPlaceholder');
const adminRemoveImgBtn = document.getElementById('adminRemoveImg');

adminUploadZone.addEventListener('click', ()=> adminImgFile.click());
adminImgFile.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ showToast('Merci de choisir un fichier image'); return; }
  try{
    adminUploadPlaceholder.innerHTML = `<i class="fa-solid fa-spinner fa-spin admin-upload-icon"></i><span>Traitement de l'image…</span>`;
    const dataUrl = await compressImageFile(file, 1000, 0.82);
    adminUploadedImage = dataUrl;
    document.getElementById('adminImg').value = '';
    showAdminImagePreview(dataUrl);
  }catch(err){
    showToast('Impossible de lire cette image, réessaie avec un autre fichier');
    resetAdminImagePreview();
  }
});
adminRemoveImgBtn.addEventListener('click', (e)=>{
  e.stopPropagation();
  adminUploadedImage = null;
  adminImgFile.value = '';
  resetAdminImagePreview();
});
function showAdminImagePreview(dataUrl){
  adminImgPreview.src = dataUrl;
  adminImgPreview.style.display = 'block';
  adminUploadPlaceholder.style.display = 'none';
  adminRemoveImgBtn.style.display = 'inline-block';
}
function resetAdminImagePreview(){
  adminImgPreview.src = '';
  adminImgPreview.style.display = 'none';
  adminUploadPlaceholder.innerHTML = `<i class="fa-solid fa-camera admin-upload-icon"></i><span>Clique pour choisir une photo</span><span class="admin-upload-hint">JPG, PNG ou WEBP</span>`;
  adminUploadPlaceholder.style.display = 'flex';
  adminRemoveImgBtn.style.display = 'none';
}
function compressImageFile(file, maxWidth, quality){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image invalide'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById('closeAdminForm').addEventListener('click', ()=> adminFormOverlay.classList.remove('open'));
document.getElementById('cancelAdminForm').addEventListener('click', ()=> adminFormOverlay.classList.remove('open'));
adminFormOverlay.addEventListener('click', (e)=>{ if(e.target === adminFormOverlay) adminFormOverlay.classList.remove('open'); });

document.getElementById('adminProductForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const id = document.getElementById('adminProductId').value;
  const colorsRaw = document.getElementById('adminColors').value.trim();
  const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim()).filter(Boolean) : ['#1C1C1C'];
  const imagesRaw = document.getElementById('adminImages').value.trim();
  const images = imagesRaw ? imagesRaw.split(',').map(u => u.trim()).filter(Boolean) : [];
  const oldVal = document.getElementById('adminOldPrice').value;
  const urlVal = document.getElementById('adminImg').value.trim();
  const finalImg = adminUploadedImage || urlVal;

  if(!finalImg){ showToast("Ajoute une photo ou une URL d'image pour ce produit"); return; }

  const existing = id ? allProducts.find(p => p.id === id) : null;
  const finalProduct = {
    ...(existing || {}),
    id: id || genId(),
    name: document.getElementById('adminName').value.trim(),
    type: document.getElementById('adminType').value,
    audience: document.getElementById('adminAudience').value,
    cat: document.getElementById('adminCat').value.trim(),
    desc: document.getElementById('adminDesc').value.trim() || null,
    price: parseInt(document.getElementById('adminPrice').value, 10) || 0,
    old: oldVal ? (parseInt(oldVal, 10) || null) : null,
    badge: document.getElementById('adminBadge').value || null,
    img: finalImg,
    images,
    colors
  };

  const submitBtn = document.getElementById('adminProductForm').querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enregistrement…';

  saveProductRemote(finalProduct).then(()=>{
    showToast(id ? 'Produit mis à jour sur tous les appareils' : 'Produit ajouté sur tous les appareils');
    adminFormOverlay.classList.remove('open');
  }).catch(()=>{
    showToast("Erreur réseau — impossible d'enregistrer ce produit, réessaie");
  }).finally(()=>{
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enregistrer';
  });
});

// ===========================
// Onglet Commandes
// ===========================
const orderFilterRow = document.getElementById('orderFilterRow');
orderFilterRow.addEventListener('click', (e)=>{
  const chip = e.target.closest('.admin-filter-chip');
  if(!chip) return;
  orderFilter = chip.dataset.orderFilter;
  orderFilterRow.querySelectorAll('.admin-filter-chip').forEach(c => c.classList.toggle('active', c === chip));
  renderAdminOrderList();
});

function renderAdminOrderList(){
  const list = document.getElementById('adminOrderList');
  if(!list) return;
  updateOrdersCountBadge();
  const items = orderFilter === 'all' ? allOrders : allOrders.filter(o => o.status === orderFilter);

  if(allOrders.length === 0){
    list.innerHTML = `<p class="admin-empty">Aucune commande reçue pour le moment sur cet appareil.</p>`;
    return;
  }
  if(items.length === 0){
    list.innerHTML = `<p class="admin-empty">Aucune commande dans ce filtre pour le moment.</p>`;
    return;
  }

  list.innerHTML = items.map(order => {
    const meta = getStatusMeta(order.status);
    const itemsList = order.items.map(i => `
      <div class="admin-order-item-row">
        <img src="${i.img || ''}" alt="${i.name}">
        <span class="admin-order-item-name">${i.name}${i.size ? ' · '+i.size : ''} ×${i.qty}</span>
        <span>${formatFCFA(i.lineTotal)}</span>
      </div>`).join('');
    const statusOptions = ORDER_STATUSES.map(s => `<option value="${s.key}" ${s.key === order.status ? 'selected' : ''}>${s.label}</option>`).join('');

    return `
    <div class="admin-order-card" data-order-id="${order.id}">
      <div class="admin-order-top">
        <div>
          <div class="admin-order-id">#${order.id}</div>
          <div class="admin-order-date">${formatDate(order.createdAt)}</div>
        </div>
        <span class="admin-order-status-pill" style="background:${meta.color}22;color:${meta.color};">${meta.label}</span>
      </div>
      <div class="admin-order-client">${order.fullName} — ${order.phone}</div>
      <div class="admin-order-meta">
        <span><i class="fa-solid fa-location-dot"></i> ${order.addressDetails}, ${order.neighborhood}, ${order.city}</span>
        ${order.addressNote ? `<span><i class="fa-solid fa-note-sticky"></i> ${order.addressNote}</span>` : ''}
      </div>
      <div class="admin-order-items">${itemsList}</div>
      <div class="admin-order-total">Total : ${formatFCFA(order.total)}</div>
      <div class="admin-order-actions">
        <select data-status-select="${order.id}" aria-label="Changer le statut de la commande">${statusOptions}</select>
        <button type="button" class="btn btn-whatsapp" data-contact="${order.id}"><i class="fa-brands fa-whatsapp"></i> Contacter</button>
      </div>
    </div>`;
  }).join('');
}

document.getElementById('adminOrderList').addEventListener('change', (e)=>{
  const select = e.target.closest('[data-status-select]');
  if(!select) return;
  const orderId = select.dataset.statusSelect;
  const previousValue = allOrders.find(o => o.id === orderId)?.status;
  updateOrderStatusRemote(orderId, select.value).then(()=>{
    showToast('Statut de la commande mis à jour sur tous les appareils');
  }).catch(()=>{
    if(previousValue) select.value = previousValue;
    showToast('Erreur réseau — impossible de mettre à jour le statut, réessaie');
  });
});

document.getElementById('adminOrderList').addEventListener('click', (e)=>{
  const contactBtn = e.target.closest('[data-contact]');
  if(!contactBtn) return;
  const order = allOrders.find(o => o.id === contactBtn.dataset.contact);
  if(!order) return;
  const lines = [
    `Bonjour ${order.fullName}, ici CHACHA SHOP VIP.`,
    `Je vous contacte au sujet de votre commande #${order.id} (${formatFCFA(order.total)}) pour finaliser le paiement et organiser la livraison.`
  ];
  const msg = encodeURIComponent(lines.join('\n'));
  const url = `https://wa.me/${toInternationalPhone(order.phone)}?text=${msg}`;
  window.open(url, '_blank');
});

const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove('show'), 2400);
}