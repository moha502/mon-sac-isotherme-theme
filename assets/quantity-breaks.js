import { formatMoney } from '@theme/utilities';
import { QuantityBreaksUpdatedEvent, ThemeEvents } from '@theme/events';

class QuantityBreaks extends HTMLElement {
  constructor() {
    super();

    this.default_quantity_selected = null;
    this.quantity_break_items = null;
  }

  connectedCallback() {
    this.default_quantity_selected = this.dataset.quantitySelectedByDefault || 1;
    this.quantity_break_items = this.querySelectorAll('[data-ref="quantity-break-item"]');

    this.handleSubscriptionUpdate = () => this.#onSubscriptionUpdated();

    this.updateDefaultQuantitySelected();

    this.quantity_break_items.forEach((quantity_break) => {
      quantity_break.addEventListener('click', () => {
        if (quantity_break.classList.contains('quantity-break--selected')) return;
        if (quantity_break.classList.contains('quantity-break--disabled')) return;
        this.selectQuantity(quantity_break);
      });
    });

    document.addEventListener(ThemeEvents.variantUpdated, this.onVariantUpdated.bind(this));
    document.addEventListener(ThemeEvents.subscriptionUpdated, this.handleSubscriptionUpdate);
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.subscriptionUpdated, this.handleSubscriptionUpdate);
  }

  updateDefaultQuantitySelected() {
    this.resetSelectedQuantity();
    this.quantity_break_items[this.default_quantity_selected - 1].classList.add('quantity-break--selected');
  }

  selectQuantity(quantity_break) {
    this.resetSelectedQuantity();
    this.resetCrossSellCheckboxes();
    quantity_break.classList.add('quantity-break--selected');

    this.dispatchEvent(new QuantityBreaksUpdatedEvent());
  }

  resetCrossSellCheckboxes() {
    this.querySelectorAll('[data-ref="quantity-break-cross-sell-checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  resetSelectedQuantity() {
    this.quantity_break_items.forEach((quantity_break) => {
      quantity_break.classList.remove('quantity-break--selected');
    });
  }

  getSelectedQuantity() {
    return this.querySelector('.quantity-break--selected');
  }

  getPrices() {
    return this.getSelectedQuantity().getPrices();
  }

  getCrossSellPrices() {
    return this.getSelectedQuantity().getCrossSellPrices();
  }

  getDiscount() {
    return this.getSelectedQuantity().getDiscount();
  }

  getSelectedItems() {
    let items = [];

    if (this.isVariantSelectorActivated() && this.hasVariants()) {
      this.getSelectedQuantity()
        .querySelectorAll('[data-ref="quantity-break-variant-picker"]')
        .forEach((variant_picker) => {
          items.push({
            id: variant_picker.value,
            quantity: 1,
          });
        });
    } else {
      items.push({
        id: this.getSelectedQuantity().dataset.variantId,
        quantity: parseInt(this.getSelectedQuantity().dataset.quantity),
      });
    }

    // Ajouter les cross-sells cochés
    const crossSellItems = this.getSelectedQuantity().getCrossSellItems();
    items = [...items, ...crossSellItems];

    return items;
  }

  /**
   * Vérifie si le selector de variantes dans le quantity break est activé
   */
  isVariantSelectorActivated() {
    return this.dataset.showVariantPicker == 'true';
  }

  hasVariants() {
    return this.dataset.hasVariants == 'true';
  }

  onVariantUpdated(event) {
    // On récupère le DOM actuel du composant
    const currentQuantityBreaks = this;

    // Le event.detail est null si l'évenement de mise à jour est déclenché par les cross-sells à activer et non par les variantes, dans ce cas là on utilise le DOM actuel
    let newQuantityBreaks = currentQuantityBreaks;
    if (event && event.detail != null) {
      newQuantityBreaks = event.detail.data.html.querySelector('[data-ref="quantity-breaks"]');
    }

    if (!newQuantityBreaks || !currentQuantityBreaks) return;

    // On remplace le DOM actuel par le nouveau DOM
    if (currentQuantityBreaks !== newQuantityBreaks) {
      currentQuantityBreaks.querySelectorAll('[data-ref="quantity-break-item"]').forEach((quantity_break, index) => {
        const newQuantityBreak = newQuantityBreaks.querySelectorAll('[data-ref="quantity-break-item"]')[index];
        quantity_break.render(newQuantityBreak);
      });

      // Si l'item actuellement sélectionné est maintenant désactivé, on sélectionne le premier item disponible
      this.#handleDisabledSelectedItem();

      this.dispatchEvent(new QuantityBreaksUpdatedEvent());
    }
  }

  /**
   * Indique si le bloc est actif (visible et pris en compte dans les calculs de prix).
   * @returns {boolean}
   */
  isActive() {
    return !this.classList.contains('quantity-breaks--hidden');
  }

  #shouldBeActive() {
    const appliesTo = this.dataset.appliesTo || 'both';
    if (appliesTo === 'both') return true;

    const subscription = this.closest('[data-ref="product-form"]')?.querySelector('[data-ref="subscription"]');
    if (!subscription || typeof subscription.isSubscriptionSelected !== 'function') return true;

    const isSubscriptionSelected = subscription.isSubscriptionSelected();

    if (appliesTo === 'one_time') return !isSubscriptionSelected;
    if (appliesTo === 'subscription') return isSubscriptionSelected;
    return true;
  }

  #onSubscriptionUpdated() {
    const wasActive = this.isActive();
    const shouldBeActive = this.#shouldBeActive();

    if (wasActive === shouldBeActive) return;

    this.classList.toggle('quantity-breaks--hidden', !shouldBeActive);

    if (!shouldBeActive) {
      this.updateDefaultQuantitySelected();
      this.resetCrossSellCheckboxes();
    }

    this.dispatchEvent(new QuantityBreaksUpdatedEvent());
  }

  #handleDisabledSelectedItem() {
    const selectedItem = this.getSelectedQuantity();
    if (!selectedItem || !selectedItem.isDisabled()) return;

    // Trouver le premier item non désactivé
    const firstAvailableItem = Array.from(this.quantity_break_items).find((item) => !item.classList.contains('quantity-break--disabled'));

    if (firstAvailableItem) {
      this.resetSelectedQuantity();
      this.resetCrossSellCheckboxes();
      firstAvailableItem.classList.add('quantity-break--selected');
    }
  }
}

customElements.define('quantity-breaks', QuantityBreaks);

class QuantityBreakItem extends HTMLElement {
  constructor() {
    super();

    this.variant_pickers = null;
    this.price = null;
    this.cross_sells = null;
  }

  connectedCallback() {
    this.variant_pickers = this.querySelectorAll('[data-ref="quantity-break-variant-picker"]');
    this.variant_thumbnails = this.querySelectorAll('[data-ref="quantity-break-variant-thumbnail"]');
    this.price = this.querySelector('[data-ref="quantity-break-price"]');
    this.cross_sells = this.querySelectorAll('[data-ref="quantity-break-cross-sell"]');

    this.variant_pickers.forEach((variant_picker, index) => {
      variant_picker.addEventListener('change', () => {
        this.#updateTotalPrice();
        this.#updateVariantThumbnail(variant_picker, index);

        this.dispatchEvent(new QuantityBreaksUpdatedEvent());
      });
    });

    // Clic sur la ligne du cross-sell pour toggler le checkbox
    this.cross_sells.forEach((cross_sell) => {
      const checkbox = cross_sell.querySelector('[data-ref="quantity-break-cross-sell-checkbox"]');
      const checkboxLabel = checkbox?.closest('.checkbox');

      cross_sell.addEventListener('click', (e) => {
        e.stopPropagation();

        // Toggle le checkbox si le clic n'est pas sur le label du checkbox (qui gère déjà le toggle)
        if (checkbox && !checkboxLabel?.contains(e.target)) {
          checkbox.checked = !checkbox.checked;
          this.dispatchEvent(new QuantityBreaksUpdatedEvent());
        }
      });

      checkbox?.addEventListener('change', () => {
        this.dispatchEvent(new QuantityBreaksUpdatedEvent());
      });
    });
  }

  #updateVariantThumbnail(variant_picker, index) {
    const thumbnail_container = this.variant_thumbnails[index];
    if (!thumbnail_container) return;

    const selectedOption = variant_picker.options[variant_picker.selectedIndex];
    const variantImageUrl = selectedOption.dataset.variantImage;
    const variantImageAlt = selectedOption.dataset.variantImageAlt || '';

    if (variantImageUrl) {
      thumbnail_container.classList.remove('quantity-break__variant-thumbnail--hidden');
      thumbnail_container.innerHTML = `<img src="${variantImageUrl}" alt="${variantImageAlt}" width="40" height="40" loading="lazy">`;
    } else {
      thumbnail_container.classList.add('quantity-break__variant-thumbnail--hidden');
      thumbnail_container.innerHTML = '';
    }
  }

  #updateTotalPrice() {
    let totalPrice = 0;
    let totalCompareAtPrice = 0;

    this.variant_pickers.forEach((variant_picker) => {
      const selectedOption = variant_picker.options[variant_picker.selectedIndex];
      totalPrice += parseInt(selectedOption.dataset.price);
      if (selectedOption.dataset.compareAtPrice) {
        totalCompareAtPrice += parseInt(selectedOption.dataset.compareAtPrice);
      } else {
        totalCompareAtPrice += parseInt(selectedOption.dataset.price);
      }
    });

    // On calcule le montant de la réduction, en fonction du type de réduction (valeur ou pourcentage)
    const discountType = this.dataset.discountType;
    const discountValue = this.dataset.discountValue;
    const discountPercentage = this.dataset.discountPercentage;

    let totalDiscountValue = discountValue;
    if (discountType === 'percentage') {
      totalDiscountValue = (totalPrice * discountPercentage) / 100;
    }

    // On soustrait le montant de la réduction au prix total (minimum 0€)
    totalPrice = Math.max(0, totalPrice - totalDiscountValue);

    // On met à jour le prix total et les datasets
    this.price.querySelector('[data-ref="price"]').innerHTML = formatMoney(totalPrice);
    this.dataset.totalPrice = totalPrice;

    if (totalCompareAtPrice > totalPrice) {
      this.price.querySelector('[data-ref="compare-at-price"]').innerHTML = formatMoney(totalCompareAtPrice);
      this.dataset.totalCompareAtPrice = totalCompareAtPrice;
    } else {
      this.price.querySelector('[data-ref="compare-at-price"]').innerHTML = '';
      this.dataset.totalCompareAtPrice = totalPrice;
    }
  }

  render(newQuantityBreak) {
    // Met à jour les datasets de prix
    this.dataset.totalPrice = newQuantityBreak.dataset.totalPrice;
    this.dataset.totalCompareAtPrice = newQuantityBreak.dataset.totalCompareAtPrice;
    this.dataset.discountTotalValue = newQuantityBreak.dataset.discountTotalValue;
    this.dataset.variantId = newQuantityBreak.dataset.variantId;

    // Met à jour les prix
    this.price.querySelector('[data-ref="price"]').innerHTML = newQuantityBreak.querySelector('[data-ref="price"]').innerHTML;
    this.price.querySelector('[data-ref="compare-at-price"]').innerHTML = newQuantityBreak.querySelector('[data-ref="compare-at-price"]').innerHTML;

    // Met à jour l'image
    if (this.querySelector('[data-ref="quantity-break-image"]')) {
      this.querySelector('[data-ref="quantity-break-image"]').src = newQuantityBreak.querySelector('[data-ref="quantity-break-image"]').src;
    }

    // Met à jour l'état désactivé en fonction de la disponibilité de la nouvelle variante
    const isNewQuantityBreakDisabled = newQuantityBreak.classList.contains('quantity-break--disabled');
    this.classList.toggle('quantity-break--disabled', isNewQuantityBreakDisabled);
  }

  isDisabled() {
    return this.classList.contains('quantity-break--disabled');
  }

  getPrices() {
    const price = parseInt(this.dataset.totalPrice);
    const compareAtPrice = parseInt(this.dataset.totalCompareAtPrice);

    return {
      price: price,
      compareAtPrice: compareAtPrice,
    };
  }

  getCrossSellPrices() {
    return this.#getCheckedCrossSellPrices();
  }

  getCrossSellItems() {
    const items = [];

    // Récupérer dynamiquement les cross-sells pour éviter les problèmes de références
    const crossSells = this.querySelectorAll('[data-ref="quantity-break-cross-sell"]');
    crossSells.forEach((cross_sell) => {
      const checkbox = cross_sell.querySelector('[data-ref="quantity-break-cross-sell-checkbox"]');
      if (checkbox?.checked) {
        items.push({
          id: cross_sell.dataset.variantId,
          quantity: 1,
        });
      }
    });

    return items;
  }

  #getCheckedCrossSellPrices() {
    let price = 0;
    let compareAtPrice = 0;

    // Récupérer dynamiquement les cross-sells pour éviter les problèmes de références
    const crossSells = this.querySelectorAll('[data-ref="quantity-break-cross-sell"]');
    crossSells.forEach((cross_sell) => {
      const checkbox = cross_sell.querySelector('[data-ref="quantity-break-cross-sell-checkbox"]');
      if (checkbox?.checked) {
        const itemPrice = parseInt(cross_sell.dataset.price) || 0;
        const itemCompareAtPrice = parseInt(cross_sell.dataset.compareAtPrice) || itemPrice;
        price += itemPrice;
        compareAtPrice += itemCompareAtPrice;
      }
    });

    return { price, compareAtPrice };
  }

  getDiscount() {
    return {
      type: this.dataset.discountType || 'percentage',
      value: parseInt(this.dataset.discountValue) || 0,
      percentage: parseInt(this.dataset.discountPercentage) || 0,
    };
  }
}
customElements.define('quantity-break-item', QuantityBreakItem);
