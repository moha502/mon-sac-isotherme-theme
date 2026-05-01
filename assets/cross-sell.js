import { CartUpdatedEvent } from '@theme/events';
import { formatMoney } from '@theme/utilities';

class CrossSellComponent extends HTMLElement {
  constructor() {
    super();

    this.selects = null;
    this.form = null;
    this.formInputs = [];
    this.submitButton = null;
    this.isInCart = false;
    this.isInASlider = false;
    this.productHandle = null;
  }

  connectedCallback() {
    this.selects = this.querySelectorAll('[data-ref="variant-select"]');
    this.form = this.querySelector('[data-ref="add-to-cart-form"]');
    this.formInputs = this.querySelectorAll('[data-ref="product-input"]');
    this.submitButton = this.querySelector('[data-ref="add-to-cart-button"]');
    this.isInCart = this.closest('cart-drawer') || this.closest('cart-component') ? true : false;
    this.isInASlider = this.closest('slider-component') ? true : false;
    this.productHandle = this.dataset.productHandle;

    this.submitButton.addEventListener('click', this.#handleSubmit);

    this.selects.forEach((select) => {
      select.addEventListener('change', this.#handleSelectChange);
    });

    if (this.isInCart) this.#synchronizeWithCartContent();
  }

  disconnectedCallback() {
    this.submitButton.removeEventListener('click', this.#handleSubmit);

    this.selects.forEach((select) => {
      select.removeEventListener('change', this.#handleSelectChange);
    });
  }

  #handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    this.submitButton.classList.add('is-loading');

    let items = [];

    this.selects.forEach((select) => {
      items.push({
        id: select.value,
        quantity: 1,
      });
    });

    const sections = [];
    if (document.querySelector('cart-drawer')) {
      const section_cart_drawer_id = document.querySelector('cart-drawer').dataset.sectionId;
      sections.push(section_cart_drawer_id);
    }

    try {
      const response = await fetch(Theme.routes.cart_add_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items,
          sections: sections.join(','),
        }),
      });

      const data = await response.json();

      this.updateCart(data, items.length);

      this.submitButton.classList.remove('is-loading');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  #handleSelectChange = (event) => {
    event.preventDefault();
    event.stopPropagation();

    this.submitButton.disabled = true;
    this.updateBundlePrices();

    this.submitButton.disabled = false;

    if (this.dataset.dynamicVariantImage === 'true') {
      this.updateImage();
    }
  };

  updateCart(data, itemsAdded) {
    if (window.location.pathname.includes('/cart')) {
      window.location.reload();
    } else {
      const currentItemCount = document.querySelector('cart-icon')?.getCurrentItemCount();

      let newItemCount;
      if (currentItemCount != null) {
        newItemCount = currentItemCount + itemsAdded;
      }

      document.dispatchEvent(
        new CartUpdatedEvent(
          {},
          {
            itemCount: newItemCount,
            source: 'cross-sell',
            sections: data.sections,
          },
        ),
      );
    }
  }

  updateBundlePrices() {
    const priceContainer = this.querySelector('.price-container .price');
    const compareAtPriceContainer = this.querySelector('.price-container .compare-at-price');

    let price = 0;
    let compareAtPrice = 0;

    this.selects.forEach((select) => {
      const selectedOption = select.options[select.selectedIndex];

      if (selectedOption != null) {
        price += parseInt(selectedOption.dataset.price);
        compareAtPrice += parseInt(selectedOption.dataset.compareAtPrice) || parseInt(selectedOption.dataset.price);
      } else {
        price += parseInt(select.dataset.price);
        compareAtPrice += parseInt(select.dataset.compareAtPrice) || parseInt(select.dataset.price);
      }
    });

    priceContainer.innerText = formatMoney(price);
    if (compareAtPrice > price) {
      compareAtPriceContainer.innerText = formatMoney(compareAtPrice);
    } else {
      compareAtPriceContainer.innerText = '';
    }
  }

  updateImage() {
    const image = this.querySelector('[data-ref="cross-sell-image"]');
    if (!image) return;

    const selectedOption = this.selects[0].options[this.selects[0].selectedIndex];
    if (!selectedOption.dataset.image) return;

    image.src = selectedOption.dataset.image;
  }

  // Si le cross-sell est dans un panier, et que le produit est dans le panier, on masque le cross-sell
  #synchronizeWithCartContent() {
    let cartItems = null;
    if (this.closest('cart-drawer')) cartItems = this.closest('cart-drawer').querySelectorAll('[data-ref="cart-item"]');
    if (this.closest('cart-component')) cartItems = this.closest('cart-component').querySelectorAll('[data-ref="cart-item"]');

    if (!cartItems) return;

    const closestSlider = this.closest('slider-component');

    cartItems.forEach((cartItem) => {
      if (cartItem.dataset.productHandle === this.productHandle) {
        if (this.isInASlider) {
          closestSlider.querySelectorAll('.splide__slide').forEach((slide, index) => {
            if (slide == this.closest('.splide__slide')) {
              closestSlider.remove(index);
            }
          });
        } else {
          this.classList.add('hidden');
        }
      }
    });
  }
}

if (!customElements.get('cross-sell-component')) {
  customElements.define('cross-sell-component', CrossSellComponent);
}
