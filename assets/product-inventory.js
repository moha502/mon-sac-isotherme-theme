import { ThemeEvents } from '@theme/events';

class ProductInventory extends HTMLElement {
  connectedCallback() {
    document.addEventListener(ThemeEvents.variantUpdated, this.updateInventory);
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.variantUpdated, this.updateInventory);
  }

  updateInventory = (event) => {
    const newInventory = event.detail.data.html.querySelector('product-inventory [data-ref="product-inventory"]');
    const currentInventory = this.querySelector('[data-ref="product-inventory"]');

    if (!newInventory || !currentInventory) return;

    if (currentInventory.innerHTML !== newInventory.innerHTML) {
      currentInventory.replaceWith(newInventory);
    }
  };
}

if (!customElements.get('product-inventory')) {
  customElements.define('product-inventory', ProductInventory);
}
