class ToastNotification extends HTMLElement {
  constructor() {
    super();
    this.content = null;
    this.successIcon = null;
    this.errorIcon = null;
    this.infoIcon = null;
    this.warningIcon = null;
    this.delay = 3000;
  }

  connectedCallback() {
    this.content = this.querySelector('[data-ref="toast-content"]');
    this.successIcon = this.querySelector('[data-ref="success-icon"]');
    this.errorIcon = this.querySelector('[data-ref="error-icon"]');
    this.infoIcon = this.querySelector('[data-ref="info-icon"]');
    this.warningIcon = this.querySelector('[data-ref="warning-icon"]');

    this.delay = 3000;

    document.addEventListener('toast:open', (e) => {
      this.open();

      switch (e.detail.type) {
        case 'success':
          this.setSuccessMode(e.detail.message);
          break;
        case 'error':
          this.setErrorMode(e.detail.message);
          break;
        case 'warning':
          this.setWarningMode(e.detail.message);
          break;
        default:
          this.setInfoMode(e.detail.message);
          break;
      }

      setTimeout(() => {
        this.close();
      }, this.delay);
    });
  }

  open() {
    this.classList.add('active');
  }

  close() {
    this.classList.remove('active');
  }

  setInfoMode(message) {
    this.content.innerHTML = message || 'Information';
    this.resetState();
    this.classList.add('info');
  }

  setWarningMode(message) {
    this.content.innerHTML = message || 'Attention !';
    this.resetState();
    this.classList.add('warning');
  }

  setErrorMode(message) {
    this.content.innerHTML = message || 'Erreur !';
    this.resetState();
    this.classList.add('error');
  }

  setSuccessMode(message) {
    this.content.innerHTML = message || 'Succès !';
    this.resetState();
    this.classList.add('success');
  }

  resetState() {
    this.classList.remove('info');
    this.classList.remove('warning');
    this.classList.remove('error');
    this.classList.remove('success');
  }
}

if (!customElements.get('toast-notification')) {
  customElements.define('toast-notification', ToastNotification);
}
