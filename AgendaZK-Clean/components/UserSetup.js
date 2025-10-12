import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import userService from '../services/userService';

export default function UserSetup({ onUserCreated }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateUser = async () => {
    if (!username.trim()) {
      setError('Veuillez saisir un nom d\'utilisateur');
      return;
    }

    if (username.trim().length < 2) {
      setError('Le nom d\'utilisateur doit contenir au moins 2 caractères');
      return;
    }

    if (username.trim().length > 20) {
      setError('Le nom d\'utilisateur ne peut pas dépasser 20 caractères');
      return;
    }

    // Vérifier les caractères autorisés
    const validUsernameRegex = /^[a-zA-Z0-9À-ÿ\s\-_]+$/;
    if (!validUsernameRegex.test(username.trim())) {
      setError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, espaces, tirets et underscores');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await userService.createUser(username.trim());
      console.log('Utilisateur créé:', user);
      
      Alert.alert(
        'Bienvenue !',
        `Bonjour ${user.username} ! Votre compte a été créé avec succès.`,
        [
          {
            text: 'Continuer',
            onPress: () => onUserCreated(user),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      setError(error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    if (error) {
      setError('');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={80} color="#2196F3" />
          </View>
          <Text style={styles.title}>Bienvenue dans AgendaZK</Text>
          <Text style={styles.subtitle}>
            Pour commencer, choisissez un nom d'utilisateur qui vous représente
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
            <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Votre nom d'utilisateur"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  clearError();
                }}
                maxLength={20}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleCreateUser}
                editable={!isLoading}
              />
              {username.length > 0 && (
                <TouchableOpacity
                  onPress={() => setUsername('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.characterCount}>
              {username.length}/20 caractères
            </Text>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Ce nom sera visible par l'autre utilisateur de l'application. 
              Vous pourrez le modifier plus tard si nécessaire.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              (!username.trim() || isLoading) && styles.createButtonDisabled
            ]}
            onPress={handleCreateUser}
            disabled={!username.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Créer mon compte</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En créant votre compte, vous acceptez de partager vos événements publics 
            avec l'autre utilisateur de cette application.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d4150',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d4150',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 12,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
