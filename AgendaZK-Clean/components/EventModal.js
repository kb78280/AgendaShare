import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DateUtils from '../utils/dateUtils';
import eventService from '../services/eventService';

const NOTIFICATION_UNITS = [
  { value: 'minutes', label: 'minutes' },
  { value: 'hours', label: 'heures' },
  { value: 'days', label: 'jours' },
  { value: 'weeks', label: 'semaines' },
];

const PRESET_NOTIFICATIONS = [
  { type: 'at_event', label: 'Au moment de l\'événement' },
  { type: 'before', value: 10, unit: 'minutes', label: '10 minutes avant' },
  { type: 'before', value: 1, unit: 'hours', label: '1 heure avant' },
  { type: 'before', value: 1, unit: 'days', label: '1 jour avant' },
];

export default function EventModal({ 
  visible, 
  onClose, 
  selectedDate, 
  event = null, // Pour l'édition
  onEventCreated,
  onEventUpdated 
}) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('single_day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // États pour les notifications personnalisées
  const [showCustomNotification, setShowCustomNotification] = useState(false);
  const [customNotificationValue, setCustomNotificationValue] = useState(15);
  const [customNotificationUnit, setCustomNotificationUnit] = useState('minutes');

  // Initialiser les données quand le modal s'ouvre
  useEffect(() => {
    if (visible) {
      if (event) {
        // Mode édition
        setTitle(event.title || '');
        setEventType(event.type || 'single_day');
        setStartDate(event.startDate || selectedDate);
        setEndDate(event.endDate || '');
        setIsAllDay(event.isAllDay || false);
        setStartTime(event.startTime || DateUtils.getCurrentTime());
        setEndTime(event.endTime || '');
        setVisibility(event.visibility || 'public');
        setNotifications(event.notifications || []);
      } else {
        // Mode création
        resetForm();
        setStartDate(selectedDate);
      }
      setErrors({});
    }
  }, [visible, event, selectedDate]);

  const resetForm = () => {
    setTitle('');
    setEventType('single_day');
    setStartDate('');
    setEndDate('');
    setIsAllDay(false);
    setStartTime(DateUtils.getCurrentTime());
    setEndTime('');
    setVisibility('public');
    setNotifications([]);
    setShowCustomNotification(false);
    setCustomNotificationValue(15);
    setCustomNotificationUnit('minutes');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    }

    if (!startDate) {
      newErrors.startDate = 'La date de début est obligatoire';
    }

    if (eventType === 'date_range' && !endDate) {
      newErrors.endDate = 'La date de fin est obligatoire';
    }

    if (eventType === 'date_range' && endDate && endDate < startDate) {
      newErrors.endDate = 'La date de fin doit être après la date de début';
    }

    if (!isAllDay) {
      if (!startTime) {
        newErrors.startTime = 'L\'heure de début est obligatoire';
      }

      if (eventType === 'single_day' && endTime && startTime && endTime <= startTime) {
        newErrors.endTime = 'L\'heure de fin doit être après l\'heure de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const eventData = {
        title: title.trim(),
        type: eventType,
        startDate,
        endDate: eventType === 'date_range' ? endDate : null,
        startTime: isAllDay ? null : startTime,
        endTime: isAllDay ? null : endTime,
        isAllDay,
        notifications,
        visibility,
      };

      if (event) {
        // Mode édition
        const updatedEvent = await eventService.updateEvent(event.id, eventData);
        onEventUpdated && onEventUpdated(updatedEvent);
        Alert.alert('Succès', 'Événement modifié avec succès');
      } else {
        // Mode création
        const newEvent = await eventService.createEvent(eventData);
        onEventCreated && onEventCreated(newEvent);
        Alert.alert('Succès', 'Événement créé avec succès');
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const addPresetNotification = (preset) => {
    const exists = notifications.some(n => 
      n.type === preset.type && 
      n.value === preset.value && 
      n.unit === preset.unit
    );

    if (!exists) {
      setNotifications([...notifications, preset]);
    }
  };

  const addCustomNotification = () => {
    const customNotif = {
      type: 'before',
      value: customNotificationValue,
      unit: customNotificationUnit,
    };

    const exists = notifications.some(n => 
      n.type === customNotif.type && 
      n.value === customNotif.value && 
      n.unit === customNotif.unit
    );

    if (!exists) {
      setNotifications([...notifications, customNotif]);
      setShowCustomNotification(false);
    }
  };

  const removeNotification = (index) => {
    const newNotifications = notifications.filter((_, i) => i !== index);
    setNotifications(newNotifications);
  };

  const formatNotificationText = (notification) => {
    if (notification.type === 'at_event') {
      return 'Au moment de l\'événement';
    }
    
    const unitLabels = {
      minutes: notification.value === 1 ? 'minute' : 'minutes',
      hours: notification.value === 1 ? 'heure' : 'heures',
      days: notification.value === 1 ? 'jour' : 'jours',
      weeks: notification.value === 1 ? 'semaine' : 'semaines',
    };

    return `${notification.value} ${unitLabels[notification.unit]} avant`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {event ? 'Modifier l\'événement' : 'Nouvel événement'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.headerButton, isLoading && styles.headerButtonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#2196F3" />
            ) : (
              <Text style={styles.saveButtonText}>Sauver</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Titre */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Titre de l'événement</Text>
            <TextInput
              style={[styles.textInput, errors.title && styles.inputError]}
              placeholder="Titre de l'événement"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Type d'événement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type d'événement</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  eventType === 'single_day' && styles.typeOptionSelected
                ]}
                onPress={() => setEventType('single_day')}
              >
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={eventType === 'single_day' ? '#2196F3' : '#666'} 
                />
                <Text style={[
                  styles.typeOptionText,
                  eventType === 'single_day' && styles.typeOptionTextSelected
                ]}>
                  Jour unique
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  eventType === 'date_range' && styles.typeOptionSelected
                ]}
                onPress={() => setEventType('date_range')}
              >
                <Ionicons 
                  name="calendar" 
                  size={20} 
                  color={eventType === 'date_range' ? '#2196F3' : '#666'} 
                />
                <Text style={[
                  styles.typeOptionText,
                  eventType === 'date_range' && styles.typeOptionTextSelected
                ]}>
                  Plusieurs jours
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>Début</Text>
                <TouchableOpacity style={[styles.dateButton, errors.startDate && styles.inputError]}>
                  <Text style={styles.dateButtonText}>
                    {startDate ? DateUtils.formatDate(startDate) : 'Sélectionner'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
                {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
              </View>
              
              {eventType === 'date_range' && (
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Fin</Text>
                  <TouchableOpacity style={[styles.dateButton, errors.endDate && styles.inputError]}>
                    <Text style={styles.dateButtonText}>
                      {endDate ? DateUtils.formatDate(endDate) : 'Sélectionner'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
                </View>
              )}
            </View>
          </View>

          {/* Journée entière */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Journée entière</Text>
                <Text style={styles.switchSubtitle}>
                  L'événement dure toute la journée
                </Text>
              </View>
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{ false: '#e0e0e0', true: '#2196F3' }}
                thumbColor={isAllDay ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Heures */}
          {!isAllDay && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Heures</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Début</Text>
                  <TextInput
                    style={[styles.timeTextInput, errors.startTime && styles.inputError]}
                    placeholder="HH:mm"
                    value={startTime}
                    onChangeText={setStartTime}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
                </View>
                
                {eventType === 'single_day' && (
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>Fin (optionnel)</Text>
                    <TextInput
                      style={[styles.timeTextInput, errors.endTime && styles.inputError]}
                      placeholder="HH:mm"
                      value={endTime}
                      onChangeText={setEndTime}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                    {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Visibilité */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visibilité</Text>
            <View style={styles.visibilitySelector}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === 'public' && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility('public')}
              >
                <Ionicons 
                  name="people-outline" 
                  size={20} 
                  color={visibility === 'public' ? '#2196F3' : '#666'} 
                />
                <Text style={[
                  styles.visibilityOptionText,
                  visibility === 'public' && styles.visibilityOptionTextSelected
                ]}>
                  Public
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === 'private' && styles.visibilityOptionSelected
                ]}
                onPress={() => setVisibility('private')}
              >
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={visibility === 'private' ? '#2196F3' : '#666'} 
                />
                <Text style={[
                  styles.visibilityOptionText,
                  visibility === 'private' && styles.visibilityOptionTextSelected
                ]}>
                  Privé
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.visibilityDescription}>
              Les événements publics sont visibles par l'autre utilisateur
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Text style={styles.sectionSubtitle}>
              Les notifications seront disponibles dans une prochaine version
            </Text>
          </View>
        </ScrollView>
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
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  saveButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  typeOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  typeOptionTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2d4150',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeTextInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  visibilitySelector: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  visibilityOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  visibilityOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  visibilityOptionTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  visibilityDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#2d4150',
  },
  removeNotificationButton: {
    padding: 4,
  },
  presetTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  presetNotifications: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  presetButtonText: {
    color: '#2196F3',
    fontSize: 12,
  },
  customNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  customNotificationButtonText: {
    color: '#2196F3',
    fontSize: 14,
    marginLeft: 8,
  },
  customNotificationContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  customNotificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#2196F3',
    width: 20,
    height: 20,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  unitButtonSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  unitButtonText: {
    fontSize: 12,
    color: '#666',
  },
  unitButtonTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  addCustomButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCustomButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
