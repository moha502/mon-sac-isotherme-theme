class QuantitySelector extends HTMLElement {
  constructor() {
    super();

    this.quantityInput = null;
    this.minusButton = null;
    this.plusButton = null;
    this.previousValue = null;
  }

  connectedCallback() {
    this.quantityInput = this.querySelector('input[type="number"]');
    this.minusButton = this.querySelector('button[name="minus"]');
    this.plusButton = this.querySelector('button[name="plus"]');
    this.previousValue = this.quantityInput.value;

    this.minusButton.addEventListener('click', this.decreaseQuantity.bind(this));
    this.plusButton.addEventListener('click', this.increaseQuantity.bind(this));
    this.quantityInput.addEventListener('change', this.#validateQuantity.bind(this));

    // Vérifier l'état initial des boutons
    this.#updateButtonStates();
  }

  disconnectedCallback() {
    this.minusButton.removeEventListener('click', this.decreaseQuantity.bind(this));
    this.plusButton.removeEventListener('click', this.increaseQuantity.bind(this));
    this.quantityInput.removeEventListener('change', this.#validateQuantity.bind(this));
  }

  // Incrémente la quantité de 1
  increaseQuantity(event) {
    event.preventDefault();
    this.previousValue = this.quantityInput.value;
    this.quantityInput.stepUp();
    this.#updateButtonStates();
    this.quantityInput.dispatchEvent(new Event('change'));
  }

  // Décrémente la quantité de 1
  decreaseQuantity(event) {
    event.preventDefault();
    this.previousValue = this.quantityInput.value;
    this.quantityInput.stepDown();
    this.#updateButtonStates();
    this.quantityInput.dispatchEvent(new Event('change'));
  }

  // Définit la quantité et la valide
  setQuantity(quantity) {
    this.previousValue = this.quantityInput.value;
    this.quantityInput.value = quantity;
    this.#validateQuantity();
    this.#updateButtonStates();
    this.quantityInput.dispatchEvent(new Event('change'));
  }

  // Valide la quantité pour qu'elle soit entre min et max, sinon on remet la quantité précédente
  #validateQuantity() {
    const value = parseInt(this.quantityInput.value);
    const min = parseInt(this.quantityInput.min) || 1;
    const max = parseInt(this.quantityInput.max) || Infinity;

    if (value < min || value > max || isNaN(value)) {
      this.quantityInput.value = this.previousValue;
      this.#updateButtonStates();
      return;
    }

    this.previousValue = value;
    this.#updateButtonStates();
  }

  // Met à jour l'état des boutons selon les limites min/max
  #updateButtonStates() {
    const currentValue = parseInt(this.quantityInput.value);
    const min = parseInt(this.quantityInput.min) || 1;
    const max = parseInt(this.quantityInput.max) || Infinity;

    // Désactiver le bouton minus si on est au minimum
    if (currentValue <= min) {
      this.minusButton.disabled = true;
    } else {
      this.minusButton.disabled = false;
    }

    // Désactiver le bouton plus si on est au maximum
    if (currentValue >= max) {
      this.plusButton.disabled = true;
    } else {
      this.plusButton.disabled = false;
    }
  }
}

if (!customElements.get('quantity-selector')) {
  customElements.define('quantity-selector', QuantitySelector);
}
