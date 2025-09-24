import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SemaineScreen({ navigation }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

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

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Lundi = 1
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const isToday = (date) => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

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
              {weekDays.map((day, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[styles.hourCell, isToday(day) && styles.todayCell]}
                >
                  {/* Ici on pourrait ajouter les événements */}
                </TouchableOpacity>
              ))}
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
});
