import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JourScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentDay, setCurrentDay] = useState(new Date());

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
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
      headerTitle: '',
    });
  }, [navigation]);

  const goToPreviousDay = () => {
    setCurrentDay(subDays(currentDay, 1));
  };

  const goToNextDay = () => {
    setCurrentDay(addDays(currentDay, 1));
  };

  const goToToday = () => {
    setCurrentDay(new Date());
  };

  const isToday = format(currentDay, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Exemples de rappels pour la démonstration
  const rappelsDuJour = [
    { id: 1, titre: 'Réunion équipe', heure: '09:00', duree: 60 },
    { id: 2, titre: 'Appel client', heure: '14:30', duree: 30 },
    { id: 3, titre: 'Formation React', heure: '16:00', duree: 120 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.dayHeader}>
        <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        
        <View style={styles.dayInfo}>
          <Text style={styles.dayTitle}>
            {format(currentDay, 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
          {!isToday && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Aujourd'hui</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.timeSlots} showsVerticalScrollIndicator={false}>
        {Array.from({ length: 24 }, (_, hour) => {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          const rappelsHeure = rappelsDuJour.filter(rappel => rappel.heure.startsWith(hour.toString().padStart(2, '0')));
          
          return (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeText}>{timeSlot}</Text>
              <View style={styles.eventArea}>
                {rappelsHeure.map(rappel => (
                  <TouchableOpacity key={rappel.id} style={styles.eventItem}>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{rappel.titre}</Text>
                      <Text style={styles.eventTime}>
                        {rappel.heure} - {rappel.duree} min
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.addButton, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('Mois')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    padding: 8,
  },
  dayInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#2196F3',
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeSlots: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeText: {
    width: 60,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingTop: 8,
    backgroundColor: '#fafafa',
  },
  eventArea: {
    flex: 1,
    padding: 8,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
});
