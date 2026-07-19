// ===========================
// CHACHA — Configuration Firebase
// ===========================
// Ce fichier connecte le site à TA propre base de données partagée, pour que
// produits et commandes se synchronisent automatiquement sur tous les
// appareils. Sans cette étape, le site ne pourra pas se synchroniser.
//
// ÉTAPES (10 minutes, gratuit) :
//
// 1) Va sur https://console.firebase.google.com et connecte-toi avec un
//    compte Google. Clique "Ajouter un projet", donne-lui un nom (ex : chacha),
//    puis termine la création (tu peux désactiver Google Analytics, pas utile ici).
//
// 2) Dans le menu de gauche : "Compilation" (Build) → "Realtime Database".
//    Clique "Créer une base de données". Choisis un emplacement proche
//    (ex : Europe/Belgique), puis démarre en "Mode test" (règles ouvertes
//    30 jours — voir la note de sécurité dans common.js pour la suite).
//
// 3) Toujours dans la console, clique sur la roue crantée ⚙️ (en haut à
//    gauche, à côté de "Aperçu du projet") → "Paramètres du projet".
//    Descends jusqu'à "Vos applications", clique sur l'icône web ( </> ),
//    donne un nom à l'app (ex : chacha-web), puis "Enregistrer l'application".
//    Un bloc de code "firebaseConfig" apparaît : copie-le.
//
// 4) Colle ci-dessous, à la place de l'exemple, les valeurs copiées à
//    l'étape 3 (apiKey, authDomain, databaseURL, etc.).
//
// 5) Enregistre ce fichier, puis recharge index.html et admin.html : la
//    synchronisation démarre aussitôt sur tous les appareils qui ouvrent
//    le site.

const firebaseConfig = {
  apiKey: "AIzaSyATYD9KmNL9xYjDsJfwDtAx4dJCdQyJDFo",
  authDomain: "chacha-shop-vip.firebaseapp.com",
  databaseURL: "https://chacha-shop-vip-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chacha-shop-vip",
  storageBucket: "chacha-shop-vip.firebasestorage.app",
  messagingSenderId: "623298392456",
  appId: "1:623298392456:web:2c721e8cab2b227243ca3d"
};

firebase.initializeApp(firebaseConfig);