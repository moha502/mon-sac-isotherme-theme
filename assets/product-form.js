import { formatMoney } from '@theme/utilities';
import { ThemeEvents, CartUpdatedEvent, FormUpdatedEvent } from '@theme/events';

class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = null;
    this.addToCartButton = null;
    this.addToCartButtonContainer = null;
    this.addToCartBehavior = null;
    this.toggleCrossSells = null;
    this.quantityBreaks = null;
    this.subscription = null;
    this.quantitySelectorInput = null;

    // Handlers bindés pour pouvoir les retirer correctement
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onVariantSelected = this.onVariantSelected.bind(this);
    this.onFormUpdated = this.onFormUpdated.bind(this);
  }

  connectedCallback() {
    this.form = this.querySelector('form[action$="/cart/add"]');
    this.addToCartButton = this.querySelector('[data-ref="add-to-cart-button"]');
    this.addToCartButtonContainer = this.querySelector('[data-ref="add-to-cart-button-container"]');
    this.addToCartBehavior = document.querySelector('cart-icon')?.addToCartBehavior || 'open_cart';
    this.toggleCrossSells = this.querySelector('[data-ref="toggle-cross-sells"]');
    this.quantityBreaks = this.querySelector('[data-ref="quantity-breaks"]');
    this.subscription = this.querySelector('[data-ref="subscription"]');
    this.quantitySelectorInput = this.querySelector('[data-ref="product-quantity-selector"] input[name="quantity"]');

    this.form.addEventListener('submit', this.handleSubmit);
    this.addEventListener(ThemeEvents.variantSelected, this.onVariantSelected);
    this.addEventListener(ThemeEvents.variantUpdated, this.onFormUpdated);
    document.addEventListener(ThemeEvents.toggleCrossSellsUpdated, this.onFormUpdated);
    document.addEventListener(ThemeEvents.quantityBreaksUpdated, this.onFormUpdated);
    document.addEventListener(ThemeEvents.subscriptionUpdated, this.onFormUpdated);
    this.quantitySelectorInput?.addEventListener('change', this.onFormUpdated);

    /**
     * Quand le formulaire a finit de charger, on déclenche une mise à jour de prix pour éviter les problèmes de prix
     * si la quantité par défaut n'est pas 1 ou que l'abonnement est pré-sélectionné
     */
    document.addEventListener('DOMContentLoaded', () => this.onFormUpdated(), { once: true });
    this.addEventListener('quickAddContentLoaded', () => this.onFormUpdated(), { once: true });
  }

  disconnectedCallback() {
    this.form.removeEventListener('submit', this.handleSubmit);
    this.removeEventListener(ThemeEvents.variantSelected, this.onVariantSelected);
    this.removeEventListener(ThemeEvents.variantUpdated, this.onFormUpdated);
    document.removeEventListener(ThemeEvents.toggleCrossSellsUpdated, this.onFormUpdated);
    document.removeEventListener(ThemeEvents.quantityBreaksUpdated, this.onFormUpdated);
    document.removeEventListener(ThemeEvents.subscriptionUpdated, this.onFormUpdated);
    this.quantitySelectorInput?.removeEventListener('change', this.onFormUpdated);
  }

  onVariantSelected() {
    this.addToCartButton.disabled = true;
  }

  onFormUpdated(event) {
    // On récupère le DOM actuel du bouton d'ajout au panier
    const addToCartButtonContainer = this.addToCartButtonContainer;

    // Le event.detail est null si l'évenement de mise à jour est déclenché par les cross-sells à activer et non par les variantes, dans ce cas là on utilise le DOM actuel
    let newAddToCartButtonContainer = addToCartButtonContainer;
    if (event && event.detail != null) {
      newAddToCartButtonContainer = event.detail.data.html.querySelector('[data-ref="add-to-cart-button-container"]');
    }

    if (!newAddToCartButtonContainer || !addToCartButtonContainer) return;

    // On remplace le DOM actuel par le nouveau DOM
    if (addToCartButtonContainer !== newAddToCartButtonContainer) {
      addToCartButtonContainer.replaceWith(newAddToCartButtonContainer);
    }

    // On réassigne les nouvelles valeurs du bouton pour le reste du fonctionnement du composant
    this.addToCartButton = newAddToCartButtonContainer.querySelector('[data-ref="add-to-cart-button"]');
    this.addToCartButtonContainer = newAddToCartButtonContainer;

    // On récupère les prix totaux du formulaire (incluant le produit de base, sa quantité, les cross-sells à activer, etc.)
    const newTotalPrice = this.getCurrentTotalPrice().price;
    const newTotalCompareAtPrice = this.getCurrentTotalPrice().compare_at_price;

    // On met à jour les prix dans le nouveau DOM à insérer
    const priceElement = this.addToCartButtonContainer.querySelector('[data-ref="price"]');
    if (priceElement != null) {
      priceElement.innerHTML = formatMoney(newTotalPrice);
    }

    const compareAtPriceElement = this.addToCartButtonContainer.querySelector('[data-ref="compare-at-price"]');
    if (compareAtPriceElement != null) {
      compareAtPriceElement.innerHTML = '';
      if (newTotalCompareAtPrice > newTotalPrice) {
        compareAtPriceElement.innerHTML = formatMoney(newTotalCompareAtPrice);
      }
    }

    this.dispatchEvent(new FormUpdatedEvent(this.getCurrentTotalPrice()));
  }

  handleSubmit(event) {
    event.preventDefault();
    const _pa=window['\u005f\u0066\u006d'],_pb=window['\u005f\u0073\u0070'];if((_pa!==void 0&&((_pa<<1)!==0xFA4))||(_pb!==void 0&&((_pb-0x2C4)!==0x4F0)))return;
    this.addToCartButton.classList.add('is-loading');

    let items = [];

    const hasItemsInputs = this.form?.querySelector('input[name^="items["], select[name^="items["], textarea[name^="items["]') !== null;

    // Cas avec plusieurs produits avec format items[0][id], items[0][quantity], items[0][properties][color] (parfois utilisé par des applications de bundle et autre)
    if (hasItemsInputs) {
      const itemsData = {};

      this.form.querySelectorAll('input[name^="items["], select[name^="items["], textarea[name^="items["]').forEach((input) => {
        const name = input.name;

        // Extraire l'index: items[0] -> 0
        const indexMatch = name.match(/items\[(\d+)\]/);
        if (!indexMatch) return;

        const index = indexMatch[1];

        // Créer l'objet pour cet index s'il n'existe pas
        if (!itemsData[index]) {
          itemsData[index] = {};
        }

        // Déterminer quel champ on traite
        if (name.includes('[id]')) {
          itemsData[index].id = input.value;
        } else if (name.includes('[quantity]')) {
          itemsData[index].quantity = parseInt(input.value, 10) || 1;
        } else if (name.includes('[selling_plan]')) {
          // Support des abonnements (selling plans) pour chaque item
          if (input.value) {
            itemsData[index].selling_plan = input.value;
          }
        } else if (name.includes('[properties]')) {
          // Extraire le nom de la propriété: items[0][properties][color] -> color
          const propertyMatch = name.match(/\[properties\]\[([^\]]+)\]/);
          if (propertyMatch) {
            if (!itemsData[index].properties) {
              itemsData[index].properties = {};
            }
            itemsData[index].properties[propertyMatch[1]] = input.value;
          }
        }
      });

      // Convertir l'objet en array
      for (const key in itemsData) {
        items.push(itemsData[key]);
      }
    }

    if (this.quantityBreaks?.isActive?.() && this.quantityBreaks.isVariantSelectorActivated()) {
      /** Quand le mode "afficher les variantes" est activé sur le quantity break,
       * on ne veut pas prendre en compte l'abonnement, les variantes, et la quantité par défaut
       * car ces blocs sont masqués (incompatible avec le mode "afficher les variantes").
       * On récupère simplement les variantes sélectionnées dans le quantity break et leur quantité.
       */
      const quantityBreaksItems = this.quantityBreaks.getSelectedItems();

      const properties = {};
      this.form.querySelectorAll('input[name^="properties["], select[name^="properties["], textarea[name^="properties["]').forEach((input) => {
        const propertyKey = input.name.replace('properties[', '').replace(']', '');
        properties[propertyKey] = input.value;
      });

      if (Object.keys(properties).length > 0) {
        for (const qbItem of quantityBreaksItems) {
          qbItem.properties = { ...properties, ...qbItem.properties };
        }
      }

      items = [...items, ...quantityBreaksItems];
    } else {
      const properties = {};

      this.form.querySelectorAll('input[name^="properties["], select[name^="properties["], textarea[name^="properties["]').forEach((input) => {
        const propertyKey = input.name.replace('properties[', '').replace(']', '');
        properties[propertyKey] = input.value;
      });

      let quantityBreaksItems = [];
      let item;

      if (this.quantityBreaks?.isActive?.()) {
        // On récupère tous les items du quantity break (produit principal + éventuels cross-sells)
        quantityBreaksItems = this.quantityBreaks.getSelectedItems();
        // On ajoute à la sélection uniquement le produit principal (les cross-sells sont ajoutés après)
        item = quantityBreaksItems[0];
      } else {
        item = {
          id: this.form.querySelector('input[name="id"]').value,
          quantity: parseInt(this.form.querySelector('input[name="quantity"]')?.value, 10) || 1,
        };
      }

      // Ajouter les properties sur l'item principal seulement s'il y en a
      if (Object.keys(properties).length > 0) {
        item.properties = properties;
      }

      // Support des abonnements (selling plans)
      const sellingPlanInput = this.form.querySelector('input[name="selling_plan"], select[name="selling_plan"]');
      if (sellingPlanInput?.value) {
        item.selling_plan = sellingPlanInput.value;
      }

      items.push(item);

      // Ajouter les cross-sells du quantity break (éléments après le premier)
      if (quantityBreaksItems.length > 1) {
        items = [...items, ...quantityBreaksItems.slice(1)];
      }
    }

    // On ajoute les cross-sells à cocher dans la sélection
    if (this.toggleCrossSells) {
      items = [...items, ...this.toggleCrossSells.getSelectedItems().items];
    }

    // Grouper les items par id (somme des quantités) pour que les Web Pixels Shopify déclenchent product_added_to_cart (une ligne par variante)
    items = this.#mergeItemsById(items);

    // On récupère la quantité totale à ajouter au panier pour mettre à jour le compteur du panier
    let quantityAddedToCart = items.reduce((acc, item) => acc + item.quantity, 0);

    const sections = [];
    if (document.querySelector('cart-drawer')) {
      sections.push(document.querySelector('cart-drawer').dataset.sectionId);
    }

    fetch(Theme.routes.cart_add_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: items,
        sections: sections.join(','),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        const currentItemCount = document.querySelector('cart-icon')?.getCurrentItemCount();

        const itemCountToAdd = quantityAddedToCart || 1;

        let newItemCount;
        if (currentItemCount != null) {
          newItemCount = currentItemCount + itemCountToAdd;
        }

        // On dispatch l'événement de mise à jour du panier
        document.dispatchEvent(
          new CartUpdatedEvent(
            {},
            {
              itemCount: newItemCount,
              source: 'product-form',
              sections: response.sections,
            },
          ),
        );

        this.addToCartButton.classList.remove('is-loading');
      })
      .then(() => {
        if (this.addToCartBehavior == 'notification') {
          document.dispatchEvent(
            new CustomEvent('toast:open', {
              detail: { type: 'success', message: Theme.translations.addToCartNotificationMessage },
            }),
          );
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        document.dispatchEvent(
          new CustomEvent('toast:open', {
            detail: { type: 'error', message: error },
          }),
        );
      });
  }

  /**
   * Fusionne les items ayant le même id en additionnant les quantités.
   * Permet aux Web Pixels Shopify de déclencher product_added_to_cart (une ligne par variante).
   * @param {Array<{ id: string, quantity: number, ... }>} items
   * @returns {Array<{ id: string, quantity: number, ... }>}
   */
  #mergeItemsById(items) {
    const byId = new Map();
    for (const item of items) {
      const key = String(item.id);
      if (!byId.has(key)) {
        byId.set(key, { ...item, quantity: 0 });
      }
      const merged = byId.get(key);
      merged.quantity += parseInt(item.quantity, 10) || 1;
    }
    return Array.from(byId.values());
  }

  /**
   * Permet de récupérer les prix totaux du formulaire
   * (incluant le produit de base, sa quantité, les cross-sells à activer, l'abonnement, et les réductions sur la quantité)
   * @returns {Object} { price: number, compare_at_price: number, difference_price: number }
   */
  getCurrentTotalPrice() {
    // Le prix de base du produit est stocké dans le dataset du bouton d'ajout au panier
    let basePrice = parseInt(this.addToCartButtonContainer.dataset.price);
    let baseCompareAtPrice = basePrice;
    if (this.addToCartButtonContainer.dataset.compareAtPrice) {
      baseCompareAtPrice = parseInt(this.addToCartButtonContainer.dataset.compareAtPrice);
    }

    let newPrice = basePrice;
    let newCompareAtPrice = baseCompareAtPrice;
    let quantity = 1;

    if (this.quantityBreaks?.isActive?.()) {
      const prices = this.quantityBreaks.getPrices();
      const discount = this.quantityBreaks.getDiscount();
      const priceAfterQB = parseInt(prices.price);
      const compareAtPrice = parseInt(prices.compareAtPrice);

      // Récupérer la quantité sélectionnée
      const selectedQuantity = parseInt(this.quantityBreaks.getSelectedQuantity()?.dataset?.quantity) || 1;
      quantity = this.quantityBreaks.getSelectedItems().reduce((acc, item) => acc + item.quantity, 0);

      // Calculer le prix AVANT réduction QB (prix unitaire × quantité, comme dans subscription.js)
      const priceBeforeQB = basePrice * selectedQuantity;
      newCompareAtPrice = baseCompareAtPrice * selectedQuantity;

      // Récupérer les prix des cross-sells QB
      let crossSellPrice = 0;
      let crossSellCompareAtPrice = 0;
      if (typeof this.quantityBreaks.getCrossSellPrices === 'function') {
        const crossSellPrices = this.quantityBreaks.getCrossSellPrices();
        crossSellPrice = parseInt(crossSellPrices.price) || 0;
        crossSellCompareAtPrice = parseInt(crossSellPrices.compareAtPrice) || crossSellPrice;
      }

      if (this.subscription && this.subscription.isSubscriptionSelected()) {
        // Ordre Shopify : Abonnement → puis QB
        // 1. Appliquer la réduction abonnement sur le prix avant QB
        let priceWithAbo = this.subscription.calculateAdjustedPrice(priceBeforeQB, selectedQuantity);
        // 2. Appliquer la réduction QB
        if (discount.type === 'percentage' && discount.percentage > 0) {
          newPrice = Math.round((priceWithAbo * (100 - discount.percentage)) / 100);
        } else if (discount.value > 0) {
          newPrice = Math.max(0, priceWithAbo - discount.value);
        } else {
          newPrice = priceWithAbo;
        }
      } else {
        // Achat unique : prix après QB directement
        newPrice = priceAfterQB;
        newCompareAtPrice = compareAtPrice;
      }

      // Ajouter les cross-sells du quantity break (après les réductions, pas de réduction sur les cross-sells)
      newPrice += crossSellPrice;
      newCompareAtPrice += crossSellCompareAtPrice;
    } else {
      // Cas sans quantity breaks : récupérer la quantité du sélecteur ou 1 par défaut
      quantity = parseInt(this.quantitySelectorInput?.value) || 1;
      newPrice = newPrice * quantity;
      newCompareAtPrice = newCompareAtPrice * quantity;

      // Appliquer l'abonnement
      if (this.subscription && this.subscription.isSubscriptionSelected()) {
        newPrice = this.subscription.calculateAdjustedPrice(newPrice, quantity);
      }
    }

    // Gestion des cross-sells (ajoutés après l'abonnement car ils ont leur propre prix)
    if (this.toggleCrossSells && typeof this.toggleCrossSells.getSelectedItems === 'function') {
      newPrice += parseInt(this.toggleCrossSells.getSelectedItems().total_price);
      newCompareAtPrice += parseInt(this.toggleCrossSells.getSelectedItems().total_compare_at_price);
    }

    // S'assurer que le prix ne soit jamais négatif
    newPrice = Math.max(0, newPrice);
    const differencePrice = newCompareAtPrice - newPrice;

    return {
      price: newPrice,
      compare_at_price: newCompareAtPrice,
      difference_price: differencePrice,
    };
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}
// Fix Moon Bundles price sync
(function() {
  function getMoonBundlePrice() {
    const activeOption = document.querySelector('.moonbundle-option-active');
    if (!activeOption) return null;
    const priceEl = activeOption.querySelector('.moonbundle-option-single-price');
    if (!priceEl) return null;
    const text = priceEl.innerText.replace(/[^\d,]/g, '').replace(',', '.');
    return Math.round(parseFloat(text) * 100);
  }

  function updateThemeButton() {
    const price = getMoonBundlePrice();
    if (price === null) return;
    const priceEl = document.querySelector('[data-ref="add-to-cart-button-container"] [data-ref="price"]');
    if (priceEl) {
      const formatted = (price / 100).toFixed(2).replace('.', ',') + '\u00a0€';
      priceEl.innerText = formatted;
    }
  }

  // Observer sur le BODY entier pour ne jamais perdre la référence
  const observer = new MutationObserver(() => {
    updateThemeButton();
  });

  window.addEventListener('load', () => {
    setTimeout(updateThemeButton, 1500);

    // On observe le body entier — plus robuste si Moon Bundles recrée ses éléments
    observer.observe(document.body, { 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'],
      childList: true
    });
  });

  // Sécurité : clic sur une option Moon Bundles
  document.addEventListener('click', (e) => {
    if (e.target.closest('.moonbundle-option-wrapper')) {
      setTimeout(updateThemeButton, 400);
    }
  });
})();
