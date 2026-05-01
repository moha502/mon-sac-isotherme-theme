class SeeMoreComponent extends HTMLElement {
  constructor() {
    super();
    this.isExpanded = false;
    this.maxHeight = null;
    this.contentElement = null;
    this.toggleButton = null;
    this.toggleText = null;
  }

  connectedCallback() {
    this.maxHeight = parseInt(this.dataset.readMoreLength) || 200;

    this.contentElement = this.querySelector('[data-ref="see-more-content"]');
    this.toggleButton = this.querySelector('[data-ref="see-more-toggle"]');
    this.toggleText = this.querySelector('.see-more__toggle-text');

    if (!this.contentElement || !this.toggleButton) return;

    // Définir la hauteur initiale
    this.#setInitialHeight();

    // Ajouter l'événement de clic
    this.toggleButton.addEventListener('click', () => this.#toggle());

    // Vérifier si le contenu nécessite un bouton "voir plus"
    this.#checkIfToggleNeeded();
  }

  #setInitialHeight() {
    this.contentElement.style.maxHeight = `${this.maxHeight}px`;
    this.contentElement.style.overflow = 'hidden';
    this.contentElement.style.transition = 'max-height 0.3s ease';
  }

  #checkIfToggleNeeded() {
    // Temporairement retirer la limite de hauteur pour mesurer le contenu réel
    const originalMaxHeight = this.contentElement.style.maxHeight;
    this.contentElement.style.maxHeight = 'none';

    const actualHeight = this.contentElement.scrollHeight;

    // Remettre la limite de hauteur
    this.contentElement.style.maxHeight = originalMaxHeight;

    // Masquer le bouton et le gradient si le contenu ne dépasse pas la hauteur maximale
    if (actualHeight <= this.maxHeight) {
      this.toggleButton.style.display = 'none';
      this.contentElement.classList.add('see-more__content--no-overflow');
    }
  }

  #toggle() {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      this.contentElement.style.maxHeight = `${this.contentElement.scrollHeight}px`;
      this.contentElement.classList.add('see-more__content--expanded');
      this.toggleText.textContent = this.toggleText.dataset.lessText || '↑';
    } else {
      this.contentElement.style.maxHeight = `${this.maxHeight}px`;
      this.contentElement.classList.remove('see-more__content--expanded');
      this.toggleText.textContent = this.toggleText.dataset.moreText || '↓';
    }

    // Émettre un événement personnalisé
    this.dispatchEvent(
      new CustomEvent('see-more:toggle', {
        detail: { isExpanded: this.isExpanded },
        bubbles: true,
      }),
    );
  }
}

customElements.define('see-more-component', SeeMoreComponent);
