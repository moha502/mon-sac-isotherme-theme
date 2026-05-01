class SwatchInput extends HTMLElement {
  constructor() {
    super();

    this.input = null;
    this.hasVariantUrl = false;
  }

  connectedCallback() {
    this.input = this.querySelector('input');
    this.hasVariantUrl = this.input.dataset.variantUrl !== undefined;

    if (this.hasVariantUrl) {
      this.input.addEventListener('click', this.handleClick.bind(this));
    }
  }

  handleClick(event) {
    event.preventDefault();

    const variantUrl = this.input.dataset.variantUrl;
    window.location.href = variantUrl;
  }
}

if (!customElements.get('swatch-input')) {
  customElements.define('swatch-input', SwatchInput);
}
