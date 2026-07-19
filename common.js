// ===========================
// CHACHA — Données & utilitaires partagés
// Ce fichier est chargé par index.html (boutique) ET admin.html (espace admin),
// APRÈS le SDK Firebase et firebase-config.js. Produits et commandes sont
// stockés dans Firebase Realtime Database : tout ajout/suppression/
// modification faite sur un appareil apparaît automatiquement sur tous les
// autres, en temps réel, sans rien exporter/importer.
// ===========================

const WHATSAPP_NUMBER = '221771767071'; // format international sans + ni espaces

// ⚠️ NOTE SÉCURITÉ — à lire avant mise en production
// Le catalogue de produits et les commandes vivent maintenant dans une base
// de données partagée dans le cloud (Firebase Realtime Database) : c'est ce
// qui permet la synchronisation automatique entre appareils.
// Deux points importants à connaître :
//  1) Le mot de passe admin ci-dessous n'est vérifié que dans le navigateur
//     (il n'y a pas de vrai compte utilisateur) — n'importe qui inspectant
//     le code source peut le voir.
//  2) Tant que les règles de sécurité Firebase sont en "mode test" (lecture/
//     écriture ouvertes à tous), toute personne connaissant l'adresse de ta
//     base de données pourrait, en théorie, la modifier directement en
//     contournant le mot de passe admin. Le mode test expire aussi
//     automatiquement au bout de 30 jours (la base devient alors bloquée en
//     lecture ET écriture tant que les règles ne sont pas mises à jour dans
//     la console Firebase). Pour un site avec de vraies commandes de
//     clients, il est recommandé de passer à des règles plus strictes
//     (idéalement avec Firebase Authentication) — demande-moi si tu veux
//     qu'on les mette en place.
const ADMIN_PASSWORD = 'chacha2026';
const ADMIN_SESSION_KEY = 'chacha_admin_session';

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
// Catalogue par défaut — sert uniquement à "amorcer" la base de données la
// toute première fois qu'elle est vide (premier lancement du site).
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
// Connexion Firebase Realtime Database
// (`firebase` et la config viennent des <script> chargés avant ce fichier :
// SDK Firebase, puis firebase-config.js)
// ===========================
const productsRef = firebase.database().ref('products');
const ordersRef = firebase.database().ref('orders');

// Amorce la base avec le catalogue par défaut si elle est encore complètement
// vide (ne se déclenche qu'une seule fois, la toute première fois que
// quelqu'un ouvre le site après la mise en place de Firebase).
productsRef.once('value').then(snapshot => {
  if(!snapshot.exists()){
    const seed = {};
    defaultProducts.forEach(p => { seed[p.id] = p; });
    productsRef.set(seed);
  }
}).catch(()=>{ /* Firebase pas encore configuré — voir firebase-config.js */ });

// ---------- Produits : lecture en temps réel + écriture ----------
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

// ---------- Commandes : lecture en temps réel + écriture ----------
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
// Écrit plusieurs produits/commandes d'un coup (utilisé par l'import de sauvegarde) :
// fusionne avec ce qui existe déjà (remplace les éléments avec le même id).
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