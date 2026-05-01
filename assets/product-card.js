class ProductCard extends HTMLElement {
  constructor() {
    super();

    this.productUrl = null;
  }

  connectedCallback() {
    this.productUrl = this.dataset.productUrl;

    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  handleClick(event) {
    if (event.target instanceof Element) {
      const interactiveElement = event.target.closest(
        'button, input, label, select, [tabindex="1"], a, quick-add-component, add-to-wishlist-button',
      );
      if (interactiveElement) return;
    }

    window.location.href = this.productUrl;
  }
}

if (!customElements.get('product-card')) {
  customElements.define('product-card', ProductCard);
}
