import { format, parseISO, isValid, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

class DateUtils {
  // Formater une date pour l'affichage
  static formatDate(date, formatString = 'dd/MM/yyyy') {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) {
        throw new Error('Date invalide');
      }
      return format(dateObj, formatString, { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date invalide';
    }
  }

  // Formater une date pour l'affichage long
  static formatDateLong(date) {
    return this.formatDate(date, 'EEEE d MMMM yyyy');
  }

  // Formater une date pour l'affichage court
  static formatDateShort(date) {
    return this.formatDate(date, 'EEE d MMM');
  }

  // Formater une heure
  static formatTime(time) {
    if (!time) return '';
    
    try {
      // Si c'est déjà au format HH:mm, le retourner tel quel
      if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      
      // Si c'est un objet Date
      if (time instanceof Date) {
        return format(time, 'HH:mm');
      }
      
      return time;
    } catch (error) {
      console.error('Erreur lors du formatage de l\'heure:', error);
      return '';
    }
  }

  // Convertir une date en chaîne ISO (YYYY-MM-DD)
  static toISODateString(date) {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) {
        throw new Error('Date invalide');
      }
      return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Erreur lors de la conversion en ISO:', error);
      return null;
    }
  }

  // Convertir une chaîne ISO en objet Date
  static fromISODateString(isoString) {
    try {
      const date = parseISO(isoString);
      if (!isValid(date)) {
        throw new Error('Chaîne ISO invalide');
      }
      return date;
    } catch (error) {
      console.error('Erreur lors de la conversion depuis ISO:', error);
      return null;
    }
  }

  // Vérifier si une date est aujourd'hui
  static isToday(date) {
    const today = new Date();
    const targetDate = typeof date === 'string' ? parseISO(date) : date;
    
    return this.toISODateString(today) === this.toISODateString(targetDate);
  }

  // Vérifier si une date est demain
  static isTomorrow(date) {
    const tomorrow = addDays(new Date(), 1);
    const targetDate = typeof date === 'string' ? parseISO(date) : date;
    
    return this.toISODateString(tomorrow) === this.toISODateString(targetDate);
  }

  // Vérifier si une date est hier
  static isYesterday(date) {
    const yesterday = subDays(new Date(), 1);
    const targetDate = typeof date === 'string' ? parseISO(date) : date;
    
    return this.toISODateString(yesterday) === this.toISODateString(targetDate);
  }

  // Obtenir le début et la fin d'une journée
  static getDayBounds(date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
      start: startOfDay(dateObj),
      end: endOfDay(dateObj)
    };
  }

  // Obtenir le début et la fin d'une semaine
  static getWeekBounds(date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
      start: startOfWeek(dateObj, { weekStartsOn: 1 }), // Lundi = 1
      end: endOfWeek(dateObj, { weekStartsOn: 1 })
    };
  }

  // Obtenir le début et la fin d'un mois
  static getMonthBounds(date) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
      start: startOfMonth(dateObj),
      end: endOfMonth(dateObj)
    };
  }

  // Calculer la durée entre deux heures en minutes
  static calculateDurationInMinutes(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      
      return endTotalMinutes - startTotalMinutes;
    } catch (error) {
      console.error('Erreur lors du calcul de la durée:', error);
      return 0;
    }
  }

  // Formater une durée en minutes en texte lisible
  static formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  }

  // Obtenir les jours d'une plage de dates
  static getDaysInRange(startDate, endDate) {
    const days = [];
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    let currentDate = start;
    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  }

  // Obtenir un texte relatif pour une date (aujourd'hui, demain, etc.)
  static getRelativeDateText(date) {
    if (this.isToday(date)) {
      return 'Aujourd\'hui';
    } else if (this.isTomorrow(date)) {
      return 'Demain';
    } else if (this.isYesterday(date)) {
      return 'Hier';
    } else {
      return this.formatDateLong(date);
    }
  }

  // Valider une date
  static isValidDate(date) {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return isValid(dateObj);
    } catch (error) {
      return false;
    }
  }

  // Valider une heure au format HH:mm
  static isValidTime(time) {
    if (!time || typeof time !== 'string') return false;
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  // Obtenir l'heure actuelle au format HH:mm
  static getCurrentTime() {
    return format(new Date(), 'HH:mm');
  }

  // Obtenir la date actuelle au format ISO
  static getCurrentDate() {
    return this.toISODateString(new Date());
  }

  // Comparer deux dates (retourne -1, 0, ou 1)
  static compareDates(date1, date2) {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  }

  // Comparer deux heures (retourne -1, 0, ou 1)
  static compareTimes(time1, time2) {
    if (!time1 || !time2) return 0;
    
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    if (minutes1 < minutes2) return -1;
    if (minutes1 > minutes2) return 1;
    return 0;
  }

  // Créer une date à partir de composants séparés
  static createDate(year, month, day) {
    try {
      const date = new Date(year, month - 1, day); // month est 0-indexé
      return this.toISODateString(date);
    } catch (error) {
      console.error('Erreur lors de la création de la date:', error);
      return null;
    }
  }

  // Obtenir les composants d'une date
  static getDateComponents(date) {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) {
        throw new Error('Date invalide');
      }
      
      return {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1, // month est 0-indexé, on ajoute 1
        day: dateObj.getDate(),
        weekday: dateObj.getDay()
      };
    } catch (error) {
      console.error('Erreur lors de l\'extraction des composants:', error);
      return null;
    }
  }

  // Ajouter des jours à une date
  static addDays(date, days) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const newDate = addDays(dateObj, days);
    return this.toISODateString(newDate);
  }

  // Soustraire des jours à une date
  static subtractDays(date, days) {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const newDate = subDays(dateObj, days);
    return this.toISODateString(newDate);
  }
}

export default DateUtils;
