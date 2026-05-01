import { isElementInViewport } from '@theme/utilities';

class StickyAddToCart extends HTMLElement {
  constructor() {
    super();

    this.form = null;
    this.footer = null;
  }

  connectedCallback() {
    this.form = this.closest('[data-ref="product-form"]');
    this.footer = document.querySelector('[data-ref="footer"]');

    this.#displayStickyAddToCart();

    window.addEventListener('scroll', () => {
      this.#displayStickyAddToCart();
    });
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', () => {
      this.#displayStickyAddToCart();
    });
  }

  #displayStickyAddToCart() {
    if (isElementInViewport(this.form) || isElementInViewport(this.footer)) {
      this.dataset.active = 'false';
      this.classList.remove('color-scheme-1');
    } else {
      this.dataset.active = 'true';
      this.classList.add('color-scheme-1');
    }
  }
}

if (!customElements.get('sticky-add-to-cart')) {
  customElements.define('sticky-add-to-cart', StickyAddToCart);
}
