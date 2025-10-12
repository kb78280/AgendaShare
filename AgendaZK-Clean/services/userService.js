import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import firebaseService from './firebase';

const USER_STORAGE_KEY = '@AgendaZK:user';
const DEVICE_ID_KEY = '@AgendaZK:deviceId';

class UserService {
  constructor() {
    this.currentUser = null;
    this.deviceId = null;
  }

  // Initialisation du service utilisateur
  async initialize() {
    try {
      // Récupérer ou générer l'ID de l'appareil
      this.deviceId = await this.getOrCreateDeviceId();
      
      console.log('Initialisation avec deviceId:', this.deviceId);
      
      // DEBUG: Lister tous les utilisateurs pour voir la structure
      await firebaseService.getAllUsers();
      
      // Vérifier si l'utilisateur existe déjà en Firebase avec ce deviceId
      const firebaseUser = await firebaseService.getUser(this.deviceId);
      if (firebaseUser) {
        console.log('Utilisateur existant trouvé en Firebase:', firebaseUser);
        this.currentUser = firebaseUser;
        await this.storeUser(firebaseUser);
        await firebaseService.updateUserLastActive(this.deviceId);
        return { user: this.currentUser, isFirstTime: false };
      }
      
      // Vérifier si l'utilisateur existe localement
      const storedUser = await this.getStoredUser();
      if (storedUser) {
        console.log('Utilisateur trouvé localement:', storedUser);
        // Vérifier si l'utilisateur existe toujours en base avec l'ancien système
        const firebaseUserByStored = await firebaseService.getUser(storedUser.id || storedUser.deviceId);
        if (firebaseUserByStored) {
          this.currentUser = firebaseUserByStored;
          await firebaseService.updateUserLastActive(this.deviceId);
          return { user: this.currentUser, isFirstTime: false };
        } else {
          // L'utilisateur a été supprimé de Firebase, nettoyer le stockage local
          await this.clearStoredUser();
        }
      }
      
      console.log('Aucun utilisateur existant trouvé, première connexion');
      return { user: null, isFirstTime: true };
    } catch (error) {
      console.error('Error initializing user service:', error);
      return { user: null, isFirstTime: true };
    }
  }

  // Récupérer ou créer l'ID de l'appareil
  async getOrCreateDeviceId() {
    try {
      // Vérifier d'abord le stockage local
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      
      if (deviceId) {
        console.log('ID d\'appareil existant trouvé:', deviceId);
        return deviceId;
      }
      
      // Si aucun ID n'existe, générer un nouvel ID unique et persistant
      try {
        // Utiliser l'ID d'installation Expo s'il est disponible
        const installationId = Constants.installationId || 'unknown';
        
        // Créer un ID unique mais simple
        const randomPart = Math.random().toString(36).substr(2, 9);
        
        // Format simple et prévisible
        deviceId = `device_${randomPart}_${installationId.substr(-8)}`;
      } catch (error) {
        console.warn('Erreur lors de la génération de l\'ID avec Expo:', error);
        // Fallback: générer un ID basé sur le timestamp et random
        const randomPart = Math.random().toString(36).substr(2, 9);
        deviceId = `device_${randomPart}_wr0yggv66`;
      }
      
      // S'assurer que l'ID n'est pas trop long
      if (deviceId.length > 50) {
        const randomPart = Math.random().toString(36).substr(2, 9);
        deviceId = `device_${randomPart}_wr0yggv66`;
      }
      
      // Stocker l'ID de façon permanente
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('Nouvel ID généré et stocké:', deviceId);
      
      return deviceId;
    } catch (error) {
      console.error('Error getting/creating device ID:', error);
      // Fallback final: utiliser un ID fixe pour ce développement
      const fallbackId = 'device_mgnuaf8p_wr0yggv66';
      try {
        await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
        console.log('Utilisation de l\'ID de fallback:', fallbackId);
      } catch (storageError) {
        console.error('Erreur lors du stockage de l\'ID de fallback:', storageError);
      }
      return fallbackId;
    }
  }

  // Méthode pour forcer un deviceId spécifique (utile pour le développement)
  async setDeviceId(deviceId) {
    try {
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      this.deviceId = deviceId;
      console.log('DeviceId forcé à:', deviceId);
      return deviceId;
    } catch (error) {
      console.error('Erreur lors de la définition du deviceId:', error);
      throw error;
    }
  }

  // Créer un nouvel utilisateur
  async createUser(username) {
    try {
      if (!username || username.trim().length === 0) {
        throw new Error('Le nom d\'utilisateur ne peut pas être vide');
      }

      const trimmedUsername = username.trim();
      
      // Vérifier que le nom d'utilisateur n'est pas déjà pris
      const existingUsers = await this.getAllUsers();
      const usernameExists = existingUsers.some(user => 
        user.username.toLowerCase() === trimmedUsername.toLowerCase()
      );
      
      if (usernameExists) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }

      // Créer l'utilisateur en Firebase
      const userData = await firebaseService.createUser(this.deviceId, trimmedUsername);
      
      // Stocker localement
      await this.storeUser(userData);
      this.currentUser = userData;
      
      return userData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Récupérer tous les utilisateurs (pour vérifier l'unicité des noms)
  async getAllUsers() {
    try {
      const snapshot = await getDocs(firebaseService.usersCollection);
      const users = [];
      snapshot.forEach(doc => {
        users.push(doc.data());
      });
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Stocker l'utilisateur localement
  async storeUser(userData) {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Récupérer l'utilisateur stocké localement
  async getStoredUser() {
    try {
      const storedData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  // Nettoyer le stockage local de l'utilisateur
  async clearStoredUser() {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      this.currentUser = null;
    } catch (error) {
      console.error('Error clearing stored user:', error);
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    return this.currentUser;
  }

  // Obtenir l'ID de l'appareil
  getDeviceId() {
    return this.deviceId;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Déconnexion (optionnel, pour des fonctionnalités futures)
  async logout() {
    try {
      await this.clearStoredUser();
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  // Mettre à jour le nom d'utilisateur
  async updateUsername(newUsername) {
    try {
      if (!this.currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }

      const trimmedUsername = newUsername.trim();
      
      // Vérifier que le nom d'utilisateur n'est pas déjà pris
      const existingUsers = await this.getAllUsers();
      const usernameExists = existingUsers.some(user => 
        user.username.toLowerCase() === trimmedUsername.toLowerCase() &&
        user.id !== this.currentUser.id
      );
      
      if (usernameExists) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
      }

      // Mettre à jour en Firebase
      const userRef = doc(firebaseService.usersCollection, this.deviceId);
      await updateDoc(userRef, {
        username: trimmedUsername,
        updatedAt: serverTimestamp(),
      });

      // Mettre à jour localement
      this.currentUser.username = trimmedUsername;
      await this.storeUser(this.currentUser);
      
      return this.currentUser;
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  }
}

// Instance singleton
const userService = new UserService();

export default userService;
