import { SubscriptionUpdatedEvent, ThemeEvents } from '@theme/events';
import { formatMoney } from '@theme/utilities';

/**
 * Composant d'abonnement permettant de choisir entre achat unique et abonnement.
 * Gère l'affichage des prix, la sélection de fréquence et la mise à jour du formulaire produit.
 */
class SubscriptionComponent extends HTMLElement {
  constructor() {
    super();

    this.sellingPlanInput = null;
    this.oneTimeOption = null;
    this.subscriptionOption = null;
    this.oneTimeCard = null;
    this.subscriptionCard = null;
    this.frequencySelect = null;
    this.frequencyInputs = null;
    this.frequencyContainer = null;
    this.oneTimePriceContainer = null;
    this.subscriptionPriceContainer = null;
    this.productForm = null;

    this.handleOneTimeChange = () => this.#onOptionChange('one_time');
    this.handleSubscriptionChange = () => this.#onOptionChange('subscription');
    this.handleFrequencyChange = () => this.#onFrequencyChange();
    this.handleFrequencyButtonChange = (event) => this.#onFrequencyButtonChange(event);
    this.handlePriceUpdate = () => this.#updateDisplayedPrices();
    this.handleVariantUpdate = (event) => this.#onVariantUpdate(event);
  }

  connectedCallback() {
    this.#initDomReferences();

    this.oneTimeOption?.addEventListener('change', this.handleOneTimeChange);
    this.subscriptionOption?.addEventListener('change', this.handleSubscriptionChange);
    this.frequencySelect?.addEventListener('change', this.handleFrequencyChange);
    this.#addFrequencyButtonListeners();

    document.addEventListener(ThemeEvents.variantUpdated, this.handleVariantUpdate);
    document.addEventListener(ThemeEvents.quantityBreaksUpdated, this.handlePriceUpdate);

    this.#initDefaultSelection();
  }

  disconnectedCallback() {
    this.oneTimeOption?.removeEventListener('change', this.handleOneTimeChange);
    this.subscriptionOption?.removeEventListener('change', this.handleSubscriptionChange);
    this.frequencySelect?.removeEventListener('change', this.handleFrequencyChange);
    this.#removeFrequencyButtonListeners();

    document.removeEventListener(ThemeEvents.variantUpdated, this.handleVariantUpdate);
    document.removeEventListener(ThemeEvents.quantityBreaksUpdated, this.handlePriceUpdate);
  }

  /**
   * Initialise les références DOM du composant.
   */
  #initDomReferences() {
    this.sellingPlanInput = this.querySelector('[data-ref="selling-plan-input"]');
    this.oneTimeOption = this.querySelector('[data-ref="one-time-option"]');
    this.subscriptionOption = this.querySelector('[data-ref="subscription-option"]');
    this.oneTimeCard = this.querySelector('[data-ref="one-time-card"]');
    this.subscriptionCard = this.querySelector('[data-ref="subscription-card"]');
    this.frequencySelect = this.querySelector('[data-ref="frequency-select"]');
    this.frequencyInputs = this.querySelectorAll('[data-ref="frequency-input"]');
    this.frequencyContainer = this.querySelector('[data-ref="frequency-container"]');
    this.oneTimePriceContainer = this.querySelector('[data-ref="one-time-price"]');
    this.subscriptionPriceContainer = this.querySelector('[data-ref="subscription-price"]');
    this.productForm = this.closest('[data-ref="product-section-content"]')?.querySelector('[data-ref="product-form"]') || this.closest('[data-ref="popup-content"]')?.querySelector('[data-ref="product-form"]');
  }

  /**
   * Gère la mise à jour au changement de variante.
   * Re-rend le composant avec le HTML de la nouvelle variante.
   * @param {CustomEvent} event - L'événement de mise à jour de variante
   */
  #onVariantUpdate(event) {
    if (!event.detail?.data?.html) return;

    const newSubscription = event.detail.data.html.querySelector('subscription-component');
    const hasSubscriptionContent = newSubscription?.querySelector('[data-ref="selling-plan-input"]');

    // Si la nouvelle variante n'a pas d'abonnement, masquer le composant et vider le contenu
    if (!hasSubscriptionContent) {
      this.style.display = 'none';
      this.innerHTML = '';

      // Réinitialiser les références DOM à null pour que isSubscriptionSelected() retourne false
      this.sellingPlanInput = null;
      this.oneTimeOption = null;
      this.subscriptionOption = null;
      this.oneTimeCard = null;
      this.subscriptionCard = null;
      this.frequencySelect = null;
      this.frequencyInputs = null;
      this.frequencyContainer = null;
      this.oneTimePriceContainer = null;
      this.subscriptionPriceContainer = null;

      this.dispatchEvent(new SubscriptionUpdatedEvent());
      return;
    }

    // Afficher le composant et mettre à jour le contenu
    this.style.display = '';
    this.innerHTML = newSubscription.innerHTML;

    // Retirer les anciens listeners avant de réinitialiser les références
    this.oneTimeOption?.removeEventListener('change', this.handleOneTimeChange);
    this.subscriptionOption?.removeEventListener('change', this.handleSubscriptionChange);
    this.frequencySelect?.removeEventListener('change', this.handleFrequencyChange);
    this.#removeFrequencyButtonListeners();

    // Réinitialiser les références DOM
    this.#initDomReferences();

    // Réattacher les listeners
    this.oneTimeOption?.addEventListener('change', this.handleOneTimeChange);
    this.subscriptionOption?.addEventListener('change', this.handleSubscriptionChange);
    this.frequencySelect?.addEventListener('change', this.handleFrequencyChange);
    this.#addFrequencyButtonListeners();

    // Réinitialiser la sélection par défaut
    this.#initDefaultSelection();
  }

  /**
   * Initialise la sélection par défaut selon le paramètre data-default-selected.
   * Si le produit nécessite un abonnement (requires_selling_plan), l'abonnement est forcé.
   */
  #initDefaultSelection() {
    const requiresSellingPlan = this.dataset.requiresSellingPlan === 'true';

    // Cas où le produit nécessite un abonnement (pas d'option achat unique)
    if (requiresSellingPlan) {
      if (this.subscriptionOption && this.isSubscriptionActivated()) {
        this.subscriptionOption.checked = true;
        this.#onOptionChange('subscription', true);
      }
      return;
    }

    // Ne rien faire si le composant est vide (variante sans abonnement)
    if (!this.oneTimeOption) return;

    // Forcer one_time si les quantity breaks sont en mode "variant picker" (incompatible avec abonnement)
    if (this.#isQuantityBreaksVariantPickerActive()) {
      this.oneTimeOption.checked = true;
      this.#onOptionChange('one_time', true);
      return;
    }

    const defaultSelected = this.dataset.defaultSelected || 'one_time';

    if (defaultSelected === 'subscription' && this.subscriptionOption && this.isSubscriptionActivated()) {
      this.subscriptionOption.checked = true;
      this.#onOptionChange('subscription', true);
    } else {
      this.oneTimeOption.checked = true;
      this.#onOptionChange('one_time', true);
    }
  }

  /**
   * Vérifie si les quantity breaks sont en mode "sélecteur de variante".
   * Ce mode est incompatible avec les abonnements.
   * @returns {boolean}
   */
  #isQuantityBreaksVariantPickerActive() {
    const quantityBreaks = this.productForm?.querySelector('[data-ref="quantity-breaks"]');
    return quantityBreaks?.dataset.showVariantPicker === 'true';
  }

  /**
   * Gère le changement d'option (achat unique / abonnement).
   * @param {'one_time' | 'subscription'} optionType - Type d'option sélectionnée
   * @param {boolean} notify - Indique si l'événement de mise à jour doit être déclenché
   */
  #onOptionChange(optionType, notify = true) {
    this.#updateSelectedCard(optionType);

    if (optionType === 'subscription') {
      this.#showFrequencySelect();
      this.#updateSellingPlanInput(this.#getSelectedFrequencyValue());
    } else {
      this.#hideFrequencySelect();
      this.#updateSellingPlanInput('');
    }

    this.#updateDisplayedPrices();
    if (notify) {
      this.dispatchEvent(new SubscriptionUpdatedEvent());
    }
  }

  /**
   * Gère le changement de fréquence d'abonnement.
   */
  #onFrequencyChange() {
    this.#updateSellingPlanInput(this.frequencySelect?.value || '');
    this.#updateDisplayedPrices();
    this.dispatchEvent(new SubscriptionUpdatedEvent());
  }

  /**
   * Met à jour les prix affichés dans les cartes one-time et abonnement.
   * Applique les réductions dans l'ordre Shopify : Abonnement → Quantity Breaks.
   * Les cross-sells sont ajoutés après les réductions (pas de réduction sur les cross-sells).
   */
  #updateDisplayedPrices() {
    const { priceAfterQB, priceBeforeQB, compareAtPrice, quantity, qbDiscount, crossSellPrice, crossSellCompareAtPrice } = this.#getBasePrices();
    if (priceAfterQB === null || priceAfterQB === undefined) return;

    // Carte one-time : prix après QB + cross-sells + compare-at original (sans badge)
    const oneTimeTotal = priceAfterQB + crossSellPrice;
    const oneTimeCompareAt = compareAtPrice + crossSellCompareAtPrice;
    this.#updatePriceElement(this.oneTimePriceContainer, oneTimeTotal, oneTimeCompareAt, false);

    // Carte abonnement - Appliquer la réduction abo sur le prix de base (avant réduction QB)
    let subscriptionPrice = this.#calculateSubscriptionPrice(priceBeforeQB, quantity);

    if (qbDiscount) {
      if (qbDiscount.type === 'percentage' && qbDiscount.percentage > 0) {
        subscriptionPrice = Math.round((subscriptionPrice * (100 - qbDiscount.percentage)) / 100);
      } else if (qbDiscount.value > 0) {
        subscriptionPrice = subscriptionPrice - qbDiscount.value;
      }
    }

    // Ajouter les cross-sells après les réductions (pas de réduction sur les cross-sells)
    const subscriptionTotal = Math.max(0, subscriptionPrice) + crossSellPrice;
    const subscriptionCompareAt = compareAtPrice + crossSellCompareAtPrice;

    // Carte abonnement : avec badge affichant la réduction de l'abonnement (minimum 0€)
    this.#updatePriceElement(this.subscriptionPriceContainer, subscriptionTotal, subscriptionCompareAt, true);
  }

  /**
   * Récupère les prix de base depuis les quantity breaks ou le product form.
   * @returns {{ priceAfterQB: number, priceBeforeQB: number, compareAtPrice: number, quantity: number, qbDiscount: object|null, crossSellPrice: number, crossSellCompareAtPrice: number }}
   */
  #getBasePrices() {
    const quantityBreaks = this.productForm?.querySelector('[data-ref="quantity-breaks"]');

    if (quantityBreaks && typeof quantityBreaks.getPrices === 'function' && quantityBreaks.isActive?.()) {
      const prices = quantityBreaks.getPrices();
      const quantity = parseInt(quantityBreaks.getSelectedQuantity?.()?.dataset?.quantity) || 1;
      const discount = typeof quantityBreaks.getDiscount === 'function' ? quantityBreaks.getDiscount() : null;

      const priceAfterQB = parseInt(prices.price) || 0;
      const compareAtPrice = parseInt(prices.compareAtPrice) || priceAfterQB;

      // Récupérer les prix des cross-sells (séparément pour ne pas appliquer la réduction abonnement dessus)
      let crossSellPrice = 0;
      let crossSellCompareAtPrice = 0;
      if (typeof quantityBreaks.getCrossSellPrices === 'function') {
        const crossSellPrices = quantityBreaks.getCrossSellPrices();
        crossSellPrice = parseInt(crossSellPrices.price) || 0;
        crossSellCompareAtPrice = parseInt(crossSellPrices.compareAtPrice) || crossSellPrice;
      }

      // Récupérer le prix unitaire de la variante depuis le bouton d'ajout au panier
      const addToCartContainer = this.productForm?.querySelector('[data-ref="add-to-cart-button-container"]');
      const variantUnitPrice = parseInt(addToCartContainer?.dataset.price) || 0;
      const variantUnitCompareAtPrice = parseInt(addToCartContainer?.dataset.compareAtPrice) || variantUnitPrice;

      // Le prix avant réduction QB = prix unitaire de la variante × quantité
      const priceBeforeQB = variantUnitPrice * quantity;

      return {
        priceAfterQB,
        priceBeforeQB,
        compareAtPrice: variantUnitCompareAtPrice * quantity,
        quantity,
        qbDiscount: discount,
        crossSellPrice,
        crossSellCompareAtPrice,
      };
    }

    // Sans QB, récupérer le prix depuis le bouton d'ajout au panier
    const addToCartContainer = this.productForm?.querySelector('[data-ref="add-to-cart-button-container"]');
    const variantPrice = parseInt(addToCartContainer?.dataset.price) || 0;
    const variantCompareAtPrice = parseInt(addToCartContainer?.dataset.compareAtPrice) || variantPrice;

    return {
      priceAfterQB: variantPrice,
      priceBeforeQB: variantPrice,
      compareAtPrice: variantCompareAtPrice,
      quantity: 1,
      qbDiscount: null,
      crossSellPrice: 0,
      crossSellCompareAtPrice: 0,
    };
  }

  /**
   * Calcule le prix avec la réduction abonnement appliquée.
   * @param {number} basePrice - Prix de base en centimes
   * @param {number} quantity - Nombre d'articles
   * @returns {number} Prix ajusté en centimes
   */
  #calculateSubscriptionPrice(basePrice, quantity = 1) {
    const adjustment = this.#getSelectedPlanAdjustment();
    return this.#applyPriceAdjustment(basePrice, adjustment, quantity);
  }

  /**
   * Récupère l'ajustement de prix du selling plan sélectionné.
   * @returns {{ type: string, value: number } | null}
   */
  #getSelectedPlanAdjustment() {
    const selectedElement = this.#getSelectedFrequencyElement();
    if (!selectedElement) return null;

    return {
      type: selectedElement.dataset.adjustmentType || 'percentage',
      value: parseFloat(selectedElement.dataset.adjustmentValue) || 0,
    };
  }

  /**
   * Applique un ajustement de prix (pourcentage, montant fixe ou prix fixe).
   * @param {number} basePrice - Prix de base en centimes
   * @param {{ type: string, value: number } | null} adjustment - Ajustement à appliquer
   * @param {number} quantity - Nombre d'articles (pour fixed_amount et price)
   * @returns {number} Prix ajusté en centimes
   */
  #applyPriceAdjustment(basePrice, adjustment, quantity = 1) {
    if (!adjustment) return basePrice;

    switch (adjustment.type) {
      case 'percentage':
        let unitBasePrice = basePrice / quantity;
        let unitDiscountAmount = (unitBasePrice * adjustment.value) / 100;
        let unitSubscriptionPrice = unitBasePrice - unitDiscountAmount;
        unitSubscriptionPrice = Math.round(unitSubscriptionPrice);
        let returnedPrice = unitSubscriptionPrice * quantity;
        return returnedPrice;
      case 'fixed_amount':
        return Math.max(0, basePrice - adjustment.value * quantity);
      case 'price':
        return adjustment.value * quantity;
      default:
        return basePrice;
    }
  }

  /**
   * Met à jour l'affichage d'un élément de prix (prix + prix barré + badge).
   * @param {HTMLElement | null} container - Conteneur du prix
   * @param {number} price - Prix à afficher en centimes
   * @param {number} compareAtPrice - Prix barré en centimes
   * @param {boolean} showSubscriptionBadge - Afficher le badge de réduction abonnement
   */
  #updatePriceElement(container, price, compareAtPrice, showSubscriptionBadge = false) {
    if (!container) return;

    const priceEl = container.querySelector('[data-ref="price"]');
    const compareAtPriceEl = container.querySelector('[data-ref="compare-at-price"]');
    const badgeEl = container.querySelector('[data-ref="difference-price-value"]');

    if (priceEl) {
      priceEl.textContent = formatMoney(price);
      priceEl.dataset.value = price;
    }

    const hasSavings = compareAtPrice > price;

    if (compareAtPriceEl) {
      if (hasSavings) {
        compareAtPriceEl.textContent = formatMoney(compareAtPrice);
        compareAtPriceEl.dataset.value = compareAtPrice;
      } else {
        compareAtPriceEl.textContent = '';
        compareAtPriceEl.dataset.value = '';
      }
    }

    if (badgeEl) {
      badgeEl.textContent = showSubscriptionBadge ? this.#formatSubscriptionDiscount() : '';
    }
  }

  /**
   * Formate la réduction de l'abonnement pour le badge.
   * Affiche directement la valeur de réduction du selling plan sélectionné.
   * @returns {string} Réduction formatée (ex: "10%", "5,00 €")
   */
  #formatSubscriptionDiscount() {
    const adjustment = this.#getSelectedPlanAdjustment();
    if (!adjustment || adjustment.value === 0) return '';

    switch (adjustment.type) {
      case 'percentage':
        return `${adjustment.value}%`;
      case 'fixed_amount':
        return formatMoney(adjustment.value);
      case 'price':
        return formatMoney(adjustment.value);
      default:
        return '';
    }
  }

  /**
   * Met à jour la classe CSS de la carte sélectionnée.
   * @param {'one_time' | 'subscription'} optionType - Type d'option sélectionnée
   */
  #updateSelectedCard(optionType) {
    this.oneTimeCard?.classList.remove('subscription__option--selected');
    this.subscriptionCard?.classList.remove('subscription__option--selected');

    if (optionType === 'one_time') {
      this.oneTimeCard?.classList.add('subscription__option--selected');
    } else {
      this.subscriptionCard?.classList.add('subscription__option--selected');
    }
  }

  #showFrequencySelect() {
    if (this.frequencyContainer) {
      this.frequencyContainer.style.display = 'block';
    }
  }

  #hideFrequencySelect() {
    if (this.frequencyContainer) {
      this.frequencyContainer.style.display = 'none';
    }
  }

  /**
   * Ajoute les event listeners pour les boutons de fréquence.
   */
  #addFrequencyButtonListeners() {
    if (!this.frequencyInputs) return;

    for (const input of this.frequencyInputs) {
      input.addEventListener('change', this.handleFrequencyButtonChange);
    }
  }

  /**
   * Retire les event listeners des boutons de fréquence.
   */
  #removeFrequencyButtonListeners() {
    if (!this.frequencyInputs) return;

    for (const input of this.frequencyInputs) {
      input.removeEventListener('change', this.handleFrequencyButtonChange);
    }
  }

  /**
   * Gère le changement de fréquence via bouton radio.
   */
  #onFrequencyButtonChange() {
    this.#updateSellingPlanInput(this.#getSelectedFrequencyValue());
    this.#updateDisplayedPrices();
    this.dispatchEvent(new SubscriptionUpdatedEvent());
  }

  /**
   * Récupère la valeur de fréquence sélectionnée (select ou bouton).
   * @returns {string}
   */
  #getSelectedFrequencyValue() {
    if (this.frequencySelect) {
      return this.frequencySelect.value || '';
    }

    if (this.frequencyInputs?.length > 0) {
      const checkedInput = this.querySelector('[data-ref="frequency-input"]:checked');
      return checkedInput?.value || '';
    }

    return '';
  }

  /**
   * Récupère l'élément de fréquence sélectionné (option ou input).
   * @returns {HTMLElement | null}
   */
  #getSelectedFrequencyElement() {
    if (this.frequencySelect) {
      return this.frequencySelect.options[this.frequencySelect.selectedIndex] || null;
    }

    if (this.frequencyInputs?.length > 0) {
      return this.querySelector('[data-ref="frequency-input"]:checked');
    }

    return null;
  }

  /**
   * Met à jour la valeur de l'input hidden selling_plan.
   * @param {string} value - ID du selling plan ou chaîne vide
   */
  #updateSellingPlanInput(value) {
    if (this.sellingPlanInput) {
      this.sellingPlanInput.value = value;
    }
  }

  /**
   * Récupère l'ID du selling plan sélectionné.
   * @returns {string} ID du selling plan ou chaîne vide
   */
  getSelectedSellingPlan() {
    return this.sellingPlanInput?.value || '';
  }

  /**
   * Indique si l'option abonnement est sélectionnée.
   * @returns {boolean}
   */
  isSubscriptionSelected() {
    return this.subscriptionOption?.checked || false;
  }

  /**
   * Indique si le composant est visible (non masqué par les quantity breaks).
   * @returns {boolean}
   */
  isSubscriptionActivated() {
    return this.style.display !== 'none';
  }

  /**
   * Récupère l'ajustement de prix du selling plan sélectionné.
   * @returns {{ type: string, value: number } | null} Null si achat unique sélectionné
   */
  getPriceAdjustment() {
    if (!this.isSubscriptionSelected()) return null;
    return this.#getSelectedPlanAdjustment();
  }

  /**
   * Calcule le prix ajusté en fonction de l'abonnement sélectionné.
   * Utilisé par product-form.js pour le calcul du prix total.
   * @param {number} basePrice - Prix de base en centimes
   * @param {number} quantity - Nombre d'articles
   * @returns {number} Prix ajusté en centimes
   */
  calculateAdjustedPrice(basePrice, quantity = 1) {
    return this.#applyPriceAdjustment(basePrice, this.getPriceAdjustment(), quantity);
  }
}

customElements.define('subscription-component', SubscriptionComponent);
