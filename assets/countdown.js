class DateCounter extends HTMLElement {
  constructor() {
    super();

    this.countdownDateAttr = null;
    this.countdownDate = null;
    this.days = null;
    this.hours = null;
    this.minutes = null;
    this.seconds = null;
    this.countdownTimer = null;
    this.timerEnded = null;
  }

  connectedCallback() {
    this.countdownDateAttr = this.getAttribute('data-end-date');
    this.countdownDate = this.parseDate(this.countdownDateAttr);
    if (isNaN(this.countdownDate)) {
      console.error('Invalid date format:', this.countdownDateAttr);
      return;
    }
    this.days = this.querySelector('[data-ref="days"]');
    this.hours = this.querySelector('[data-ref="hours"]');
    this.minutes = this.querySelector('[data-ref="minutes"]');
    this.seconds = this.querySelector('[data-ref="seconds"]');
    this.countdownTimer = this.querySelector('[data-ref="countdown-timer"]');
    this.timerEnded = this.querySelector('[data-ref="timer-ended"]');

    this.updateCountdown();
    this.interval = setInterval(() => this.updateCountdown(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  parseDate(dateStr) {
    // Format attendu : 03/11/2025 14:30
    const dateTimeParts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})/);
    if (dateTimeParts) {
      const [_, day, month, year, hour, minute] = dateTimeParts;
      return new Date(year, month - 1, day, hour, minute);
    }

    // Si le format n'est pas reconnu, retourne une date invalide
    return new Date('Invalid Date');
  }

  updateCountdown() {
    const now = new Date().getTime();
    const distance = this.countdownDate.getTime() - now;

    if (distance < 0) {
      this.countdownTimer.classList.add('hidden');
      if (this.timerEnded.dataset.showMessage === 'true') {
        this.timerEnded.classList.remove('hidden');
      } else {
        this.closest('[data-ref="countdown"]').classList.add('hidden');
      }

      clearInterval(this.interval);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Affichage des jours, même s'ils sont à 0
    this.days.textContent = days;
    this.hours.textContent = hours.toString().padStart(2, '0');
    this.minutes.textContent = minutes.toString().padStart(2, '0');
    this.seconds.textContent = seconds.toString().padStart(2, '0');
  }
}

customElements.define('date-counter', DateCounter);
