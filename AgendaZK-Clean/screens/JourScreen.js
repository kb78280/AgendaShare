import React, { useLayoutEffect, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import eventService from '../services/eventService';
import DateUtils from '../utils/dateUtils';

export default function JourScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentDay, setCurrentDay] = useState(new Date());
  const [events, setEvents] = useState([]);

  useLayoutEffect(() => {
    const dateString = format(new Date(), 'EEE d MMM', { locale: fr });
    
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{dateString}</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
      headerTitle: 'Jour',
    });
  }, [navigation]);

  // Écouter les changements d'événements
  useEffect(() => {
    const unsubscribe = eventService.addListener((newEvents) => {
      setEvents(newEvents);
    });

    return () => unsubscribe();
  }, []);

  // Filtrer les événements du jour
  const dayEvents = useMemo(() => {
    const dayKey = format(currentDay, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;
      
      return format(eventStart, 'yyyy-MM-dd') <= dayKey && 
             format(eventEnd, 'yyyy-MM-dd') >= dayKey;
    });
  }, [events, currentDay]);

  // Organiser les événements par heure
  const organizeEventsByHour = useMemo(() => {
    const organized = {};
    
    // Initialiser chaque heure
    for (let hour = 0; hour < 24; hour++) {
      organized[hour] = [];
    }

    dayEvents.forEach(event => {
      if (event.isAllDay) {
        // Événement toute la journée - l'ajouter à 8h par défaut
        organized[8].push(event);
      } else if (event.startTime) {
        const hour = parseInt(event.startTime.split(':')[0]);
        if (hour >= 0 && hour < 24) {
          organized[hour].push(event);
        }
      }
    });

    return organized;
  }, [dayEvents]);

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
          const hourEvents = organizeEventsByHour[hour] || [];
          
          return (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeText}>{timeSlot}</Text>
              <View style={styles.eventArea}>
                {hourEvents.map(event => (
                  <TouchableOpacity 
                    key={event.id} 
                    style={[
                      styles.eventItem,
                      event.visibility === 'private' && styles.privateEventItem
                    ]}
                  >
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {event.isAllDay ? 'Journée entière' : 
                         event.startTime + (event.endTime ? ` - ${event.endTime}` : '')}
                        {event.type === 'date_range' && (
                          <Text style={styles.eventDates}>
                            {' '}(Du {DateUtils.formatDate(event.startDate)} au {DateUtils.formatDate(event.endDate)})
                          </Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.eventMeta}>
                      <Ionicons 
                        name={event.visibility === 'private' ? 'lock-closed' : 'people'} 
                        size={14} 
                        color={event.visibility === 'private' ? '#ff9800' : '#2196F3'} 
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                {hourEvents.length === 0 && hour >= 6 && hour <= 22 && (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>Libre</Text>
                  </View>
                )}
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
  privateEventItem: {
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff8f0',
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
  eventDates: {
    fontSize: 11,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  eventMeta: {
    marginLeft: 8,
  },
  emptySlot: {
    padding: 8,
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
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
