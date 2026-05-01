class DeliveryEstimation extends HTMLElement {
  constructor() {
    super();

    // Éléments DOM
    this.minDateElement = null;
    this.maxDateElement = null;

    // Configuration
    this.config = {
      locale: 'fr',
      minDays: 3,
      maxDays: 5,
      noSaturday: false,
      noSunday: false,
      dateFormat: 'in_letters',
      showWeekday: true,
      cutoffHour: null,
    };
  }

  connectedCallback() {
    // Récupérer les éléments DOM
    this.minDateElement = this.querySelector('[data-ref="min-date"]');
    this.maxDateElement = this.querySelector('[data-ref="max-date"]');

    // Récupérer la configuration depuis les data attributes
    this.#loadConfiguration();

    // Calculer et afficher les dates d'estimation
    this.#calculateAndDisplayDates();
  }

  /**
   * Charge la configuration depuis les data attributes
   */
  #loadConfiguration() {
    this.config.locale = this.dataset.locale || 'fr';
    this.config.minDays = parseInt(this.dataset.minDays) || 3;
    this.config.maxDays = parseInt(this.dataset.maxDays) || 5;
    this.config.noSaturday = this.dataset.noSaturday === 'true';
    this.config.noSunday = this.dataset.noSunday === 'true';
    this.config.dateFormat = this.dataset.dateFormat || 'in_letters';
    this.config.showWeekday = this.dataset.showWeekday === 'true';

    // Gérer l'heure de coupure
    const cutoffHour = this.dataset.cutoffHour;
    if (cutoffHour && cutoffHour !== '') {
      this.config.cutoffHour = parseInt(cutoffHour);
    }
  }

  /**
   * Calcule et affiche les dates d'estimation
   */
  #calculateAndDisplayDates() {
    const minDate = this.#calculateDeliveryDate(this.config.minDays);
    const maxDate = this.#calculateDeliveryDate(this.config.maxDays);

    // Formater et afficher les dates
    if (this.minDateElement) {
      this.minDateElement.textContent = this.#formatDate(minDate);
    }

    if (this.maxDateElement) {
      this.maxDateElement.textContent = this.#formatDate(maxDate);
    }
  }

  /**
   * Calcule une date de livraison en tenant compte des jours ouvrables
   * @param {number} daysToAdd - Nombre de jours à ajouter
   * @returns {Date} - Date de livraison calculée
   */
  #calculateDeliveryDate(daysToAdd) {
    const now = new Date();
    let startDate = new Date();

    // Vérifier l'heure de coupure
    if (this.config.cutoffHour !== null) {
      const currentHour = now.getHours();
      if (currentHour >= this.config.cutoffHour) {
        // Après l'heure de coupure, on commence le calcul à partir de demain
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    // Calculer la date de livraison en excluant les jours non ouvrables
    let businessDaysAdded = 0;
    let currentDate = new Date(startDate);

    while (businessDaysAdded < daysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);

      const dayOfWeek = currentDate.getDay();
      const isSaturday = dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;

      // Vérifier si c'est un jour ouvrable
      const isBusinessDay = !((isSaturday && this.config.noSaturday) || (isSunday && this.config.noSunday));

      if (isBusinessDay) {
        businessDaysAdded++;
      }
    }

    // Si la date finale tombe sur un jour non ouvrable, avancer au prochain jour ouvrable
    while (this.#isNonDeliveryDay(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return currentDate;
  }

  /**
   * Vérifie si une date est un jour non ouvrable
   * @param {Date} date - Date à vérifier
   * @returns {boolean} - True si c'est un jour non ouvrable
   */
  #isNonDeliveryDay(date) {
    const dayOfWeek = date.getDay();
    const isSaturday = dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;

    return (isSaturday && this.config.noSaturday) || (isSunday && this.config.noSunday);
  }

  /**
   * Formate une date selon la configuration
   * @param {Date} date - Date à formater
   * @returns {string} - Date formatée
   */
  #formatDate(date) {
    // Déterminer les options de formatage selon la configuration
    const options = {};

    if (this.config.dateFormat === 'numbers') {
      // Format numérique (ex: 24/12)
      options.day = 'numeric';
      options.month = 'numeric';
    } else {
      // Format en lettres (ex: 24 décembre)
      options.day = 'numeric';
      options.month = 'long';
    }

    // Ajouter le jour de la semaine si demandé
    if (this.config.showWeekday) {
      options.weekday = 'long';
    }

    // Utiliser Intl.DateTimeFormat pour formater selon la locale
    const formatter = new Intl.DateTimeFormat(this.config.locale, options);

    // Formater la date
    let formattedDate = formatter.format(date);

    // Capitaliser la première lettre si nécessaire
    formattedDate = this.#capitalizeFirstLetter(formattedDate);

    return formattedDate;
  }

  /**
   * Capitalise la première lettre d'une chaîne
   * @param {string} str - Chaîne à capitaliser
   * @returns {string} - Chaîne avec première lettre en majuscule
   */
  #capitalizeFirstLetter(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

if (!customElements.get('delivery-estimation')) {
  customElements.define('delivery-estimation', DeliveryEstimation);
}
