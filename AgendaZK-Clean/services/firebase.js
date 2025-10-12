import { initializeApp } from 'firebase/app';
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
      const userDoc = await getDoc(doc(this.usersCollection, deviceId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async updateUserLastActive(deviceId) {
    try {
      const userRef = doc(this.usersCollection, deviceId);
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user last active:', error);
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
  subscribeToEvents(callback) {
    const q = query(this.eventsCollection, orderBy('startDate', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const events = [];
        snapshot.forEach(doc => {
          events.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        callback(events);
      },
      (error) => {
        console.error('Error listening to events:', error);
      }
    );
  }
}

// Instance singleton
const firebaseService = new FirebaseService();

export default firebaseService;
