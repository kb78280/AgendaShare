import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../config/firebase';

class FirebaseService {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.eventsCollection = collection(this.db, 'events');
    this.usersCollection = collection(this.db, 'users');
  }

  // Configuration initiale
  async initialize() {
    try {
      // Activer la persistance pour Expo
      await enableNetwork(this.db);
      console.log('Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }

  // Gestion des utilisateurs
  async createUser(deviceId, username) {
    try {
      const userDoc = {
        id: deviceId,
        username: username,
        deviceId: deviceId,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      };

      const docRef = doc(this.usersCollection, deviceId);
      await updateDoc(docRef, userDoc).catch(async () => {
        // Si le document n'existe pas, le créer
        await addDoc(this.usersCollection, userDoc);
      });
      
      return userDoc;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(deviceId) {
    try {
      console.log('Recherche utilisateur avec deviceId:', deviceId);
      
      // Première tentative : rechercher par ID de document
      const userDocById = await getDoc(doc(this.usersCollection, deviceId));
      if (userDocById.exists()) {
        console.log('Utilisateur trouvé par ID de document:', userDocById.data());
        return userDocById.data();
      }
      
      // Deuxième tentative : rechercher par champ deviceId
      const userQuery = query(
        this.usersCollection, 
        where('deviceId', '==', deviceId)
      );
      const querySnapshot = await getDocs(userQuery);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('Utilisateur trouvé par champ deviceId:', userData);
        return userData;
      }
      
      // Troisième tentative : rechercher par champ id (ancien système)
      const userQueryById = query(
        this.usersCollection, 
        where('id', '==', deviceId)
      );
      const querySnapshotById = await getDocs(userQueryById);
      
      if (!querySnapshotById.empty) {
        const userData = querySnapshotById.docs[0].data();
        console.log('Utilisateur trouvé par champ id:', userData);
        return userData;
      }
      
      console.log('Aucun utilisateur trouvé avec deviceId:', deviceId);
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async updateUserLastActive(deviceId) {
    try {
      // Trouver d'abord l'utilisateur pour obtenir la bonne référence
      const user = await this.getUser(deviceId);
      if (!user) {
        console.log('Utilisateur non trouvé pour mise à jour lastActive:', deviceId);
        return;
      }
      
      // Essayer de mettre à jour par ID de document d'abord
      try {
        const userRef = doc(this.usersCollection, deviceId);
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
        });
        console.log('LastActive mis à jour par ID de document');
      } catch (error) {
        // Si échec, rechercher par query et mettre à jour
        const userQuery = query(
          this.usersCollection, 
          where('deviceId', '==', deviceId)
        );
        const querySnapshot = await getDocs(userQuery);
        
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            lastActive: serverTimestamp(),
          });
          console.log('LastActive mis à jour par query');
        }
      }
    } catch (error) {
      console.error('Error updating user last active:', error);
    }
  }

  // Méthode de debug pour lister tous les utilisateurs
  async getAllUsers() {
    try {
      const snapshot = await getDocs(this.usersCollection);
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          docId: doc.id,
          ...doc.data()
        });
      });
      console.log('Tous les utilisateurs en base:', users);
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Gestion des événements
  async createEvent(eventData) {
    try {
      const docRef = await addDoc(this.eventsCollection, {
        ...eventData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return { id: docRef.id, ...eventData };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId, eventData) {
    try {
      const eventRef = doc(this.eventsCollection, eventId);
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: serverTimestamp(),
      });
      
      return { id: eventId, ...eventData };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId) {
    try {
      const eventRef = doc(this.eventsCollection, eventId);
      await deleteDoc(eventRef);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }


  async getEventsByDateRange(startDate, endDate) {
    try {
      const q = query(
        this.eventsCollection,
        where('startDate', '>=', startDate),
        where('startDate', '<=', endDate),
        orderBy('startDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const events = [];
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error getting events by date range:', error);
      throw error;
    }
  }

  async getPublicEvents() {
    try {
      const q = query(
        this.eventsCollection,
        where('visibility', '==', 'public'),
        orderBy('startDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const events = [];
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error getting public events:', error);
      throw error;
    }
  }

  async getUserEvents(username) {
    try {
      const q = query(
        this.eventsCollection,
        where('createdBy', '==', username),
        orderBy('startDate', 'asc')
      );
      const snapshot = await getDocs(q);
      
      const events = [];
      snapshot.forEach(doc => {
        events.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }

  // Écouter les changements en temps réel
  subscribeToEvents(currentUserUid, callback) {
    if (!currentUserUid) {
      console.error("subscribeToEvents a été appelé sans UID utilisateur.");
      return () => {}; // Retourne une fonction de désinscription vide
    }

    console.log('🔵 Initialisation de subscribeToEvents pour user:', currentUserUid);

    let userEventsCache = [];
    let publicEventsCache = [];

    // Fonction pour fusionner et mettre à jour les événements
    const mergeAndUpdate = () => {
      const allEvents = new Map();
      
      console.log('📊 Fusion des événements:');
      console.log('  - Événements utilisateur:', userEventsCache.length);
      console.log('  - Événements publics:', publicEventsCache.length);
      
      // Ajouter les événements de l'utilisateur
      userEventsCache.forEach(event => {
        allEvents.set(event.id, event);
        console.log('  ✅ Ajout événement user:', event.title, '(owner:', event.ownerUid, ')');
      });
      
      // Ajouter les événements publics (seulement ceux qui ne sont pas déjà dans la map)
      publicEventsCache.forEach(event => {
        if (!allEvents.has(event.id)) {
          allEvents.set(event.id, event);
          console.log('  ✅ Ajout événement public:', event.title, '(owner:', event.ownerUid, ')');
        } else {
          console.log('  ⏭️  Événement déjà présent (ignoré):', event.title);
        }
      });
      
      // Convertir la Map en tableau et trier par date
      const sortedEvents = Array.from(allEvents.values()).sort((a, b) => {
        if (a.startDate < b.startDate) return -1;
        if (a.startDate > b.startDate) return 1;
        return 0;
      });
      
      console.log('✨ Total final:', sortedEvents.length, 'événements');
      callback(sortedEvents);
    };

    // Requête pour les événements de l'utilisateur (tous) - SANS orderBy
    const userEventsQuery = query(
      this.eventsCollection, 
      where('ownerUid', '==', currentUserUid)
    );

    // Requête pour TOUS les événements publics - SANS orderBy
    const publicEventsQuery = query(
      this.eventsCollection,
      where('visibility', '==', 'public')
    );

    const onError = (error) => {
      console.error('❌ Error listening to events:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
    };

    // S'abonner aux événements de l'utilisateur
    const unsubscribeUser = onSnapshot(userEventsQuery, (snapshot) => {
      console.log('🔄 Mise à jour événements utilisateur, nombre:', snapshot.docs.length);
      userEventsCache = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('  📝 Event user:', data.title, 'visibility:', data.visibility, 'owner:', data.ownerUid);
        return {
          id: doc.id,
          ...data,
        };
      });
      mergeAndUpdate();
    }, onError);

    // S'abonner aux événements publics
    const unsubscribePublic = onSnapshot(publicEventsQuery, (snapshot) => {
      console.log('🔄 Mise à jour événements publics, nombre:', snapshot.docs.length);
      publicEventsCache = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('  📝 Event public:', data.title, 'visibility:', data.visibility, 'owner:', data.ownerUid);
        return {
          id: doc.id,
          ...data,
        };
      });
      mergeAndUpdate();
    }, onError);

    // Retourner une fonction pour se désabonner des deux listeners
    return () => {
      console.log('🔴 Désinscription des listeners pour user:', currentUserUid);
      unsubscribeUser();
      unsubscribePublic();
    };
  }
}

// Instance singleton
const firebaseService = new FirebaseService();

export default firebaseService;
