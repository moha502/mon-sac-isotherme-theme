import { mediaQueryLarge, isMobileBreakpoint } from '@theme/utilities';

class AccordionRow extends HTMLElement {
  // Getter pour l'élément details
  get details() {
    return this.querySelector('[data-ref="accordion-details"]');
  }
  // Champ privé pour gérer le nettoyage automatique des event listeners
  #controller = new AbortController();

  connectedCallback() {
    // Extraction du signal pour associer les event listeners à ce contrôleur
    const { signal } = this.#controller;

    this.#setDefaultOpenState();

    // Association de l'event listener avec le signal
    mediaQueryLarge.addEventListener('change', this.#handleMediaQueryChange, { signal });
  }

  //Gestion du démontage de l'élément
  disconnectedCallback() {
    // Nettoyage automatique : supprime TOUS les event listeners associés au signal.
    // Plus besoin de removeEventListener manuel - évite les fuites mémoire
    this.#controller.abort();
  }

  // Gestion de la modification de la media query
  #handleMediaQueryChange = () => {
    this.#setDefaultOpenState();
  };

  // Définit l'état d'ouverture par défaut de l'accordéon selon les attributs `open-by-default-on-mobile` et `open-by-default-on-desktop`.
  #setDefaultOpenState() {
    const isMobile = isMobileBreakpoint();

    this.details.open =
      (isMobile && this.hasAttribute('open-by-default-on-mobile')) ||
      (!isMobile && this.hasAttribute('open-by-default-on-desktop'));
  }
}

if (!customElements.get('accordion-row')) {
  customElements.define('accordion-row', AccordionRow);
}
