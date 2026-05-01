import { formatMoney } from '@theme/utilities';
import { ToggleCrossSellsUpdatedEvent } from '@theme/events';

class ToggleCrossSellList extends HTMLElement {
  constructor() {
    super();

    this.crossSells = null;
  }

  connectedCallback() {
    this.crossSells = this.querySelectorAll('[data-ref="toggle-cross-sell"]');
  }

  getSelectedItems() {
    let items = [];
    let total_price = 0;
    let total_compare_at_price = 0;

    this.crossSells.forEach((crossSell) => {
      const checkbox = crossSell.querySelector('[data-ref="toggle-cross-sell-checkbox"]');
      const button = crossSell.querySelector('[data-ref="toggle-cross-sell-button"]');

      if (checkbox != null && checkbox.checked == true) {
        items.push({
          id: checkbox.dataset.variantId,
          quantity: 1,
        });

        total_price += parseInt(crossSell.getPrices().price);
        total_compare_at_price += parseInt(crossSell.getPrices().compareAtPrice);
      }

      if (button != null && button.classList.contains('button--active') == true) {
        items.push({
          id: button.dataset.variantId,
          quantity: 1,
        });

        total_price += parseInt(crossSell.getPrices().price);
        total_compare_at_price += parseInt(crossSell.getPrices().compareAtPrice);
      }
    });

    return { items: items, total_price: total_price, total_compare_at_price: total_compare_at_price };
  }
}

if (!customElements.get('toggle-cross-sell-list')) {
  customElements.define('toggle-cross-sell-list', ToggleCrossSellList);
}

class ToggleCrossSell extends HTMLElement {
  constructor() {
    super();

    this.checkbox = null;
    this.button = null;
    this.select = null;
    this.image = null;
    this.price = null;
  }

  connectedCallback() {
    this.checkbox = this.querySelector('[data-ref="toggle-cross-sell-checkbox"]');
    this.button = this.querySelector('[data-ref="toggle-cross-sell-button"]');
    this.select = this.querySelector('[data-ref="toggle-cross-sell-select"]');
    this.image = this.querySelector('[data-ref="toggle-cross-sell-image"]');
    this.price = this.querySelector('[data-ref="toggle-cross-sell-price"]');

    this.select?.addEventListener('change', this.variantChanged.bind(this));
    this.button?.addEventListener('click', this.toggleAddButton.bind(this));
    this.checkbox?.addEventListener('change', this.checkboxChanged.bind(this));
  }

  disconnectedCallback() {
    this.select?.removeEventListener('change', this.variantChanged.bind(this));
    this.button?.removeEventListener('click', this.toggleAddButton.bind(this));
  }

  checkboxChanged() {
    document.dispatchEvent(new ToggleCrossSellsUpdatedEvent());
  }

  toggleAddButton(active) {
    if (this.button.classList.contains('button--active') == false || active == true) {
      this.button.classList.add('button--active');
      this.button.classList.remove('button--secondary');
    } else {
      this.button.classList.remove('button--active');
      this.button.classList.add('button--secondary');
    }

    document.dispatchEvent(new ToggleCrossSellsUpdatedEvent());
  }

  variantChanged() {
    const optionSelected = this.select.options[this.select.selectedIndex];

    this.updateProductPrice(optionSelected);
    this.updateProductImage(optionSelected);
    this.updateVariantId(optionSelected);

    if (this.checkbox != null) this.checkbox.checked = true;
    if (this.button != null) this.toggleAddButton(true);

    document.dispatchEvent(new ToggleCrossSellsUpdatedEvent());
  }

  updateProductPrice(optionSelected) {
    const variantPrice = optionSelected.dataset.price;
    const variantCompareAtPrice = optionSelected.dataset.compareAtPrice;

    this.price.querySelector('.price').innerHTML = formatMoney(variantPrice);
    this.dataset.price = variantPrice;

    if (variantCompareAtPrice != null) {
      this.price.querySelector('.compare-at-price').innerHTML = formatMoney(variantCompareAtPrice);
      this.dataset.compareAtPrice = variantCompareAtPrice;
    }
  }

  updateProductImage(optionSelected) {
    const variantImage = optionSelected.dataset.variantImage;

    if (variantImage != null && this.image != null) {
      this.image.querySelector('img').src = variantImage;
    }
  }

  updateVariantId(optionSelected) {
    const variantId = optionSelected.value;

    if (this.checkbox != null) this.checkbox.dataset.variantId = variantId;
    if (this.button != null) this.button.dataset.variantId = variantId;
  }

  getPrices() {
    let price = 0;
    let compareAtPrice = 0;

    if (this.dataset.price != null) {
      price = parseInt(this.dataset.price);
    }

    if (this.dataset.compareAtPrice != null) {
      compareAtPrice = parseInt(this.dataset.compareAtPrice);
    } else {
      compareAtPrice = parseInt(this.dataset.price);
    }

    return {
      price: price,
      compareAtPrice: compareAtPrice,
    };
  }
}

if (!customElements.get('toggle-cross-sell')) {
  customElements.define('toggle-cross-sell', ToggleCrossSell);
}
