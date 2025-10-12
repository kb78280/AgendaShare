import React, { useLayoutEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AnneeScreen({ navigation }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Mémoriser la date d'aujourd'hui pour éviter les recalculs
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayForHeader = useMemo(() => format(new Date(), 'EEE d MMM', { locale: fr }), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.dateText}>{todayForHeader}</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ),
      headerTitle: 'Agenda',
    });
  }, [navigation, todayForHeader]);

  // Mémoriser les mois de l'année pour éviter les recalculs
  const months = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 0, 1));
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [currentYear]);

  // Mémoriser les en-têtes des jours
  const dayHeaders = useMemo(() => ['D', 'L', 'M', 'M', 'J', 'V', 'S'], []);

  const handleMonthPress = useCallback((month) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    navigation.navigate('Mois', { 
      initialYear: year, 
      initialMonth: monthIndex 
    });
  }, [navigation]);

  const renderMiniCalendar = useCallback((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Ajouter les jours vides au début
    const startDay = getDay(monthStart);
    const emptyDays = Array(startDay).fill(null);
    const allDays = [...emptyDays, ...days];

    return (
      <TouchableOpacity
        key={month.getTime()} 
        style={styles.miniCalendar}
        onPress={() => handleMonthPress(month)}
        activeOpacity={0.7}
      >
        <Text style={styles.monthTitle}>
          {format(month, 'MMMM', { locale: fr })}
        </Text>
        <View style={styles.daysHeader}>
          {dayHeaders.map((day, index) => (
            <Text key={index} style={styles.dayHeader}>{day}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {allDays.map((day, index) => (
            <View
              key={index}
              style={[
                styles.dayCell,
                day && format(day, 'yyyy-MM-dd') === today && styles.todayCell
              ]}
            >
              <Text style={[
                styles.dayText,
                day && format(day, 'yyyy-MM-dd') === today && styles.todayText
              ]}>
                {day ? format(day, 'd') : ''}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  }, [today, dayHeaders, handleMonthPress]);

  const handlePreviousYear = useCallback(() => {
    setCurrentYear(prev => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setCurrentYear(prev => prev + 1);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.yearHeader}>
        <TouchableOpacity 
          onPress={handlePreviousYear}
          style={styles.yearButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.yearTitle}>{currentYear}</Text>
        <TouchableOpacity 
          onPress={handleNextYear}
          style={styles.yearButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={10}
      >
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
