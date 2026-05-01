import { formatMoney } from '@theme/utilities';
import { ThemeEvents } from '@theme/events';

class ProductPrice extends HTMLElement {
  constructor() {
    super();

    this.productForm = null;
  }

  connectedCallback() {
    this.productForm = this.closest('[data-ref="product-section-content"]')?.querySelector('[data-ref="product-form"]') || this.closest('[data-ref="popup-content"]')?.querySelector('[data-ref="product-form"]');

    this.productForm?.addEventListener(ThemeEvents.formUpdated, this.updatePrice);
    this.productForm?.addEventListener(ThemeEvents.variantUpdated, this.updateUnitPrice);
  }

  disconnectedCallback() {
    this.productForm?.removeEventListener(ThemeEvents.formUpdated, this.updatePrice);
    this.productForm?.removeEventListener(ThemeEvents.variantUpdated, this.updateUnitPrice);
  }

  updatePrice = (event) => {
    const priceContainer = this.querySelector('[data-ref="price-container"]');
    if (!priceContainer) return;

    // Récupérer les prix depuis l'événement
    const { price, compare_at_price, difference_price } = event.detail.prices;

    // Mettre à jour le prix
    const priceElement = priceContainer.querySelector('[data-ref="price"]');
    if (priceElement) {
      priceElement.innerHTML = formatMoney(price);
    }

    // Mettre à jour le prix barré
    const compareAtPriceElement = priceContainer.querySelector('[data-ref="compare-at-price"]');
    if (compareAtPriceElement) {
      compareAtPriceElement.innerHTML = compare_at_price > price ? formatMoney(compare_at_price) : '';
    }

    // Mettre à jour le badge de réduction
    const differencePriceElement = priceContainer.querySelector('[data-ref="difference-price-value"]');
    if (differencePriceElement) {
      const salesBadgeType = this.dataset.salesBadge;
      const showMinus = differencePriceElement.dataset.showMinus !== 'true';

      // Afficher le badge seulement s'il y a une réduction (compare_at_price > price)
      if (compare_at_price > price) {
        const prefix = showMinus ? '-' : '';
        if (salesBadgeType === 'percentage') {
          const percentage = Math.round(((compare_at_price - price) * 100) / compare_at_price);
          differencePriceElement.innerHTML = `${prefix}${percentage}%`;
        } else {
          differencePriceElement.innerHTML = `${prefix}${formatMoney(difference_price)}`;
        }
      } else {
        // Pas de réduction, vider le badge
        differencePriceElement.innerHTML = '';
      }
    }
  };

  updateUnitPrice = (event) => {
    const unitPriceElement = this.querySelector('[data-ref="unit-price"]');
    if (!unitPriceElement) return;

    const variant = event.detail.resource;
    if (!variant?.unit_price_measurement) {
      unitPriceElement.innerHTML = '';
      return;
    }

    const formattedPrice = formatMoney(variant.unit_price);
    const { reference_value, reference_unit } = variant.unit_price_measurement;
    const reference = reference_value !== 1 ? `${reference_value} ${reference_unit}` : reference_unit;
    unitPriceElement.innerHTML = `${formattedPrice} / ${reference}`;
  };
}

if (!customElements.get('product-price')) {
  customElements.define('product-price', ProductPrice);
}
