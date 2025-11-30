import React, { useState, useLayoutEffect, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Vibration,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import SearchComponent from '../components/SearchComponent';
import EventModal from '../components/EventModal';
import eventService from '../services/eventService';
import DateUtils from '../utils/dateUtils';

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
  dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  today: "Aujourd'hui"
};
LocaleConfig.defaultLocale = 'fr';

export default function MoisScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  
  // Vérifier s'il y a des paramètres de navigation
  const { initialYear, initialMonth } = route?.params || {};
  
  // Initialiser les dates avec les paramètres si disponibles
  const initializeDate = () => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      const targetDate = new Date(initialYear, initialMonth, 1);
      return {
        selectedDate: format(targetDate, 'yyyy-MM-dd'),
        currentMonth: format(targetDate, 'yyyy-MM-01')
      };
    }
    return {
      selectedDate: format(new Date(), 'yyyy-MM-dd'),
      currentMonth: format(new Date(), 'yyyy-MM-01')
    };
  };

  const { selectedDate: initialSelectedDate, currentMonth: initialCurrentMonth } = initializeDate();
  
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [currentMonth, setCurrentMonth] = useState(initialCurrentMonth);
  const [events, setEvents] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await eventService.initialize();
    } catch (error) {
      console.error("Failed to refresh events:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Gère la navigation depuis AnneeScreen
  useEffect(() => {
    if (route.params?.initialYear !== undefined && route.params?.initialMonth !== undefined) {
      const { initialYear, initialMonth } = route.params;
      const targetDate = new Date(initialYear, initialMonth, 1);
      const newMonth = format(targetDate, 'yyyy-MM-01');
      
      setCurrentMonth(newMonth);
      setSelectedDate(format(targetDate, 'yyyy-MM-dd'));

      // Nettoyer les paramètres pour éviter qu'ils persistent
      navigation.setParams({ initialYear: undefined, initialMonth: undefined });
    }
  }, [route.params?.initialYear, route.params?.initialMonth]);


  // Réinitialiser les paramètres de navigation après utilisation
  useEffect(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      // Nettoyer les paramètres pour éviter qu'ils persistent
      navigation.setParams({ initialYear: undefined, initialMonth: undefined });
    }
  }, [initialYear, initialMonth, navigation]);

  // Écouter les changements d'événements
  useEffect(() => {
    const unsubscribe = eventService.addListener((newEvents) => {
      setEvents(newEvents);
    });

    // Charger les événements initiaux
    setEvents(eventService.getEvents());

    return unsubscribe;
  }, []);

  // Gestion du bouton retour Android pour le modal
  useEffect(() => {
    const backAction = () => {
      if (showEventModal) {
        setShowEventModal(false);
        return true; // Empêche le comportement par défaut
      }
      return false; // Laisse le comportement par défaut
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [showEventModal]);

  useLayoutEffect(() => {
    const dateString = format(new Date(), 'EEE d MMM', { locale: fr });
    
    navigation.setOptions({
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
      headerTitle: 'Agenda',
    });
  }, [navigation]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const goToPreviousMonth = () => {
    const newMonth = subMonths(new Date(currentMonth), 1);
    const newMonthString = format(newMonth, 'yyyy-MM-01');
    handleMonthChange({ dateString: newMonthString });
  };

  const goToNextMonth = () => {
    const newMonth = addMonths(new Date(currentMonth), 1);
    const newMonthString = format(newMonth, 'yyyy-MM-01');
    handleMonthChange({ dateString: newMonthString });
  };

  const handleMonthChange = (month) => {
    // Vibration légère pour le feedback tactile
    try {
      Vibration.vibrate(15);
    } catch (error) {
      // Ignore si la vibration n'est pas supportée
    }
    
    // Animation simplifiée temporairement pour éviter les conflits Worklets
    setCurrentMonth(month.dateString);
  };

  const handleEventCreated = (newEvent) => {
    console.log('Nouvel événement créé:', newEvent);
  };

  const handleEventUpdated = (updatedEvent) => {
    console.log('Événement mis à jour:', updatedEvent);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventService.deleteEvent(eventId);
      console.log('Événement supprimé:', eventId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const openEventModal = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setShowEventModal(false);
  };

  // Créer les dates marquées pour le calendrier
  const createMarkedDates = () => {
    const marked = {
      [selectedDate]: {
        selected: true,
        selectedColor: '#2196F3',
      }
    };

    // Marquer les dates avec des événements
    events.forEach(event => {
      if (event.type === 'single_day') {
        // Événement d'un jour
        if (event.startDate !== selectedDate) {
          marked[event.startDate] = {
            ...marked[event.startDate],
            marked: true,
            dotColor: event.visibility === 'private' ? '#ff9800' : '#2196F3',
          };
        }
      } else if (event.type === 'date_range') {
        // Événement sur plusieurs jours - créer une période
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const days = DateUtils.getDaysInRange(startDate, endDate);
        
        days.forEach((day, index) => {
          const dateString = DateUtils.toISODateString(day);
          
          if (dateString !== selectedDate) {
            const isFirst = index === 0;
            const isLast = index === days.length - 1;
            const color = event.visibility === 'private' ? '#ff9800' : '#2196F3';
            
            marked[dateString] = {
              ...marked[dateString],
              startingDay: isFirst,
              endingDay: isLast,
              color: color,
              textColor: 'white',
            };
          }
        });
      }
    });

    return marked;
  };

  const markedDates = createMarkedDates();

  // Obtenir les événements du jour sélectionné
  const eventsOfSelectedDate = eventService.getEventsByDate(selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <View style={styles.calendarContainer}>
        <Calendar
          key={currentMonth} // Force le re-rendu lorsque le mois change
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
            <TouchableOpacity 
              style={styles.arrowContainer}
              onPress={direction === 'left' ? goToPreviousMonth : goToNextMonth}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'} 
                size={22} 
                color="#2196F3" 
              />
            </TouchableOpacity>
          )}
        />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.daySection}>
        <View style={styles.daySectionHeader}>
          <Text style={styles.daySectionTitle}>
            {DateUtils.formatDateLong(selectedDate)}
          </Text>
          {eventsOfSelectedDate.length > 0 && (
            <View style={styles.eventCountBadge}>
              <Text style={styles.eventCountText}>
                {eventsOfSelectedDate.length} événement{eventsOfSelectedDate.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.eventsContainer}>
          {eventsOfSelectedDate.length === 0 ? (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.noEventsText}>Aucun événement pour ce jour</Text>
              <Text style={styles.noEventsSubtext}>Appuyez sur le bouton ci-dessous pour en créer un</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.eventsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.eventsListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#2196F3']}
                  tintColor="#2196F3"
                />
              }
            >
              {eventsOfSelectedDate.map((event, index) => (
                <TouchableOpacity 
                  key={event.id} 
                  style={[
                    styles.eventItem,
                    event.visibility === 'private' && styles.privateEventItem,
                    index === 0 && styles.firstEventItem,
                    index === eventsOfSelectedDate.length - 1 && styles.lastEventItem
                  ]}
                  onPress={() => handleEditEvent(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventIndicator} />
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View style={styles.eventMeta}>
                        <Ionicons 
                          name={event.visibility === 'private' ? 'lock-closed' : 'people'} 
                          size={14} 
                          color={event.visibility === 'private' ? '#ff9800' : '#2196F3'} 
                        />
                        {event.notifications && event.notifications.length > 0 && (
                          <Ionicons name="notifications" size={14} color="#666" style={{ marginLeft: 6 }} />
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.eventDetails}>
                      {event.type === 'date_range' && (
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="calendar" size={14} color="#2196F3" />
                          <Text style={styles.eventDates}>
                            Du {DateUtils.formatDate(event.startDate)} au {DateUtils.formatDate(event.endDate)}
                          </Text>
                        </View>
                      )}
                      
                      {!event.isAllDay && event.startTime && (
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="time" size={14} color="#666" />
                          <Text style={styles.eventTime}>
                            {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                            {event.endTime && event.type === 'single_day' && (
                              <Text style={styles.eventDuration}>
                                {' '}({DateUtils.formatDuration(DateUtils.calculateDurationInMinutes(event.startTime, event.endTime))})
                              </Text>
                            )}
                          </Text>
                        </View>
                      )}
                      
                      {event.isAllDay && (
                        <View style={styles.eventDetailRow}>
                          <Ionicons name="sunny" size={14} color="#ff9800" />
                          <Text style={styles.eventTime}>Journée entière</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.eventActions}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.addButton, { marginBottom: insets.bottom + 16 }]} 
          onPress={openEventModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Ajouter un événement</Text>
        </TouchableOpacity>
      </View>

      <EventModal
        visible={showEventModal}
        onClose={closeEventModal}
        selectedDate={selectedDate}
        event={selectedEvent}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
      />

      <SearchComponent
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        rappels={events.reduce((acc, event) => {
          if (!acc[event.startDate]) {
            acc[event.startDate] = [];
          }
          acc[event.startDate].push({
            id: event.id,
            titre: event.title,
            heure: event.startTime || 'Journée entière',
          });
          return acc;
        }, {})}
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
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    margin: 5,
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  daySection: {
    flex: 1,
    backgroundColor: '#fff',
  },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  daySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    flex: 1,
  },
  eventCountBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventsContainer: {
    flex: 1,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noEventsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  firstEventItem: {
    marginTop: 4,
  },
  lastEventItem: {
    marginBottom: 4,
  },
  privateEventItem: {
    backgroundColor: '#fff8f0',
    borderColor: '#ffe0b3',
  },
  eventIndicator: {
    width: 4,
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  eventContent: {
    flex: 1,
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDates: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  eventDuration: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  eventActions: {
    justifyContent: 'center',
    paddingRight: 16,
  },
  rappelsList: {
    flex: 1,
  },
  eventsList: {
    flex: 1,
  },
  noRappelsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  noEventsText: {
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
  eventItem: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  privateEventItem: {
    borderLeftColor: '#ff9800',
    backgroundColor: '#fff8f0',
  },
  rappelContent: {
    flex: 1,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rappelTitre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
    flex: 1,
    marginRight: 8,
  },
  rappelHeure: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  eventDates: {
    fontSize: 13,
    color: '#2196F3',
    marginTop: 2,
    fontWeight: '500',
  },
  eventDuration: {
    color: '#999',
    fontSize: 12,
  },
  eventActions: {
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
