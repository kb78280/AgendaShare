import firebaseService from './firebase';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import userService from './userService';

class EventService {
  constructor() {
    this.events = [];
    this.listeners = [];
  }

  // Initialiser le service et écouter les changements
  async initialize() {
    try {
      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        console.warn('Initialisation du service d\'événements sans utilisateur connecté.');
        return false;
      }
      
      // Écouter les changements d'événements en temps réel
      this.unsubscribe = firebaseService.subscribeToEvents(currentUser.uid, (events) => {
        this.events = events;
        this.notifyListeners();
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing event service:', error);
      return false;
    }
  }

  // Ajouter un listener pour les changements d'événements
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notifier tous les listeners
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.events));
  }

  // Créer un nouvel événement
  async createEvent(eventData) {
    try {
      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Valider les données de l'événement
      this.validateEventData(eventData);

      // Préparer les données de l'événement
      const newEvent = {
        title: eventData.title.trim(),
        type: eventData.type || 'single_day',
        startDate: eventData.startDate,
        endDate: eventData.endDate || null,
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        isAllDay: eventData.isAllDay || false,
        notifications: eventData.notifications || [],
        visibility: eventData.visibility || 'public',
        ownerUid: currentUser.uid, // Remplacer createdBy par ownerUid
      };

      // Créer l'événement en Firebase
      const createdEvent = await firebaseService.createEvent(newEvent);
      
      return createdEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Mettre à jour un événement
  async updateEvent(eventId, eventData) {
    try {
      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Vérifier que l'utilisateur peut modifier cet événement
      const existingEvent = this.getEventById(eventId);
      if (!existingEvent) {
        throw new Error('Événement non trouvé');
      }

      if (existingEvent.ownerUid !== currentUser.uid) { // Vérifier avec ownerUid
        throw new Error('Vous n\'êtes pas autorisé à modifier cet événement');
      }

      // Valider les données
      this.validateEventData(eventData);

      // Préparer les données mises à jour
      const updatedData = {
        title: eventData.title.trim(),
        type: eventData.type,
        startDate: eventData.startDate,
        endDate: eventData.endDate || null,
        startTime: eventData.startTime || null,
        endTime: eventData.endTime || null,
        isAllDay: eventData.isAllDay,
        notifications: eventData.notifications || [],
        visibility: eventData.visibility,
      };

      // Mettre à jour en Firebase
      const updatedEvent = await firebaseService.updateEvent(eventId, updatedData);
      
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Supprimer un événement
  async deleteEvent(eventId) {
    try {
      const currentUser = userService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Vérifier que l'utilisateur peut supprimer cet événement
      const existingEvent = this.getEventById(eventId);
      if (!existingEvent) {
        throw new Error('Événement non trouvé');
      }

      if (existingEvent.ownerUid !== currentUser.uid) { // Vérifier avec ownerUid
        throw new Error('Vous n\'êtes pas autorisé à supprimer cet événement');
      }

      // Supprimer de Firebase
      await firebaseService.deleteEvent(eventId);
      
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Valider les données d'un événement
  validateEventData(eventData) {
    if (!eventData.title || eventData.title.trim().length === 0) {
      throw new Error('Le titre de l\'événement est obligatoire');
    }

    if (!eventData.startDate) {
      throw new Error('La date de début est obligatoire');
    }

    if (eventData.type === 'date_range' && !eventData.endDate) {
      throw new Error('La date de fin est obligatoire pour un événement sur plusieurs jours');
    }

    if (eventData.type === 'date_range' && eventData.endDate < eventData.startDate) {
      throw new Error('La date de fin doit être après la date de début');
    }

    if (!eventData.isAllDay) {
      if (!eventData.startTime) {
        throw new Error('L\'heure de début est obligatoire');
      }
      
      if (eventData.type === 'single_day' && eventData.endTime && eventData.endTime <= eventData.startTime) {
        throw new Error('L\'heure de fin doit être après l\'heure de début');
      }
    }

    // Valider les notifications
    if (eventData.notifications && eventData.notifications.length > 0) {
      eventData.notifications.forEach((notification, index) => {
        if (!notification.type || !['at_event', 'before'].includes(notification.type)) {
          throw new Error(`Type de notification invalide à l'index ${index}`);
        }
        
        if (notification.type === 'before') {
          if (!notification.value || notification.value < 1 || notification.value > 100) {
            throw new Error(`Valeur de notification invalide à l'index ${index} (1-100)`);
          }
          
          if (!notification.unit || !['minutes', 'hours', 'days', 'weeks'].includes(notification.unit)) {
            throw new Error(`Unité de notification invalide à l'index ${index}`);
          }
        }
      });
    }
  }

  // Obtenir tous les événements
  getEvents() {
    return this.events;
  }

  // Obtenir un événement par ID
  getEventById(eventId) {
    return this.events.find(event => event.id === eventId);
  }

  // Obtenir les événements pour une date spécifique
  getEventsByDate(date) {
    const targetDate = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    
    return this.events.filter(event => {
      if (event.type === 'single_day') {
        return event.startDate === targetDate;
      } else {
        // Événement sur plusieurs jours
        return isWithinInterval(parseISO(targetDate), {
          start: parseISO(event.startDate),
          end: parseISO(event.endDate)
        });
      }
    });
  }

  // Obtenir les événements pour une plage de dates
  getEventsByDateRange(startDate, endDate) {
    const start = typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
    const end = typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd');
    
    return this.events.filter(event => {
      // Vérifier si l'événement chevauche avec la plage demandée
      const eventStart = event.startDate;
      const eventEnd = event.endDate || event.startDate;
      
      return !(eventEnd < start || eventStart > end);
    });
  }

  // Obtenir les événements publics
  getPublicEvents() {
    return this.events.filter(event => event.visibility === 'public');
  }

  // Obtenir les événements de l'utilisateur actuel
  getCurrentUserEvents() {
    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    return this.events.filter(event => event.ownerUid === currentUser.uid); // Filtrer par ownerUid
  }

  // Rechercher des événements par titre
  searchEvents(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    return this.events.filter(event => 
      event.title.toLowerCase().includes(searchTerm)
    );
  }

  // Obtenir les événements avec notifications pour une date/heure donnée
  getEventsWithNotifications(targetDateTime) {
    const events = [];
    
    this.events.forEach(event => {
      if (!event.notifications || event.notifications.length === 0) {
        return;
      }
      
      event.notifications.forEach(notification => {
        if (notification.type === 'at_event') {
          // Notification au moment de l'événement
          const eventDateTime = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
          if (Math.abs(targetDateTime.getTime() - eventDateTime.getTime()) < 60000) { // 1 minute de marge
            events.push({ event, notification, notificationTime: eventDateTime });
          }
        } else if (notification.type === 'before') {
          // Notification avant l'événement
          const eventDateTime = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
          const notificationTime = this.calculateNotificationTime(eventDateTime, notification);
          
          if (Math.abs(targetDateTime.getTime() - notificationTime.getTime()) < 60000) { // 1 minute de marge
            events.push({ event, notification, notificationTime });
          }
        }
      });
    });
    
    return events;
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

  // Nettoyer les listeners lors de la destruction
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners = [];
  }
}

// Instance singleton
const eventService = new EventService();

export default eventService;
