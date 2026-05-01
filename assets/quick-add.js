import { CartUpdatedEvent, ThemeEvents } from '@theme/events';

class QuickAddComponent extends HTMLElement {
  #abortController = null;
  #parentSliderComponent = null;

  constructor() {
    super();

    this.addToCartButton = null;
    this.popupComponent = null;
    this.popupModal = null;
    this.popupToggle = null;
    this.popupModalContent = null;
    this.showProductMediaGallery = null;
  }

  connectedCallback() {
    this.addToCartButton = this.querySelector('[data-ref="add-to-cart-button"]');
    this.popupComponent = this.querySelector('[data-ref="popup-component"]');
    this.popupModal = this.popupComponent?.querySelector('[data-ref="popup-modal"]');
    this.popupToggle = this.popupComponent?.querySelector('[data-ref="popup-toggle"]');
    this.popupModalContent = this.popupComponent?.querySelector('[data-ref="popup-content"]');
    this.showProductMediaGallery = this.popupComponent?.dataset.showProductMediaGallery;
    this.#parentSliderComponent = this.closest('slider-component');

    this.addToCartButton?.addEventListener('click', this.#handleAddToCart);
    this.popupToggle?.addEventListener('click', this.#handlePopupToggle);
    this.popupModal?.addEventListener('close', this.#handlePopupClose);

    document.addEventListener(ThemeEvents.cartUpdated, () => this.#handleCartUpdate());
  }

  disconnectedCallback() {
    this.addToCartButton?.removeEventListener('click', this.#handleAddToCart);
    this.popupToggle?.removeEventListener('click', this.#handlePopupToggle);
    this.popupModal?.removeEventListener('close', this.#handlePopupClose);

    document.removeEventListener(ThemeEvents.cartUpdated, () => this.#handleCartUpdate());
  }

  #handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    this.addToCartButton.classList.add('is-loading');

    let items = [];

    items.push({
      id: this.addToCartButton.dataset.variantId,
      quantity: 1,
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

      this.addToCartButton.classList.remove('is-loading');
    } catch (error) {
      console.error('Error:', error);
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
            source: 'quick-add',
            sections: data.sections,
          },
        ),
      );

      const addToCartBehavior = document.querySelector('cart-icon')?.addToCartBehavior;
      if (addToCartBehavior === 'notification') {
        document.dispatchEvent(
          new CustomEvent('toast:open', {
            detail: { type: 'success', message: Theme.translations.addToCartNotificationMessage },
          }),
        );
      }
    }
  }

  #handlePopupToggle = async (event) => {
    this.popupModalContent.classList.add('is-loading');
    event.preventDefault();
    event.stopPropagation();

    this.#disableParentSliderDrag();

    const productPageHtml = await this.fetchProductPage(this.popupToggle.dataset.productPageUrl);

    if (productPageHtml) {
      const sourceRef = this.showProductMediaGallery === 'false' ? 'product-section-product-info' : 'product-section-content';
      this.popupModalContent.innerHTML = productPageHtml.querySelector(`[data-ref="${sourceRef}"]`).innerHTML;
      this.#activateScripts(this.popupModalContent);
    }

    // Notifier le product-form que le contenu est chargé pour déclencher la mise à jour des prix
    const productForm = this.popupModalContent.querySelector('[data-ref="product-form"]');
    productForm?.dispatchEvent(new CustomEvent('quickAddContentLoaded'));

    this.popupModalContent.classList.remove('is-loading');
  };

  #activateScripts(container) {
    for (const script of container.querySelectorAll('script')) {
      const activeScript = document.createElement('script');

      for (const attr of script.attributes) {
        activeScript.setAttribute(attr.name, attr.value);
      }

      activeScript.textContent = script.textContent;
      script.replaceWith(activeScript);
    }
  }

  #handlePopupClose = () => {
    this.#enableParentSliderDrag();
    this.popupModalContent?.replaceChildren();
  };

  #disableParentSliderDrag() {
    if (!this.#parentSliderComponent?.slider) return;
    this.#parentSliderComponent.slider.options = { drag: false };
  }

  #enableParentSliderDrag() {
    if (!this.#parentSliderComponent?.slider) return;
    this.#parentSliderComponent.slider.options = { drag: true };
  }

  #handleCartUpdate = () => {
    this.popupComponent?.close();
  };

  async fetchProductPage(productPageUrl) {
    if (!productPageUrl) return null;

    // We use this to abort the previous fetch request if it's still pending.
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      const response = await fetch(productPageUrl, {
        signal: this.#abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product page: HTTP error ${response.status}`);
      }

      const responseText = await response.text();
      const html = new DOMParser().parseFromString(responseText, 'text/html');

      return html;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      } else {
        throw error;
      }
    } finally {
      this.#abortController = null;
    }
  }
}

if (!customElements.get('quick-add-component')) {
  customElements.define('quick-add-component', QuickAddComponent);
}
