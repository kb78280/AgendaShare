import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DrawerNavigator from './navigation/DrawerNavigator';
import UserSetup from './components/UserSetup';
import firebaseService from './services/firebase';
import userService from './services/userService';
import eventService from './services/eventService';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initialisation de l\'application...');

      // Initialiser Firebase
      const firebaseInitialized = await firebaseService.initialize();
      if (!firebaseInitialized) {
        throw new Error('Échec de l\'initialisation de Firebase');
      }

      // FORCER l'utilisation du deviceId existant pour Kb
      await userService.setDeviceId('device_mgnuaf8p_wr0yggv66');

      // Initialiser le service utilisateur
      const userInit = await userService.initialize();
      setUser(userInit.user);
      setIsFirstTime(userInit.isFirstTime);

      if (userInit.user) {
        // Initialiser les autres services si l'utilisateur existe
        await eventService.initialize();
      }

      console.log('Application initialisée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      Alert.alert(
        'Erreur d\'initialisation',
        'Une erreur est survenue lors du démarrage de l\'application. Veuillez redémarrer l\'app.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = async (newUser) => {
    try {
      setUser(newUser);
      setIsFirstTime(false);
      
      // Initialiser les services maintenant que l'utilisateur existe
      await eventService.initialize();
      
      console.log('Services initialisés après création utilisateur');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'initialisation. Certaines fonctionnalités pourraient ne pas fonctionner correctement.',
        [{ text: 'OK' }]
      );
    }
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaProvider>
    );
  }

  // Écran de première connexion
  if (isFirstTime || !user) {
    return (
      <SafeAreaProvider>
        <UserSetup onUserCreated={handleUserCreated} />
        <StatusBar style="light" backgroundColor="#2196F3" />
      </SafeAreaProvider>
    );
  }

  // Application principale
  return (
    <SafeAreaProvider>
      <DrawerNavigator user={user} />
      <StatusBar style="light" backgroundColor="#2196F3" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
