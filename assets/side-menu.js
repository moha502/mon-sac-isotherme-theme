class SideMenuComponent extends HTMLElement {
  constructor() {
    super();
    this.menuToggle = null;
    this.menuClose = null;
    this.mobileMenu = null;
    this.overlay = null;
  }

  connectedCallback() {
    this.menuToggle = this.querySelector('[data-ref="sidebar-toggle"]');
    this.menuClose = this.querySelector('[data-ref="sidebar-close"]');
    this.mobileMenu = this.querySelector('[data-ref="sidebar-menu"]');
    this.overlay = this.querySelector('[data-ref="sidebar-overlay"]');

    this.menuToggle?.addEventListener('click', this.#handleMenuOpen);

    this.menuClose?.addEventListener('click', this.#handleMenuClose);

    this.overlay?.addEventListener('click', this.#handleOverlayClick);

    document.addEventListener('keydown', this.#handleKeyDown);
  }

  disconnectedCallback() {
    this.menuToggle?.removeEventListener('click', this.#handleMenuOpen);

    this.menuClose?.removeEventListener('click', this.#handleMenuClose);

    this.overlay?.removeEventListener('click', this.#handleOverlayClick);

    document.removeEventListener('keydown', this.#handleKeyDown);
  }

  #handleMenuOpen = () => {
    this.open();
  };

  #handleMenuClose = () => {
    this.close();
  };

  #handleOverlayClick = (event) => {
    // Fermer le menu si on clique sur l'overlay (pas sur le menu lui-même)
    if (event.target === this.overlay) {
      this.close();
    }
  };

  #handleKeyDown = (event) => {
    // Fermer le menu avec la touche Escape
    if (event.key === 'Escape' && this.overlay.classList.contains('is-open')) {
      this.close();
    }
  };

  open() {
    // Nettoyer les classes pour éviter les conflits
    this.overlay.classList.remove('is-closing');
    this.overlay.classList.add('is-open');
    document.body.classList.add('overflow-hidden');

    // Focus sur le bouton de fermeture pour l'accessibilité
    setTimeout(() => {
      this.menuClose?.focus();
    }, 150);
  }

  close() {
    // Ajouter la classe de fermeture pour déclencher l'animation
    this.overlay.classList.add('is-closing');

    // Attendre la fin de l'animation avant de masquer l'overlay
    setTimeout(() => {
      this.overlay.classList.remove('is-open', 'is-closing');
      document.body.classList.remove('overflow-hidden');

      // Remettre le focus sur le bouton menu
      this.menuToggle?.focus();
    }, 125); // Durée légèrement inférieure à --animation-speed pour éviter les décalages
  }
}

if (!customElements.get('side-menu-component')) {
  customElements.define('side-menu-component', SideMenuComponent);
}
