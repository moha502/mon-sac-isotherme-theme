class DialogComponent extends HTMLElement {
  #lastWidth = window.innerWidth;

  constructor() {
    super();
    this.dialogButton = null;
    this.dialogModal = null;
    this.closeButton = null;
    this.resizeHandler = null;
    this.animationDuration = null;
  }

  connectedCallback() {
    this.dialogButton = this.querySelector('[data-ref="popup-toggle"]');
    this.dialogModal = this.querySelector('[data-ref="popup-modal"]');
    this.closeButton = this.querySelector('[data-ref="popup-close"]');

    this.animationDuration = parseFloat(getComputedStyle(this.closest('.shopify-section')).getPropertyValue('--animation-speed').replace('s', ''));

    if (!this.dialogModal) return;

    // Écouter le clic sur le bouton
    if (this.dialogButton) {
      this.dialogButton.addEventListener('click', this.#showModal.bind(this));
    }

    // Écouter le clic sur le bouton de fermeture
    this.closeButton.addEventListener('click', this.#closeModal.bind(this));

    // Écouter les événements natifs du dialog
    this.dialogModal.addEventListener('close', this.#onClose.bind(this));
    this.dialogModal.addEventListener('click', this.#onBackdropClick.bind(this));

    // Écouter le redimensionnement de l'écran
    this.resizeHandler = this.#onResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  disconnectedCallback() {
    if (this.dialogButton) {
      this.dialogButton.removeEventListener('click', this.#showModal.bind(this));
    }

    if (this.dialogModal) {
      this.dialogModal.removeEventListener('close', this.#onClose.bind(this));
      this.dialogModal.removeEventListener('click', this.#onBackdropClick.bind(this));
    }

    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.#closeModal.bind(this));
    }

    // Nettoyer l'event listener de redimensionnement
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  #showModal(event) {
    if (event) event.preventDefault();
    this.dialogModal.showModal();
    // Réinitialiser la position de scroll au début
    this.dialogModal.scrollTop = 0;
    document.body.classList.add('overflow-hidden');
  }

  #closeModal(event) {
    if (event) event.preventDefault();
    this.#animateClose();
  }

  #animateClose() {
    if (!this.dialogModal || !this.dialogModal.open) return;

    // Ajouter la classe d'animation de fermeture
    this.dialogModal.classList.add('dialog-modal--closing');

    // Écouter la fin de l'animation
    const handleAnimationEnd = () => {
      this.dialogModal.classList.remove('dialog-modal--closing');
      this.dialogModal.removeEventListener('animationend', handleAnimationEnd);
      this.dialogModal.close();
    };

    this.dialogModal.addEventListener('animationend', handleAnimationEnd);

    // Fallback au cas où l'événement animationend ne se déclenche pas
    setTimeout(() => {
      if (this.dialogModal.classList.contains('dialog-modal--closing')) {
        handleAnimationEnd();
      }
    }, this.animationDuration * 1000); // Fallback après 500ms
  }

  #onClose() {
    document.body.classList.remove('overflow-hidden');
  }

  #onBackdropClick(event) {
    const rect = this.dialogModal.getBoundingClientRect();
    const isInDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      this.#animateClose();
    }
  }

  #onResize() {
    const currentWidth = window.innerWidth;
    if (currentWidth === this.#lastWidth) return;
    this.#lastWidth = currentWidth;

    if (this.isOpen) {
      this.#animateClose();
    }
  }

  open() {
    this.#showModal();
  }

  close() {
    if (this.dialogModal && this.dialogModal.open) {
      this.#animateClose();
    }
  }

  get isOpen() {
    return this.dialogModal ? this.dialogModal.open : false;
  }
}

if (!customElements.get('dialog-component')) {
  customElements.define('dialog-component', DialogComponent);
}
