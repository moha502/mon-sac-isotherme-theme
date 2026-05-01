class ProductCardSwatches extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
  }

  #onClick = (e) => {
    const swatch = e.target.closest('[data-href]');
    if (swatch) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = swatch.dataset.href;
    }
  };
}

if (!customElements.get('product-card-swatches')) {
  customElements.define('product-card-swatches', ProductCardSwatches);
}