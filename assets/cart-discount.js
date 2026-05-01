import { CartUpdatedEvent } from '@theme/events';

class CartDiscount extends HTMLElement {
  constructor() {
    super();
    this.applyButton = null;
    this.inputDiscount = null;
    this.removeDiscountButtons = null;
  }

  connectedCallback() {
    this.applyButton = this.querySelector('[data-ref="apply-discount"]');
    this.inputDiscount = this.querySelector('[data-ref="discount-input"]');
    this.removeDiscountButtons = this.querySelectorAll('[data-ref="remove-discount"]');

    this.applyButton.addEventListener('click', (event) => this.submitDiscount(event));
    this.removeDiscountButtons.forEach((button) => button.addEventListener('click', (event) => this.removeDiscount(event)));
  }

  disconnectedCallback() {
    this.applyButton.removeEventListener('click', (event) => this.submitDiscount(event));
    this.removeDiscountButtons.forEach((button) => button.removeEventListener('click', (event) => this.removeDiscount(event)));
  }

  submitDiscount(event) {
    event.preventDefault();
    event.stopPropagation();

    this.setButtonLoading();

    const discountCode = this.inputDiscount.value;
    if (discountCode === '') {
      this.setErrorMode(this.dataset.pleaseInsertACode);
    } else {
      this.applyCode(discountCode);
    }
  }

  removeDiscount = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const abortController = new AbortController();

    const badge = event.target.closest('[data-ref="discount-badge"]');
    if (!(badge instanceof HTMLElement)) return;

    const discountCode = badge.dataset.discountCode;
    if (!discountCode) return;

    const existingDiscounts = this.#existingDiscounts();
    const index = existingDiscounts.indexOf(discountCode);
    if (index === -1) return;

    existingDiscounts.splice(index, 1);

    // On ajoute la section cart-drawer à la requête pour la mettre à jour
    const sections = [];
    if (document.querySelector('cart-drawer')) {
      const section_cart_drawer_id = document.querySelector('cart-drawer').dataset.sectionId;
      sections.push(section_cart_drawer_id);
    }

    try {
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          discount: existingDiscounts.join(','),
          sections: sections.join(','),
        }),
        signal: abortController.signal,
      };

      const response = await fetch(Theme.routes.cart_update_url, config);
      const data = await response.json();

      this.updateCart(data);

      this.setButtonLoaded();
    } catch (error) {
      console.error(this.dataset.errorRemoveDiscount + ': ', error);

      document.dispatchEvent(new CustomEvent('toast:open', { detail: { type: 'error', message: this.dataset.errorRemoveDiscount } }));
    }
  };

  async applyCode(discountCode) {
    const abortController = new AbortController();

    this.setButtonLoading();

    try {
      const existingDiscounts = this.#existingDiscounts();

      if (existingDiscounts.includes(discountCode)) {
        this.setErrorMode(this.dataset.codeAlreadyApplied);
        return;
      }

      // On ajoute la section cart-drawer à la requête pour la mettre à jour
      const sections = [];
      if (document.querySelector('cart-drawer')) {
        const section_cart_drawer_id = document.querySelector('cart-drawer').dataset.sectionId;
        sections.push(section_cart_drawer_id);
      }

      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          discount: [...existingDiscounts, discountCode].join(','),
          sections: sections.join(','),
        }),
        signal: abortController.signal,
      };

      const response = await fetch(Theme.routes.cart_update_url, config);
      const data = await response.json();

      const failedDiscount = data.discount_codes?.find((discount) => discount.code === discountCode && discount.applicable === false);

      if (failedDiscount) {
        this.setErrorMode(this.dataset.codeNotApplicable);
        return;
      }

      this.updateCart(data);

      this.setButtonLoaded();
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error(this.dataset.errorApplyDiscount + ': ', error);

      this.setErrorMode(this.dataset.errorApplyDiscount);
    }
  }

  updateCart(data) {
    if (window.location.pathname.includes('/cart')) {
      window.location.reload();
    } else {
      document.dispatchEvent(
        new CartUpdatedEvent(
          {},
          {
            source: 'cart-discount',
            sections: data.sections,
          },
        ),
      );
    }
  }

  #existingDiscounts() {
    const discountCodes = [];
    const discountBadges = this.querySelectorAll('[data-ref="discount-badge"]');

    for (const badge of discountBadges) {
      if (badge instanceof HTMLElement && typeof badge.dataset.discountCode === 'string') {
        discountCodes.push(badge.dataset.discountCode);
      }
    }

    return discountCodes;
  }

  setErrorMode(message) {
    this.setButtonLoaded();

    document.dispatchEvent(new CustomEvent('toast:open', { detail: { type: 'error', message: message } }));

    this.inputDiscount.closest('.textfield').classList.add('textfield--error');
    this.inputDiscount.value = '';

    setTimeout(() => {
      this.inputDiscount.closest('.textfield').classList.remove('textfield--error');
    }, 2000);
  }

  setButtonLoading() {
    this.applyButton.disabled = true;
    this.applyButton.classList.add('is-loading');
  }

  setButtonLoaded() {
    this.applyButton.disabled = false;
    this.applyButton.classList.remove('is-loading');
  }
}

customElements.define('cart-discount', CartDiscount);
