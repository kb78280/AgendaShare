import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchComponent({ visible, onClose, rappels, onSelectDate }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fonction pour rechercher dans tous les rappels
  const searchRappels = () => {
    if (!searchQuery.trim()) return [];
    
    const results = [];
    if (rappels && typeof rappels === 'object') {
      Object.keys(rappels).forEach(date => {
        if (rappels[date] && Array.isArray(rappels[date])) {
          rappels[date].forEach(rappel => {
            if (rappel && rappel.titre && rappel.titre.toLowerCase().includes(searchQuery.toLowerCase())) {
              results.push({
                ...rappel,
                date: date,
                dateFormatted: new Date(date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              });
            }
          });
        }
      });
    }
    
    return results;
  };

  const searchResults = searchRappels();

  const handleSelectResult = (result) => {
    onSelectDate(result.date);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.title}>Rechercher</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans vos rappels..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.resultsContainer}>
          {searchQuery.trim() === '' ? (
            <Text style={styles.emptyText}>Tapez pour rechercher dans vos rappels</Text>
          ) : searchResults.length === 0 ? (
            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => `${item.date}-${item.id}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectResult(item)}
                >
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>{item.titre}</Text>
                    <Text style={styles.resultDate}>{item.dateFormatted}</Text>
                    <Text style={styles.resultTime}>{item.heure}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d4150',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 2,
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
  },
});
