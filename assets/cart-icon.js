import { ThemeEvents } from '@theme/events';

class CartIcon extends HTMLElement {
  constructor() {
    super();
    this.cartCount = null;
    this.addToCartBehavior = null;

    this.clickHandler = this.handleClick.bind(this);
    this.cartUpdatedHandler = this.onCartUpdated.bind(this);
  }

  connectedCallback() {
    this.addToCartBehavior = this.dataset.addToCartBehavior || 'open_cart';

    this.cartCount = this.querySelector('[data-ref="cart-count"]');

    this.addEventListener('click', this.clickHandler);
    document.addEventListener(ThemeEvents.cartUpdated, this.cartUpdatedHandler);
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.cartUpdated, this.cartUpdatedHandler);
    this.removeEventListener('click', this.clickHandler);
  }

  getCurrentItemCount() {
    return parseInt(this.cartCount.textContent);
  }

  onCartUpdated(event) {
    this.cartCount.textContent = event.detail.data.itemCount;
    if (this.addToCartBehavior == 'open_cart') this.openCart();

    setTimeout(() => {
      this.ensureCartCountIsCorrect();
    }, 100);
  }

  // Cette fonction est utile pour les applications de gift ou autre qui viennent modifier le panier pendant sa mise à jour. Ca permet de s'assurer que le compteur est correct.
  ensureCartCountIsCorrect() {
    const cartDrawer = document.querySelector('[data-ref="cart-drawer"]');
    if (!cartDrawer) return;

    let cartCount = 0;
    const cartItems = cartDrawer.querySelectorAll('[data-ref="cart-item"]');
    cartItems.forEach((cartItem) => {
      cartCount += parseInt(cartItem.querySelector('[data-ref="quantity-selector-input"]').value);
    });

    if (cartCount != this.getCurrentItemCount()) {
      this.cartCount.textContent = cartCount;
    }
  }

  handleClick() {
    this.openCart();
  }

  openCart() {
    const cartDrawer = document.querySelector('[data-ref="cart-drawer"]');
    if (cartDrawer) {
      cartDrawer.open();
    } else {
      window.location.href = Theme.routes.cart_url;
    }
  }
}

if (!customElements.get('cart-icon')) {
  customElements.define('cart-icon', CartIcon);
}
