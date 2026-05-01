class CartComponent extends HTMLElement {
  constructor() {
    super();
    this.checkoutButton = null;
  }

  connectedCallback() {
    this.checkoutButton = this.querySelector('[data-ref="checkout-button"]');

    this.checkoutButton.addEventListener('click', (event) => this.#handleCheckoutButtonClick(event));
  }

  disconnectedCallback() {
    this.checkoutButton.removeEventListener('click', (event) => this.#handleCheckoutButtonClick(event));
  }

  #handleCheckoutButtonClick(event) {
    event.target.classList.add('is-loading');
  }
}

if (!customElements.get('cart-component')) {
  customElements.define('cart-component', CartComponent);
}

class CartItem extends HTMLElement {
  constructor() {
    super();

    this.removeItemButton = null;
    this.quantitySelectorInput = null;
    this.cartForm = null;
  }

  connectedCallback() {
    this.removeItemButton = this.querySelector('[data-ref="remove-item"]');
    this.quantitySelectorInput = this.querySelector('[data-ref="quantity-selector-input"]');
    this.cartForm = this.closest('[data-ref="cart-form"]');

    this.removeItemButton.addEventListener('click', (event) => this.#handleItemRemove(event));
    this.quantitySelectorInput.addEventListener('change', (event) => this.#handleQuantityInputChange(event));
  }

  disconnectedCallback() {
    this.quantitySelectorInput.removeEventListener('change', (event) => this.#handleQuantityInputChange(event));
    this.removeItemButton.removeEventListener('click', (event) => this.#handleItemRemove(event));
  }

  #handleItemRemove(event) {
    event.preventDefault();
    this.#updateLineItemQuantity(this.dataset.index, 0);
  }

  #handleQuantityInputChange(event) {
    event.preventDefault();
    this.#updateLineItemQuantity(this.dataset.index, this.quantitySelectorInput.value);
  }

  #updateLineItemQuantity(line, quantity) {
    this.#enableLoading();

    const body = JSON.stringify({
      line,
      quantity,
    });

    fetch(Theme.routes.cart_change_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: `application/json` },
      ...{ body },
    })
      .then((response) => {
        return response.text();
      })
      .then((responsetext) => {
        const parsedResponseText = JSON.parse(responsetext);

        if (parsedResponseText.errors) {
          const message = parsedResponseText.errors.join(', ');
          document.dispatchEvent(new CustomEvent('toast:open', { detail: { type: 'error', message: message } }));
          return;
        }
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        window.location.reload();
      });
  }

  #enableLoading() {
    this.cartForm.classList.add('cart__form--loading');
  }
}

if (!customElements.get('cart-item')) {
  customElements.define('cart-item', CartItem);
}
