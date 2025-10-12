import React, { useLayoutEffect, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import eventService from '../services/eventService';
import DateUtils from '../utils/dateUtils';

export default function SemaineScreen({ navigation }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
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
      headerTitle: 'Semaine',
    });
  }, [navigation]);

  // Écouter les changements d'événements
  useEffect(() => {
    const unsubscribe = eventService.addListener((newEvents) => {
      setEvents(newEvents);
    });

    return () => unsubscribe();
  }, []);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lundi = 1
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filtrer les événements de la semaine
  const weekEvents = useMemo(() => {
    return events.filter(event => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;
      
      return isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
             isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
             (eventStart <= weekStart && eventEnd >= weekEnd);
    });
  }, [events, weekStart, weekEnd]);

  // Organiser les événements par jour et par heure
  const organizeEventsByDayAndHour = useMemo(() => {
    const organized = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      organized[dayKey] = {};
      
      // Initialiser chaque heure
      for (let hour = 0; hour < 24; hour++) {
        organized[dayKey][hour] = [];
      }
    });

    weekEvents.forEach(event => {
      const eventDate = parseISO(event.startDate);
      const dayKey = format(eventDate, 'yyyy-MM-dd');
      
      if (organized[dayKey]) {
        if (event.isAllDay) {
          // Événement toute la journée - l'ajouter à 8h par défaut
          organized[dayKey][8].push(event);
        } else if (event.startTime) {
          const hour = parseInt(event.startTime.split(':')[0]);
          if (hour >= 0 && hour < 24) {
            organized[dayKey][hour].push(event);
          }
        }
      }
    });

    return organized;
  }, [weekEvents, weekDays]);

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const isToday = (date) => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  const renderEventInCell = (event) => (
    <View key={event.id} style={[
      styles.eventBlock,
      event.visibility === 'private' && styles.privateEventBlock
    ]}>
      <Text style={styles.eventTitle} numberOfLines={1}>
        {event.title}
      </Text>
      {!event.isAllDay && event.startTime && (
        <Text style={styles.eventTime}>
          {event.startTime}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        
        <Text style={styles.weekTitle}>
          {format(weekStart, 'd MMM', { locale: fr })} - {format(weekEnd, 'd MMM yyyy', { locale: fr })}
        </Text>
        
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <View style={styles.daysHeader}>
        {weekDays.map((day, index) => (
          <View key={index} style={[styles.dayHeaderItem, isToday(day) && styles.todayHeader]}>
            <Text style={[styles.dayName, isToday(day) && styles.todayDayName]}>
              {format(day, 'EEE', { locale: fr })}
            </Text>
            <Text style={[styles.dayNumber, isToday(day) && styles.todayDayNumber]}>
              {format(day, 'd')}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.timeSlots}>
        {Array.from({ length: 24 }, (_, hour) => (
          <View key={hour} style={styles.timeSlot}>
            <Text style={styles.timeText}>{hour.toString().padStart(2, '0')}:00</Text>
            <View style={styles.hourRow}>
              {weekDays.map((day, dayIndex) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = organizeEventsByDayAndHour[dayKey]?.[hour] || [];
                
                return (
                  <View
                    key={dayIndex}
                    style={[styles.hourCell, isToday(day) && styles.todayCell]}
                  >
                    {dayEvents.map(renderEventInCell)}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
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
  weekHeader: {
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
  weekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    textTransform: 'capitalize',
  },
  daysHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayHeaderItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  todayHeader: {
    backgroundColor: '#e3f2fd',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  todayDayName: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  todayDayNumber: {
    color: '#2196F3',
  },
  timeSlots: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
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
  hourRow: {
    flex: 1,
    flexDirection: 'row',
  },
  hourCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    minHeight: 60,
  },
  todayCell: {
    backgroundColor: '#f8f9ff',
  },
  eventBlock: {
    backgroundColor: '#2196F3',
    borderRadius: 4,
    padding: 2,
    marginBottom: 2,
    minHeight: 20,
  },
  privateEventBlock: {
    backgroundColor: '#ff9800',
  },
  eventTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventTime: {
    color: '#fff',
    fontSize: 8,
    opacity: 0.9,
  },
});
