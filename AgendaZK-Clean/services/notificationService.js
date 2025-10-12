import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import eventService from './eventService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.scheduledNotifications = new Map();
  }

  // Initialiser le service de notifications
  async initialize() {
    try {
      // Demander les permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Permission de notification refusée');
        return false;
      }

      // Configuration spécifique Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('agenda-events', {
          name: 'Événements Agenda',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
          sound: 'default',
        });
      }

      this.isInitialized = true;
      console.log('Service de notifications initialisé');
      
      // Écouter les changements d'événements pour mettre à jour les notifications
      eventService.addListener(this.handleEventsUpdate.bind(this));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
      return false;
    }
  }

  // Gérer les mises à jour d'événements
  async handleEventsUpdate(events) {
    if (!this.isInitialized) return;
    
    try {
      // Annuler toutes les notifications existantes
      await this.cancelAllNotifications();
      
      // Reprogrammer toutes les notifications
      await this.scheduleAllNotifications(events);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
    }
  }

  // Programmer toutes les notifications pour tous les événements
  async scheduleAllNotifications(events) {
    for (const event of events) {
      await this.scheduleEventNotifications(event);
    }
  }

  // Programmer les notifications pour un événement spécifique
  async scheduleEventNotifications(event) {
    if (!this.isInitialized || !event.notifications || event.notifications.length === 0) {
      return;
    }

    try {
      for (const notification of event.notifications) {
        await this.scheduleNotification(event, notification);
      }
    } catch (error) {
      console.error('Erreur lors de la programmation des notifications pour l\'événement:', event.id, error);
    }
  }

  // Programmer une notification individuelle
  async scheduleNotification(event, notification) {
    try {
      let triggerDate;
      
      if (notification.type === 'at_event') {
        // Notification au moment de l'événement
        triggerDate = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
      } else if (notification.type === 'before') {
        // Notification avant l'événement
        const eventDateTime = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
        triggerDate = this.calculateNotificationTime(eventDateTime, notification);
      } else {
        return;
      }

      // Vérifier que la date de notification est dans le futur
      if (triggerDate <= new Date()) {
        return;
      }

      // Créer le contenu de la notification
      const content = this.createNotificationContent(event, notification);
      
      // Programmer la notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: { date: triggerDate },
      });

      // Stocker l'ID de la notification pour pouvoir l'annuler plus tard
      const key = `${event.id}_${notification.type}_${notification.value || 'at_event'}_${notification.unit || ''}`;
      this.scheduledNotifications.set(key, notificationId);

      console.log(`Notification programmée pour ${triggerDate.toLocaleString()}: ${event.title}`);
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  }

  // Créer le contenu d'une notification
  createNotificationContent(event, notification) {
    let title, body;
    
    if (notification.type === 'at_event') {
      title = '📅 Événement maintenant';
      body = event.title;
    } else {
      const timeText = this.getNotificationTimeText(notification);
      title = `⏰ Rappel - ${timeText}`;
      body = event.title;
    }

    return {
      title,
      body,
      data: {
        eventId: event.id,
        notificationType: notification.type,
      },
      categoryIdentifier: 'agenda-events',
      sound: 'default',
    };
  }

  // Obtenir le texte descriptif du délai de notification
  getNotificationTimeText(notification) {
    const { value, unit } = notification;
    
    const unitNames = {
      minutes: value === 1 ? 'minute' : 'minutes',
      hours: value === 1 ? 'heure' : 'heures',
      days: value === 1 ? 'jour' : 'jours',
      weeks: value === 1 ? 'semaine' : 'semaines',
    };
    
    return `dans ${value} ${unitNames[unit]}`;
  }

  // Calculer l'heure de notification
  calculateNotificationTime(eventDateTime, notification) {
    const { value, unit } = notification;
    const eventTime = new Date(eventDateTime);
    
    switch (unit) {
      case 'minutes':
        return new Date(eventTime.getTime() - (value * 60 * 1000));
      case 'hours':
        return new Date(eventTime.getTime() - (value * 60 * 60 * 1000));
      case 'days':
        return new Date(eventTime.getTime() - (value * 24 * 60 * 60 * 1000));
      case 'weeks':
        return new Date(eventTime.getTime() - (value * 7 * 24 * 60 * 60 * 1000));
      default:
        return eventTime;
    }
  }

  // Annuler toutes les notifications programmées
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      console.log('Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }

  // Annuler les notifications d'un événement spécifique
  async cancelEventNotifications(eventId) {
    try {
      const keysToRemove = [];
      
      for (const [key, notificationId] of this.scheduledNotifications.entries()) {
        if (key.startsWith(eventId)) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => this.scheduledNotifications.delete(key));
      console.log(`Notifications annulées pour l'événement: ${eventId}`);
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications de l\'événement:', error);
    }
  }

  // Tester une notification (pour debug)
  async testNotification() {
    if (!this.isInitialized) {
      console.warn('Service de notifications non initialisé');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'Ceci est un test des notifications AgendaZK',
          data: { test: true },
        },
        trigger: { seconds: 2 },
      });
      
      console.log('Notification de test programmée');
    } catch (error) {
      console.error('Erreur lors du test de notification:', error);
    }
  }

  // Obtenir les permissions de notification
  async getPermissions() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings;
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      return null;
    }
  }

  // Demander les permissions de notification
  async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  // Écouter les interactions avec les notifications
  addNotificationListener(callback) {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  }

  // Écouter les réponses aux notifications
  addNotificationResponseListener(callback) {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  }

  // Obtenir les notifications programmées (pour debug)
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Notifications programmées:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications programmées:', error);
      return [];
    }
  }

  // Nettoyer le service
  cleanup() {
    this.cancelAllNotifications();
    this.scheduledNotifications.clear();
    this.isInitialized = false;
  }
}

// Instance singleton
const notificationService = new NotificationService();

export default notificationService;
