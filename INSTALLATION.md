# Configuration et Installation - AgendaZK Enhanced

## 🚀 Installation des Dépendances

Après avoir cloné le projet, installez les nouvelles dépendances :

```bash
cd AgendaZK-Clean
npm install
```

### Nouvelles dépendances ajoutées :
- `@react-native-firebase/app` - Core Firebase
- `@react-native-firebase/firestore` - Base de données Firestore
- `@react-native-async-storage/async-storage` - Stockage local
- `react-native-device-info` - Informations de l'appareil
- `expo-notifications` - Notifications locales
- `react-native-slider` - Composant slider pour les notifications

## 🔥 Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet appelé "AgendaZK" (ou le nom de votre choix)
3. Activez Firestore Database
4. Configurez les règles de sécurité (voir ci-dessous)

### 2. Configuration pour React Native

1. Dans votre projet Firebase, ajoutez une application :
   - Pour Android : Ajoutez une app Android
   - Pour iOS : Ajoutez une app iOS

2. Téléchargez les fichiers de configuration :
   - **Android** : `google-services.json` → placez dans `android/app/`
   - **iOS** : `GoogleService-Info.plist` → placez dans `ios/AgendaZK/`

3. Modifiez le fichier `config/firebase.js` avec vos clés :

```javascript
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "votre-sender-id",
  appId: "votre-app-id"
};
```

### 3. Règles de sécurité Firestore

Dans la console Firebase > Firestore Database > Rules, utilisez ces règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection des utilisateurs
    match /users/{userId} {
      allow read, write: if true;
    }
    
    // Collection des événements
    match /events/{eventId} {
      allow read, write: if true;
    }
  }
}
```

## 📱 Configuration des Notifications

### Android
Ajoutez dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### iOS
Les notifications sont gérées automatiquement par Expo.

## 🏗️ Structure des Collections Firestore

### Collection `users`
```javascript
{
  id: "device_id_unique",
  username: "nom_utilisateur",
  deviceId: "device_id_unique", 
  createdAt: timestamp,
  lastActive: timestamp
}
```

### Collection `events`
```javascript
{
  id: "event_uuid",
  title: "Titre de l'événement",
  type: "single_day" | "date_range",
  startDate: "2024-01-15", // Format YYYY-MM-DD
  endDate: "2024-01-20" | null,
  startTime: "14:30" | null,
  endTime: "16:00" | null,
  isAllDay: boolean,
  notifications: [
    {
      type: "at_event" | "before",
      value: 10, // 1-100
      unit: "minutes" | "hours" | "days" | "weeks"
    }
  ],
  visibility: "public" | "private",
  createdBy: "nom_utilisateur",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🔧 Développement

### Démarrer l'application
```bash
npm start
```

### Mode développement avec émulateur Firebase (optionnel)
1. Installez Firebase CLI : `npm install -g firebase-tools`
2. Connectez-vous : `firebase login`
3. Démarrez l'émulateur : `firebase emulators:start`
4. Modifiez `config/firebase.js` pour pointer vers l'émulateur

## ✨ Nouvelles Fonctionnalités

### 🎯 Gestion d'Événements Avancée
- **Types d'événements** : Jour unique ou période
- **Horaires flexibles** : Journée entière ou créneaux spécifiques
- **Visibilité** : Public (partagé) ou privé

### 🔔 Notifications Personnalisées
- **Prédéfinies** : Au moment, 10min, 1h, 1 jour avant
- **Personnalisées** : 1-100 avec unité (min, h, jours, semaines)
- **Multiples** : Plusieurs notifications par événement

### 👥 Gestion Utilisateur
- **Première connexion** : Choix du nom d'utilisateur
- **Identification** : Device ID + nom choisi
- **Pas de mot de passe** : Sécurisé par l'appareil

### 📅 Affichage Calendrier Amélioré
- **Barres continues** : Événements multi-jours
- **Indicateurs visuels** : Public (bleu) vs Privé (orange)
- **Notifications** : Icône si rappels configurés

## 🐛 Dépannage

### Erreur Firebase
- Vérifiez la configuration dans `config/firebase.js`
- Assurez-vous que Firestore est activé
- Vérifiez les règles de sécurité

### Erreur de build
- Nettoyez le cache : `expo r -c`
- Réinstallez les dépendances : `rm -rf node_modules && npm install`

### Notifications ne fonctionnent pas
- Vérifiez les permissions dans les paramètres de l'appareil
- Testez avec `notificationService.testNotification()`

## 📊 Tests

### Tester les notifications
```javascript
import notificationService from './services/notificationService';
notificationService.testNotification();
```

### Tester la création d'événement
1. Ouvrez l'app
2. Sélectionnez une date
3. Appuyez sur "Ajouter un événement"
4. Remplissez le formulaire
5. Vérifiez dans Firebase Console

## 🚀 Déploiement

### Build de production
```bash
# Android
expo build:android

# iOS  
expo build:ios
```

### Publication
```bash
expo publish
```

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de la console
2. Consultez la documentation Firebase
3. Vérifiez les permissions de l'appareil

Bon développement ! 🎉
