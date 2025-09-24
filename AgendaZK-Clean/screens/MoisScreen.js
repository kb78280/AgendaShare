import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  BackHandler,
  Animated,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SearchComponent from '../components/SearchComponent';

// Configuration de la locale française pour le calendrier
LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  monthNamesShort: [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

export default function MoisScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM-01'));
  const [rappels, setRappels] = useState({
    [format(new Date(), 'yyyy-MM-dd')]: [
      { id: 1, titre: 'Réunion équipe', heure: '10:00' },
      { id: 2, titre: 'Appel client', heure: '14:30' },
    ]
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRappelText, setNewRappelText] = useState('');
  
  // Animation pour le changement de mois avec effet flip 3D
  const rotateYAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Gestion du bouton retour Android pour le modal
  React.useEffect(() => {
    const backAction = () => {
      if (showAddModal) {
        setShowAddModal(false);
        return true; // Empêche le comportement par défaut
      }
      return false; // Laisse le comportement par défaut
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [showAddModal]);

  useLayoutEffect(() => {
    const dateString = format(new Date(), 'EEE d MMM', { locale: fr });
    
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{dateString}</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
      headerTitle: '',
    });
  }, [navigation]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month) => {
    // Vibration légère pour le feedback tactile
    try {
      Vibration.vibrate(15);
    } catch (error) {
      // Ignore si la vibration n'est pas supportée
    }
    
    // Animation de flip 3D spectaculaire lors du changement de mois
    Animated.sequence([
      // Phase 1: Rotation vers l'arrière avec zoom out
      Animated.parallel([
        Animated.timing(rotateYAnim, {
          toValue: 1, // 90 degrés
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Changement de contenu (au milieu du flip)
      Animated.timing(rotateYAnim, {
        toValue: 2, // 180 degrés
        duration: 0,
        useNativeDriver: true,
      }),
      // Phase 3: Rotation vers l'avant avec zoom in
      Animated.parallel([
        Animated.spring(rotateYAnim, {
          toValue: 4, // 360 degrés (retour à 0)
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Reset à 0 après l'animation
      rotateYAnim.setValue(0);
    });
    
    setCurrentMonth(month.dateString);
  };

  const ajouterRappel = () => {
    if (newRappelText.trim()) {
      const newRappel = {
        id: Date.now(),
        titre: newRappelText.trim(),
        heure: format(new Date(), 'HH:mm'),
      };
      
      setRappels(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), newRappel]
      }));
      
      setNewRappelText('');
      setShowAddModal(false);
    }
  };

  const supprimerRappel = (rappelId) => {
    Alert.alert(
      'Supprimer le rappel',
      'Êtes-vous sûr de vouloir supprimer ce rappel ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setRappels(prev => ({
              ...prev,
              [selectedDate]: prev[selectedDate]?.filter(r => r.id !== rappelId) || []
            }));
          },
        },
      ]
    );
  };

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#2196F3',
    },
    ...Object.keys(rappels).reduce((acc, date) => {
      if (rappels[date] && rappels[date].length > 0 && date !== selectedDate) {
        acc[date] = { marked: true, dotColor: '#2196F3' };
      }
      return acc;
    }, {}),
  };

  const rappelsDuJour = rappels[selectedDate] || [];

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Animated.View 
          style={[
            styles.calendarContainer,
            {
              transform: [
                { 
                  rotateY: rotateYAnim.interpolate({
                    inputRange: [0, 1, 2, 3, 4],
                    outputRange: ['0deg', '90deg', '180deg', '270deg', '360deg'],
                  })
                },
                { scale: scaleAnim },
                { perspective: 1000 }
              ],
              shadowOpacity: scaleAnim.interpolate({
                inputRange: [0.8, 1],
                outputRange: [0.4, 0.2],
              }),
              elevation: scaleAnim.interpolate({
                inputRange: [0.8, 1],
                outputRange: [12, 8],
              }),
            },
          ]}
        >
        <Calendar
          current={currentMonth}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          enableSwipeMonths={true}
          hideExtraDays={false}
          showWeekNumbers={false}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#8e8e93',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d1d1d6',
            dotColor: '#2196F3',
            selectedDotColor: '#ffffff',
            arrowColor: '#2196F3',
            disabledArrowColor: '#d1d1d6',
            monthTextColor: '#2d4150',
            indicatorColor: '#2196F3',
            textDayFontWeight: '400',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 12,
            'stylesheet.calendar.header': {
              monthText: {
                fontSize: 18,
                fontWeight: '700',
                color: '#2d4150',
                margin: 10,
              },
              arrow: {
                padding: 10,
                margin: 0,
              },
              week: {
                marginTop: 5,
                marginBottom: 5,
                flexDirection: 'row',
                justifyContent: 'space-around',
              },
            },
            'stylesheet.day.basic': {
              base: {
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              },
              selected: {
                backgroundColor: '#2196F3',
                borderRadius: 16,
                elevation: 3,
                shadowColor: '#2196F3',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              },
              today: {
                borderColor: '#2196F3',
                borderWidth: 2,
                borderRadius: 16,
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
              },
              text: {
                fontSize: 16,
                fontWeight: '500',
                color: '#2d4150',
              },
            },
          }}
          style={styles.calendar}
          monthFormat={'MMMM yyyy'}
          hideArrows={false}
          renderArrow={(direction) => (
            <TouchableOpacity style={styles.arrowContainer}>
              <Ionicons 
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} 
                size={22} 
                color="#2196F3" 
              />
            </TouchableOpacity>
          )}
        />
        </Animated.View>
      </View>

      <View style={styles.divider} />

      <View style={styles.daySection}>
        <Text style={styles.daySectionTitle}>
          {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
        </Text>
        
        <ScrollView style={styles.rappelsList}>
          {rappelsDuJour.length === 0 ? (
            <Text style={styles.noRappelsText}>Aucun rappel pour ce jour</Text>
          ) : (
            rappelsDuJour.map((rappel) => (
              <View key={rappel.id} style={styles.rappelItem}>
                <View style={styles.rappelContent}>
                  <Text style={styles.rappelTitre}>{rappel.titre}</Text>
                  <Text style={styles.rappelHeure}>{rappel.heure}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => supprimerRappel(rappel.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.addButton, { marginBottom: insets.bottom + 16 }]} 
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Ajouter un rappel</Text>
        </TouchableOpacity>
      </View>

      {/* Modal d'ajout de rappel */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowAddModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#2196F3" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau rappel</Text>
            <TouchableOpacity 
              onPress={ajouterRappel}
              style={styles.modalSaveButton}
            >
              <Text style={styles.modalSaveText}>Sauver</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalDateText}>
              {format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Titre du rappel..."
              value={newRappelText}
              onChangeText={setNewRappelText}
              autoFocus
              multiline
            />
          </View>
        </View>
      </Modal>

      <SearchComponent
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        rappels={rappels}
        onSelectDate={(date) => setSelectedDate(date)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
    textTransform: 'capitalize',
  },
  calendarWrapper: {
    perspective: 1000,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backfaceVisibility: 'hidden',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  arrowContainer: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    margin: 5,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  daySection: {
    flex: 1,
    padding: 16,
  },
  daySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  rappelsList: {
    flex: 1,
  },
  noRappelsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  rappelItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  rappelContent: {
    flex: 1,
  },
  rappelTitre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  rappelHeure: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Styles pour le modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  modalDateText: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
