import { VariantUpdatedEvent, VariantSelectedEvent } from '@theme/events';
// import { morph } from '@theme/morph';

class VariantPicker extends HTMLElement {
  // Contrôleur pour annuler les requêtes en cours
  #abortController;

  connectedCallback() {
    this.addEventListener('change', this.variantChanged.bind(this));
  }

  /**
   * Gère l'événement de changement de variante.
   * @param {Event} event - L'événement de changement de variante.
   */
  variantChanged(event) {
    if (!(event.target instanceof HTMLElement)) return;

    // Met à jour l'option sélectionnée dans l'interface
    this.updateSelectedOption(event.target);

    // Déclenche un événement personnalisé pour notifier la sélection
    this.dispatchEvent(new VariantSelectedEvent({ id: event.target.dataset.optionValueId ?? '' }));

    // Lance la requête pour mettre à jour la section
    this.fetchUpdatedSection(this.buildRequestUrl());

    // Met à jour l'URL avec l'ID de variante sur les pages produit
    this.updateUrl(event.target);
  }

  // Met à jour l'option sélectionnée dans l'interface.
  updateSelectedOption(target) {
    // Si c'est une chaîne, trouve l'élément correspondant pour récupérer l'ID de la valeur d'option
    if (typeof target === 'string') {
      const targetElement = this.querySelector(`[data-option-value-id="${target}"]`);

      if (!targetElement) throw new Error('Target element not found');

      target = targetElement;
    }

    // Met à jour l'état "checked" pour les boutons radio
    if (target instanceof HTMLInputElement) {
      target.checked = true;
    }

    // Met à jour l'attribut "selected" pour les éléments select
    if (target instanceof HTMLSelectElement) {
      const newValue = target.value;
      const newSelectedOption = Array.from(target.options).find((option) => option.value === newValue);

      if (!newSelectedOption) throw new Error('Option not found');

      // Supprime l'attribut selected de toutes les options
      for (const option of target.options) {
        option.removeAttribute('selected');
      }

      // Ajoute l'attribut selected à la nouvelle option
      newSelectedOption.setAttribute('selected', 'selected');
    }
  }

  // Construit l'URL de requête pour récupérer les données de variante.
  buildRequestUrl() {
    let productUrl = this.dataset.productUrl;

    // On utilise la nouvelle API de Shopify pour récupérer les données de variante avec option_values.
    const params = [];
    params.push(`option_values=${this.selectedOptionsValues.join(',')}`);

    // Si variant-picker est un enfant de quick-add-component ou swatches-variant-picker-component,
    // nous devons ajouter section_id=section-rendering-product-card à l'URL
    // if (this.closest('quick-add-component') || this.closest('swatches-variant-picker-component')) {
    //   if (productUrl?.includes('?')) {
    //     productUrl = productUrl.split('?')[0];
    //   }
    //   return `${productUrl}?section_id=section-rendering-product-card&${params.join('&')}`;
    // }
    return `${productUrl}?${params.join('&')}`;
  }

  // Récupère la section mise à jour depuis le serveur.
  fetchUpdatedSection(requestUrl) {
    // Annule la requête fetch précédente si elle est encore en cours
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    fetch(requestUrl, { signal: this.#abortController.signal })
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');

        // Récupère les données JSON de la variante depuis la réponse
        const textContent = html.querySelector(`variant-picker script[type="application/json"]`)?.textContent;
        if (!textContent) return;

        // Met à jour seulement le variant picker
        this.updateVariantPicker(html);

        // Déclenche un événement pour notifier la mise à jour de la variante
        if (this.selectedOptionId) {
          this.dispatchEvent(
            new VariantUpdatedEvent(JSON.parse(textContent), this.selectedOptionId, {
              html,
              productId: this.dataset.productId ?? '',
            }),
          );
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log("Fetch interrompu par l'utilisateur");
        } else {
          console.error(error);
        }
      });
  }

  // Re-rend le sélecteur de variante avec les nouvelles données.
  updateVariantPicker(newHtml) {
    // Trouve le nouveau variant picker dans la réponse
    const newVariantPickerSource = newHtml.querySelector(this.tagName.toLowerCase());

    if (!newVariantPickerSource) {
      throw new Error('Aucune nouvelle source de variant picker trouvée');
    }

    // Met à jour le variant picker
    this.innerHTML = newVariantPickerSource.innerHTML;
  }

  // Met à jour l'URL avec l'ID de variante sur les pages produit
  updateUrl(target) {
    // Détermine si nous sommes sur une page produit (pas dans une carte produit ou dialogue)
    const isOnProductPage =
      Theme.template.name === 'product' &&
      !event.target.closest('product-card') &&
      !event.target.closest('quick-add-dialog');

    // Prépare l'URL pour la mise à jour de l'historique du navigateur
    const url = new URL(window.location.href);

    let variantId;

    // Extrait l'ID de la variante selon le type d'élément (radio ou select)
    if (target instanceof HTMLInputElement && target.type === 'radio') {
      variantId = target.dataset.variantId || null;
    } else if (target instanceof HTMLSelectElement) {
      const selectedOption = target.options[target.selectedIndex];
      variantId = selectedOption?.dataset.variantId || null;
    }

    // Met à jour l'URL avec l'ID de variante sur les pages produit
    if (isOnProductPage) {
      if (variantId) {
        url.searchParams.set('variant', variantId);
      } else {
        url.searchParams.delete('variant');
      }
    }

    // Met à jour l'URL dans l'historique du navigateur si elle a changé
    if (url.href !== window.location.href) {
      history.replaceState({}, '', url.toString());
    }
  }

  // Récupère l'option actuellement sélectionnée.
  get selectedOption() {
    const selectedOption = this.querySelector('select option[selected], fieldset input:checked');

    if (!(selectedOption instanceof HTMLInputElement || selectedOption instanceof HTMLOptionElement)) {
      return undefined;
    }

    return selectedOption;
  }

  // Récupère l'ID de l'option actuellement sélectionnée.
  get selectedOptionId() {
    const { selectedOption } = this;
    if (!selectedOption) return undefined;
    const { optionValueId } = selectedOption.dataset;

    if (!optionValueId) {
      throw new Error("Aucun ID de valeur d'option trouvé");
    }

    return optionValueId;
  }

  // Récupère toutes les valeurs d'options actuellement sélectionnées.
  get selectedOptionsValues() {
    const selectedOptions = Array.from(this.querySelectorAll('select option[selected], fieldset input:checked'));

    return selectedOptions.map((option) => {
      const { optionValueId } = option.dataset;

      if (!optionValueId) throw new Error("Aucun ID de valeur d'option trouvé");

      return optionValueId;
    });
  }
}

if (!customElements.get('variant-picker')) {
  customElements.define('variant-picker', VariantPicker);
}
