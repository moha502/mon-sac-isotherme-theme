class HeaderComponent extends HTMLElement {
  #initialHeaderTop = 0;
  #scrollHandler = null;
  #resizeObserver = null;

  constructor() {
    super();

    this.menuToggle = null;
    this.menuClose = null;
    this.mobileMenuOverlay = null;
    this.mobileMenu = null;
  }

  connectedCallback() {
    this.menuToggle = this.querySelector('[data-ref="menu-toggle"]');
    this.menuClose = this.querySelector('[data-ref="menu-close"]');
    this.mobileMenuOverlay = this.querySelector('[data-ref="mobile-menu-overlay"]');
    this.mobileMenu = this.querySelector('[data-ref="mobile-menu"]');

    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', this.#handleMenuOpen);
    }

    if (this.menuClose) {
      this.menuClose.addEventListener('click', this.#handleMenuClose);
    }

    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.addEventListener('click', this.#handleOverlayClick);
    }

    document.addEventListener('keydown', this.#handleKeyDown);

    // Initialiser l'observation sticky si le header est sticky
    this.#initStickyObserver();

    this.updateHeaderOffsetHeight();
    this.#resizeObserver = new ResizeObserver(() => this.updateHeaderOffsetHeight());
    this.#resizeObserver.observe(this);
  }

  disconnectedCallback() {
    if (this.menuToggle) {
      this.menuToggle.removeEventListener('click', this.#handleMenuOpen);
    }

    if (this.menuClose) {
      this.menuClose.removeEventListener('click', this.#handleMenuClose);
    }

    if (this.mobileMenuOverlay) {
      this.mobileMenuOverlay.removeEventListener('click', this.#handleOverlayClick);
    }

    document.removeEventListener('keydown', this.#handleKeyDown);

    // Nettoyer l'observer
    this.#cleanupStickyObserver();

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
  }

  #handleMenuOpen = () => {
    this.openMobileMenu();
  };

  #handleMenuClose = () => {
    this.closeMobileMenu();
  };

  #handleOverlayClick = (event) => {
    // Fermer le menu si on clique sur l'overlay (pas sur le menu lui-même)
    if (event.target === this.mobileMenuOverlay) {
      this.closeMobileMenu();
    }
  };

  #handleKeyDown = (event) => {
    // Fermer le menu avec la touche Escape
    if (event.key === 'Escape' && this.mobileMenuOverlay.classList.contains('is-open')) {
      this.closeMobileMenu();
    }
  };

  openMobileMenu() {
    // Nettoyer les classes pour éviter les conflits
    this.mobileMenuOverlay.classList.remove('is-closing');
    this.mobileMenuOverlay.classList.add('is-open');
    document.body.classList.add('overflow-hidden');

    // Focus sur le bouton de fermeture pour l'accessibilité
    setTimeout(() => {
      this.menuClose?.focus();
    }, 150);
  }

  closeMobileMenu() {
    // Ajouter la classe de fermeture pour déclencher l'animation
    this.mobileMenuOverlay.classList.add('is-closing');

    // Attendre la fin de l'animation avant de masquer l'overlay
    setTimeout(() => {
      this.mobileMenuOverlay.classList.remove('is-open', 'is-closing');
      document.body.classList.remove('overflow-hidden');

      // Remettre le focus sur le bouton menu
      this.menuToggle?.focus();
    }, 125); // Durée légèrement inférieure à --animation-speed pour éviter les décalages
  }

  /**
   * Met à jour la hauteur de l'offset du header, utile pour la position top des megamenus.
   */
  updateHeaderOffsetHeight = () => {
    this.style.setProperty('--header-offset-height', `${this.offsetHeight}px`);
  };

  /**
   * Initialise l'observation du header pour détecter quand il devient sticky
   */
  #initStickyObserver() {
    // Vérifier si le header est configuré comme sticky
    const headerGroup = this.closest('.shopify-section-group-header-group');
    if (!headerGroup || getComputedStyle(headerGroup).position !== 'sticky') {
      return;
    }

    // Calculer la position initiale réelle du header
    document.querySelectorAll('.shopify-section-group-header-group').forEach((section) => {
      if (section === headerGroup) {
        return;
      }
      this.#initialHeaderTop += section.offsetHeight;
    });

    // Créer le gestionnaire de scroll avec throttling
    this.#scrollHandler = this.#throttle(() => {
      this.#checkStickyState();
    }, 10);

    // Ajouter l'écouteur de scroll
    window.addEventListener('scroll', this.#scrollHandler, { passive: true });

    // Vérifier l'état initial
    this.#checkStickyState();
  }

  /**
   * Vérifie l'état sticky du header
   */
  #checkStickyState() {
    if (this.#initialHeaderTop === null) return;

    let offset = this.#initialHeaderTop;
    if (offset === 0) offset = 20;

    // Le header est sticky quand le scroll dépasse sa position initiale
    const isSticky = window.scrollY >= offset;

    this.dataset.stickyState = isSticky ? 'active' : 'inactive';
  }

  /**
   * Throttle function pour optimiser les performances
   */
  #throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Nettoie l'observer lors de la destruction du composant
   */
  #cleanupStickyObserver() {
    if (this.#scrollHandler) {
      window.removeEventListener('scroll', this.#scrollHandler);
      this.#scrollHandler = null;
    }
    this.#initialHeaderTop = null;
  }
}

if (!customElements.get('header-component')) {
  customElements.define('header-component', HeaderComponent);
}
