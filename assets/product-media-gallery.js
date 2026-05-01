import { ThemeEvents } from '@theme/events';

class ProductMediaGallery extends HTMLElement {
  connectedCallback() {
    const closestSection = this.closest('.shopify-section, dialog');
    if (!closestSection) return;
    closestSection.addEventListener(ThemeEvents.variantUpdated, this.updateMediaGallery);
  }

  disconnectedCallback() {
    const closestSection = this.closest('.shopify-section, dialog');
    if (!closestSection) return;
    closestSection.removeEventListener(ThemeEvents.variantUpdated, this.updateMediaGallery);
  }

  updateMediaGallery = (event) => {
    const newMediaGallery = event.detail.data.html.querySelector('product-media-gallery slider-component');
    const currentMediaGallery = this.querySelector('slider-component');

    if (!newMediaGallery || !currentMediaGallery) return;

    if (currentMediaGallery.innerHTML !== newMediaGallery.innerHTML) {
      currentMediaGallery.replaceWith(newMediaGallery);
    }
  };
}

if (!customElements.get('product-media-gallery')) {
  customElements.define('product-media-gallery', ProductMediaGallery);
}
