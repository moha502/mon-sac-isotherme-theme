class CartNote extends HTMLElement {
  constructor() {
    super();
    this.cartNoteInput = null;
  }

  connectedCallback() {
    this.cartNoteInput = this.querySelector('[data-ref="cart-note-input"]');
    this.cartNoteInput.addEventListener('input', (event) => this.#handleCartNoteInputChange(event));
  }

  disconnectedCallback() {
    this.cartNoteInput.removeEventListener('input', (event) => this.#handleCartNoteInputChange(event));
  }

  #handleCartNoteInputChange(event) {
    let inputTimeout;
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
      const body = JSON.stringify({ note: event.target.value });
      fetch(Theme.routes.cart_update_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body,
      });
    }, 300);
  }
}

if (!customElements.get('cart-note')) {
  customElements.define('cart-note', CartNote);
}
