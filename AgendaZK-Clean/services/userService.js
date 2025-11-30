import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import firebaseService from './firebase';

class UserService {
  constructor() {
    this.currentUser = null;
    this.authUnsubscribe = null;
  }

  // Initialisation du service utilisateur
  initialize() {
    return new Promise((resolve) => {
      if (this.authUnsubscribe) {
        this.authUnsubscribe();
      }
      
      this.authUnsubscribe = onAuthStateChanged(firebaseService.auth, (user) => {
        if (user) {
          console.log('Utilisateur connecté:', user.uid);
          this.currentUser = user;
        } else {
          console.log('Aucun utilisateur connecté.');
          this.currentUser = null;
        }
        resolve(this.currentUser);
      });
    });
  }

  // Connexion de l'utilisateur
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseService.auth, email, password);
      this.currentUser = userCredential.user;
      return this.currentUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  // Déconnexion
  async signOut() {
    try {
      await signOut(firebaseService.auth);
      this.currentUser = null;
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    return this.currentUser;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn() {
    return this.currentUser !== null;
  }
}

// Instance singleton
const userService = new UserService();

export default userService;
