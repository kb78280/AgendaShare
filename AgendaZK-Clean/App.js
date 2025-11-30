import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DrawerNavigator from './navigation/DrawerNavigator';
import LoginScreen from './screens/LoginScreen'; // Importer LoginScreen
import firebaseService from './services/firebase';
import userService from './services/userService';
import eventService from './services/eventService';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initialisation de l\'application...');
      
      // L'initialisation de Firebase se fait dans le constructeur de son service
      
      // Vérifier l'état de l'authentification
      const currentUser = await userService.initialize();
      setUser(currentUser);
      
      if (currentUser) {
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

  const handleLoginSuccess = async (loggedInUser) => {
    try {
      setUser(loggedInUser);
      await eventService.initialize();
      console.log('Services initialisés après connexion');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services après connexion:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser les données de l\'agenda.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {user ? (
        <DrawerNavigator user={user} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
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
