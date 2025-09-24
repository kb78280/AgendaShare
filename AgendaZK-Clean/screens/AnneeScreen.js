import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AnneeScreen({ navigation }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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
  }, [navigation, currentYear]);

  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const renderMiniCalendar = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Ajouter les jours vides au début
    const startDay = getDay(monthStart);
    const emptyDays = Array(startDay).fill(null);
    const allDays = [...emptyDays, ...days];

    return (
      <View key={month.getTime()} style={styles.miniCalendar}>
        <Text style={styles.monthTitle}>
          {format(month, 'MMMM', { locale: fr })}
        </Text>
        <View style={styles.daysHeader}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
            <Text key={index} style={styles.dayHeader}>{day}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {allDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day && format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && styles.todayCell
              ]}
              onPress={() => day && navigation.navigate('Mois')}
            >
              <Text style={[
                styles.dayText,
                day && format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && styles.todayText
              ]}>
                {day ? format(day, 'd') : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.yearHeader}>
        <TouchableOpacity 
          onPress={() => setCurrentYear(currentYear - 1)}
          style={styles.yearButton}
        >
          <Ionicons name="chevron-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.yearTitle}>{currentYear}</Text>
        <TouchableOpacity 
          onPress={() => setCurrentYear(currentYear + 1)}
          style={styles.yearButton}
        >
          <Ionicons name="chevron-forward" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarsGrid}>
          {months.map(renderMiniCalendar)}
        </View>
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
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  yearButton: {
    padding: 10,
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    marginHorizontal: 30,
  },
  scrollView: {
    flex: 1,
  },
  calendarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  miniCalendar: {
    width: '45%',
    backgroundColor: '#fff',
    margin: 5,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  dayHeader: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  dayText: {
    fontSize: 10,
    color: '#2d4150',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
