// ===========================
// CHACHA — Données & utilitaires partagés
// ===========================

const WHATSAPP_NUMBER = '221771767071';

const ADMIN_PASSWORD = 'chacha2026';
const ADMIN_SESSION_KEY = 'chacha_admin_session';

const ORDER_STATUSES = [
  { key:'nouvelle',    label:'Nouvelle commande',     color:'#8A5A3C' },
  { key:'contactee',   label:'Client contacté',       color:'#7A756C' },
  { key:'confirmee',   label:'Paiement confirmé',     color:'#2563EB' },
  { key:'preparation', label:'En préparation',        color:'#6B4A34' },
  { key:'livraison',   label:'En cours de livraison', color:'#0EA5E9' },
  { key:'livree',      label:'Livrée',                 color:'#22B159' },
  { key:'annulee',     label:'Annulée',                 color:'#B3261E' }
];
const TIMELINE_STEPS = ['nouvelle','contactee','confirmee','preparation','livraison','livree'];

const SHOE_SIZES = ['39','40','41','42','43','44','45'];
const CLOTH_SIZES = ['S','M','L','XL','XXL'];

// Public visé par le produit : utilisé pour générer les catégories
// (ex. "Chaussures Hommes", "Vêtements Enfants"...) sur la page d'accueil.
const AUDIENCES = [
  { key:'homme',   label:'Homme',   plural:'Hommes' },
  { key:'femme',   label:'Femme',   plural:'Femmes' },
  { key:'enfant',  label:'Enfant',  plural:'Enfants' },
  { key:'unisexe', label:'Unisexe', plural:'Unisexe' }
];
function audienceLabel(key){
  const a = AUDIENCES.find(x => x.key === key);
  return a ? a.label : 'Unisexe';
}
function audiencePlural(key){
  const a = AUDIENCES.find(x => x.key === key);
  return a ? a.plural : 'Unisexe';
}

function getStatusMeta(key){
  return ORDER_STATUSES.find(s => s.key === key) || ORDER_STATUSES[0];
}

function getSizesForProduct(p){
  if(p.sizes) return p.sizes;
  if(p.type === 'shoe') return SHOE_SIZES;
  if(p.cat === 'Accessoire') return null;
  return CLOTH_SIZES;
}

function discountPercent(p){
  if(!p.old || p.old <= p.price) return 0;
  return Math.round((1 - p.price / p.old) * 100);
}

function getProductImages(p){
  const imgs = [p.img];
  if(Array.isArray(p.images)) imgs.push(...p.images.filter(Boolean));
  return imgs;
}

function getSimilarProducts(product, allProducts, limit){
  limit = limit || 4;
  const sameCat = allProducts.filter(p => p.id !== product.id && p.cat === product.cat);
  const sameType = allProducts.filter(p => p.id !== product.id && p.type === product.type && p.cat !== product.cat);
  return sameCat.concat(sameType).slice(0, limit);
}

// ===========================
// Catalogue par défaut
// ===========================
const defaultProducts = [
  { id:'sh1', type:'shoe', audience:'homme', name:'ZENITH Mangue', cat:'Sneaker basse', price:25000, old:null, badge:'BEST-SELLER', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop', desc:'Sneaker basse au style urbain, semelle légère et confortable pour un port toute la journée.' },
  { id:'sh2', type:'shoe', audience:'femme', name:'OASIS Turquoise', cat:'Sneaker haute', price:32000, old:39000, badge:'PROMO', colors:['#1C1C1C','#6B7280'], img:'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=800&auto=format&fit=crop', desc:'Sneaker montante avec maintien renforcé à la cheville, idéale pour un look affirmé.' },
  { id:'sh3', type:'shoe', audience:'homme', name:'SAFRAN Runner', cat:'Running', price:28000, old:null, badge:'NOUVEAU', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop', desc:'Chaussure de running amortissante, respirante, pensée pour le mouvement.' },
  { id:'sh4', type:'shoe', audience:'unisexe', name:'DUNE Slip-on', cat:'Sneaker basse', price:21000, old:null, badge:null, colors:['#1C1C1C','#F57224'], img:'https://images.unsplash.com/photo-1465479423260-c4afc24172c6?q=80&w=800&auto=format&fit=crop', desc:'Modèle sans lacets, facile à enfiler, parfait pour le quotidien.' },
  { id:'sh5', type:'shoe', audience:'femme', name:'FUCHSIA High', cat:'Sneaker haute', price:34000, old:null, badge:'NOUVEAU', colors:['#1C1C1C','#6B7280'], img:'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop', desc:'Sneaker haute au design premium, matière durable et finitions soignées.' },
  { id:'sh6', type:'shoe', audience:'homme', name:'SAVANE Trail', cat:'Outdoor', price:30000, old:36000, badge:'PROMO', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop', desc:'Semelle crantée et accroche renforcée pour les terrains difficiles.' },
  { id:'sh7', type:'shoe', audience:'unisexe', name:'COTON Canvas', cat:'Sneaker basse', price:18000, old:null, badge:null, colors:['#E5E7EB','#1C1C1C'], img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop', desc:'Toile légère et respirante, un basique indémodable.' },
  { id:'sh8', type:'shoe', audience:'homme', name:'MÉTRO Chelsea', cat:'Boot', price:37000, old:null, badge:null, colors:['#1C1C1C'], img:'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800&auto=format&fit=crop', desc:'Boot Chelsea élégante, en simili cuir résistant.' },
  { id:'cl1', type:'cloth', audience:'unisexe', name:'Hoodie Oversize Mangue', cat:'Sweat', price:16000, old:null, badge:'BEST-SELLER', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', desc:'Coupe oversize en molleton épais, capuche doublée.' },
  { id:'cl2', type:'cloth', audience:'homme', name:'Veste Cargo Safran', cat:'Veste', price:24000, old:29000, badge:'PROMO', colors:['#F57224','#6B7280'], img:'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop', desc:'Veste utilitaire multi-poches, coupe droite.' },
  { id:'cl3', type:'cloth', audience:'unisexe', name:'Tee Chacha Basique', cat:'T-shirt', price:8000, old:null, badge:null, colors:['#1C1C1C','#E5E7EB'], img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', desc:'T-shirt basique en coton doux, coupe régulière.' },
  { id:'cl4', type:'cloth', audience:'homme', name:'Pantalon Cargo Nuit', cat:'Pantalon', price:19000, old:null, badge:'NOUVEAU', colors:['#1C1C1C','#6B7280'], img:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800&auto=format&fit=crop', desc:'Pantalon cargo confortable, poches renforcées.' },
  { id:'cl5', type:'cloth', audience:'homme', name:'Blouson Technique', cat:'Veste', price:33000, old:null, badge:'NOUVEAU', colors:['#1C1C1C','#F57224'], img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop', desc:'Blouson technique déperlant, doublure chaude.' },
  { id:'cl6', type:'cloth', audience:'femme', name:'Sweat Col Zip', cat:'Sweat', price:17000, old:null, badge:null, colors:['#6B7280','#1C1C1C'], img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop', desc:'Sweat zippé en molleton, coupe droite.' },
  { id:'cl7', type:'cloth', audience:'femme', name:'Short Toile Safran', cat:'Short', price:11000, old:13500, badge:'PROMO', colors:['#F57224'], img:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop', desc:'Short en toile légère, taille élastiquée.' },
  { id:'cl8', type:'cloth', audience:'unisexe', name:'Casquette Mangue', cat:'Accessoire', price:7000, old:null, badge:null, colors:['#1C1C1C','#F57224'], img:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop', desc:'Casquette ajustable, broderie discrète.' }
];

// ===========================
// Firebase Realtime Database
// ===========================
const productsRef = firebase.database().ref('products');
const ordersRef = firebase.database().ref('orders');

productsRef.once('value').then(snapshot => {
  if(!snapshot.exists()){
    const seed = {};
    defaultProducts.forEach(p => { seed[p.id] = p; });
    productsRef.set(seed);
  }
}).catch(()=>{});

function subscribeToProducts(onChange){
  productsRef.on('value', snapshot => {
    const val = snapshot.val() || {};
    onChange(Object.values(val));
  });
}
function saveProductRemote(product){
  return productsRef.child(product.id).set(product);
}
function deleteProductRemote(id){
  return productsRef.child(id).remove();
}

function subscribeToOrders(onChange){
  ordersRef.on('value', snapshot => {
    const val = snapshot.val() || {};
    const list = Object.values(val).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    onChange(list);
  });
}
function saveOrderRemote(order){
  return ordersRef.child(order.id).set(order);
}
function updateOrderStatusRemote(id, status){
  return ordersRef.child(id).update({ status });
}
function bulkImportRemote(products, orders){
  const updates = {};
  (products || []).forEach(p => { if(p && p.id) updates['products/' + p.id] = p; });
  (orders || []).forEach(o => { if(o && o.id) updates['orders/' + o.id] = o; });
  return firebase.database().ref().update(updates);
}

function isAdminLoggedIn(){
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}
function genId(){
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}
function genOrderId(){
  return 'CHACHA-' + Date.now().toString().slice(-6);
}

function formatFCFA(n){
  return Number(n || 0).toLocaleString('fr-FR').replace(/,/g,' ') + ' FCFA';
}
function formatDate(iso){
  try{
    return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }catch(e){ return ''; }
}
function badgeClass(badge){
  if(badge === 'NOUVEAU') return 'new';
  if(badge === 'PROMO') return 'promo';
  return '';
}
function normalizePhone(phone){
  let digits = String(phone || '').replace(/\D/g, '');
  if(digits.startsWith('221') && digits.length > 9) digits = digits.slice(3);
  return digits;
}
function toInternationalPhone(phone){
  let digits = String(phone || '').replace(/\D/g, '');
  if(digits.startsWith('221')) return digits;
  return '221' + digits;
}