// ===========================
// CHACHA — Données & utilitaires partagés
// Ce fichier est chargé par index.html (boutique) ET admin.html (espace admin)
// pour que les deux pages travaillent avec exactement les mêmes données/règles.
// ===========================

const WHATSAPP_NUMBER = '221771767071'; // format international sans + ni espaces

// ⚠️ NOTE SÉCURITÉ / LIMITES — à lire avant mise en production
// Ce mot de passe admin, le catalogue de produits ET les commandes sont
// gérés uniquement côté navigateur (localStorage), il n'y a pas de serveur.
// Conséquences importantes :
//  1) N'importe qui inspectant le code source peut voir ce mot de passe.
//  2) Les commandes passées par un client depuis SON navigateur ne sont
//     visibles dans l'espace admin QUE si l'admin ouvre ce même site depuis
//     LE MÊME appareil/navigateur que celui du client (pas de synchronisation
//     entre appareils différents). Pareil pour les produits ajoutés par l'admin.
// Pour un vrai site en production, avec de vrais clients sur leurs propres
// téléphones et un admin qui doit voir TOUTES les commandes depuis son propre
// appareil, il faut un petit backend (base de données partagée) qui stocke
// produits et commandes côté serveur — localStorage ne peut pas remplacer ça.
const ADMIN_PASSWORD = 'chacha2026';
const ADMIN_SESSION_KEY = 'chacha_admin_session';
const PRODUCTS_STORAGE_KEY = 'chacha_products';
const ORDERS_STORAGE_KEY = 'chacha_orders';

// ===========================
// Statuts de commande
// ===========================
const ORDER_STATUSES = [
  { key:'nouvelle',    label:'Nouvelle commande',    color:'#F57224' },
  { key:'contactee',   label:'Client contacté',      color:'#6B7280' },
  { key:'confirmee',   label:'Paiement confirmé',    color:'#2563EB' },
  { key:'preparation', label:'En préparation',       color:'#7C3AED' },
  { key:'livraison',   label:'En cours de livraison',color:'#0EA5E9' },
  { key:'livree',      label:'Livrée',                color:'#22B159' },
  { key:'annulee',     label:'Annulée',               color:'#DC2626' }
];
// Ordre "positif" utilisé pour la frise de suivi (la commande annulée est traitée à part)
const TIMELINE_STEPS = ['nouvelle','contactee','confirmee','preparation','livraison','livree'];

function getStatusMeta(key){
  return ORDER_STATUSES.find(s => s.key === key) || ORDER_STATUSES[0];
}

// ===========================
// Données produits par défaut
// ===========================
const defaultProducts = [
  // --- Chaussures ---
  { id:'sh1', type:'shoe', name:'ZENITH Mangue', cat:'Sneaker basse', price:25000, old:null, badge:'BEST-SELLER', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop' },
  { id:'sh2', type:'shoe', name:'OASIS Turquoise', cat:'Sneaker haute', price:32000, old:39000, badge:'PROMO', colors:['#1C1C1C','#6B7280'], img:'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=800&auto=format&fit=crop' },
  { id:'sh3', type:'shoe', name:'SAFRAN Runner', cat:'Running', price:28000, old:null, badge:'NOUVEAU', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop' },
  { id:'sh4', type:'shoe', name:'DUNE Slip-on', cat:'Sneaker basse', price:21000, old:null, badge:null, colors:['#1C1C1C','#F57224'], img:'https://images.unsplash.com/photo-1465479423260-c4afc24172c6?q=80&w=800&auto=format&fit=crop' },
  { id:'sh5', type:'shoe', name:'FUCHSIA High', cat:'Sneaker haute', price:34000, old:null, badge:'NOUVEAU', colors:['#1C1C1C','#6B7280'], img:'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop' },
  { id:'sh6', type:'shoe', name:'SAVANE Trail', cat:'Outdoor', price:30000, old:36000, badge:'PROMO', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop' },
  { id:'sh7', type:'shoe', name:'COTON Canvas', cat:'Sneaker basse', price:18000, old:null, badge:null, colors:['#E5E7EB','#1C1C1C'], img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop' },
  { id:'sh8', type:'shoe', name:'MÉTRO Chelsea', cat:'Boot', price:37000, old:null, badge:null, colors:['#1C1C1C'], img:'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=800&auto=format&fit=crop' },
  // --- Vêtements ---
  { id:'cl1', type:'cloth', name:'Hoodie Oversize Mangue', cat:'Sweat', price:16000, old:null, badge:'BEST-SELLER', colors:['#F57224','#1C1C1C'], img:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop' },
  { id:'cl2', type:'cloth', name:'Veste Cargo Safran', cat:'Veste', price:24000, old:29000, badge:'PROMO', colors:['#F57224','#6B7280'], img:'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop' },
  { id:'cl3', type:'cloth', name:'Tee Chacha Basique', cat:'T-shirt', price:8000, old:null, badge:null, colors:['#1C1C1C','#E5E7EB'], img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop' },
  { id:'cl4', type:'cloth', name:'Pantalon Cargo Nuit', cat:'Pantalon', price:19000, old:null, badge:'NOUVEAU', colors:['#1C1C1C','#6B7280'], img:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800&auto=format&fit=crop' },
  { id:'cl5', type:'cloth', name:'Blouson Technique', cat:'Veste', price:33000, old:null, badge:'NOUVEAU', colors:['#1C1C1C','#F57224'], img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop' },
  { id:'cl6', type:'cloth', name:'Sweat Col Zip', cat:'Sweat', price:17000, old:null, badge:null, colors:['#6B7280','#1C1C1C'], img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop' },
  { id:'cl7', type:'cloth', name:'Short Toile Safran', cat:'Short', price:11000, old:13500, badge:'PROMO', colors:['#F57224'], img:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=800&auto=format&fit=crop' },
  { id:'cl8', type:'cloth', name:'Casquette Mangue', cat:'Accessoire', price:7000, old:null, badge:null, colors:['#1C1C1C','#F57224'], img:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop' }
];

// ===========================
// Persistance (localStorage)
// ===========================
function loadProducts(){
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if(stored){
    try{
      const parsed = JSON.parse(stored);
      if(Array.isArray(parsed)) return parsed;
    }catch(e){ /* stockage corrompu, on retombe sur les valeurs par défaut */ }
  }
  return JSON.parse(JSON.stringify(defaultProducts));
}
function persistProducts(products){
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

function loadOrders(){
  const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if(stored){
    try{
      const parsed = JSON.parse(stored);
      if(Array.isArray(parsed)) return parsed;
    }catch(e){ /* stockage corrompu */ }
  }
  return [];
}
function persistOrders(orders){
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
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

// ===========================
// Utilitaires d'affichage
// ===========================
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
// Normalise un numéro pour comparaison (garde uniquement les chiffres, retire l'indicatif 221 si présent)
function normalizePhone(phone){
  let digits = String(phone || '').replace(/\D/g, '');
  if(digits.startsWith('221') && digits.length > 9) digits = digits.slice(3);
  return digits;
}
// Construit un numéro international (221...) à partir d'un numéro saisi localement
function toInternationalPhone(phone){
  let digits = String(phone || '').replace(/\D/g, '');
  if(digits.startsWith('221')) return digits;
  return '221' + digits;
}