// Configuration Firebase pour React Native
// Ce fichier doit être configuré avec vos propres clés Firebase

const firebaseConfig = {
  // Remplacez ces valeurs par celles de votre projet Firebase
  apiKey: "AIzaSyBL4k9GLBtmrbm1drVumrQDyfubJqeTYy0",
  authDomain: "agendazk-9902f.firebaseapp.com",
  projectId: "agendazk-9902f",
  storageBucket: "agendazk-9902f.firebasestorage.app",
  messagingSenderId: "227551142831",
  appId: "1:227551142831:web:c3d36f1d798c2b5ae4855a",
  measurementId: "G-60KRKR0YYM"
  
  // Pour le développement local, vous pouvez utiliser l'émulateur
  // Décommentez les lignes suivantes pour utiliser l'émulateur Firestore
  // host: 'localhost:8080',
  // ssl: false
};

export default firebaseConfig;

// Instructions de configuration :
// 1. Créez un projet Firebase sur https://console.firebase.google.com/
// 2. Ajoutez une application Android/iOS
// 3. Téléchargez google-services.json (Android) et GoogleService-Info.plist (iOS)
// 4. Placez ces fichiers dans les dossiers appropriés de votre projet
// 5. Remplacez les valeurs ci-dessus par celles de votre projet
// 6. Activez Firestore Database dans la console Firebase
// 7. Configurez les règles de sécurité Firestore selon vos besoins

/* Exemple de règles Firestore pour ce projet :
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre la lecture et l'écriture pour tous les utilisateurs authentifiés
    // (Dans un vrai projet, vous devriez avoir des règles plus restrictives)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
*/
