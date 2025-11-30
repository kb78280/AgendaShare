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

  async getEvents() {
    try {
      const q = query(this.eventsCollection, orderBy('startDate', 'asc'));
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
      console.error('Error getting events:', error);
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

    // Requête pour les événements de l'utilisateur
    const userEventsQuery = query(
      this.eventsCollection, 
      where('ownerUid', '==', currentUserUid),
      orderBy('startDate', 'asc')
    );

    // Requête pour les événements publics des autres utilisateurs
    const publicEventsQuery = query(
      this.eventsCollection,
      where('ownerUid', '!=', currentUserUid),
      where('visibility', '==', 'public'),
      orderBy('startDate', 'asc')
    );

    const unsubscribes = [];
    let allEvents = new Map();

    const processSnapshot = (snapshot) => {
      snapshot.docs.forEach(doc => {
        allEvents.set(doc.id, {
          id: doc.id,
          ...doc.data(),
        });
      });
      // Convertir la Map en tableau et trier
      const sortedEvents = Array.from(allEvents.values()).sort((a, b) => {
        if (a.startDate < b.startDate) return -1;
        if (a.startDate > b.startDate) return 1;
        return 0;
      });
      callback(sortedEvents);
    };

    const onError = (error) => {
      console.error('Error listening to events:', error);
    };

    // S'abonner aux deux requêtes
    unsubscribes.push(onSnapshot(userEventsQuery, processSnapshot, onError));
    unsubscribes.push(onSnapshot(publicEventsQuery, processSnapshot, onError));

    // Retourner une fonction pour se désabonner des deux listeners
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }
}

// Instance singleton
const firebaseService = new FirebaseService();

export default firebaseService;
