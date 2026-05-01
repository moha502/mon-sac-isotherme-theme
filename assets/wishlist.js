import { ThemeEvents, WishlistUpdatedEvent, WishlistItemAddedEvent, WishlistItemRemovedEvent } from '@theme/events';

// Classe utilitaire pour gérer la wishlist dans les cookies
class WishlistManager {
  static COOKIE_NAME = 'wishlist';
  static COOKIE_EXPIRY_DAYS = 365;

  static getItems() {
    const cookie = this.getCookie(this.COOKIE_NAME);
    if (!cookie) return [];

    try {
      return JSON.parse(decodeURIComponent(cookie));
    } catch (e) {
      console.error('Error parsing wishlist cookie:', e);
      return [];
    }
  }

  static setItems(items) {
    const expires = new Date();
    expires.setDate(expires.getDate() + this.COOKIE_EXPIRY_DAYS);

    const cookieValue = encodeURIComponent(JSON.stringify(items));
    document.cookie = `${this.COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  static addItem(productId, title, handle, url, imageUrl) {
    const items = this.getItems();

    // Vérifier si l'item existe déjà
    if (items.some((item) => item.productId === productId)) {
      return false;
    }

    items.push({ productId, title, handle, url, imageUrl });
    this.setItems(items);

    document.dispatchEvent(
      new CustomEvent('toast:open', {
        detail: { type: 'success', message: Theme.translations.addToWishlistNotificationMessage },
      }),
    );

    return true;
  }

  static removeItem(productId) {
    const items = this.getItems();
    const filteredItems = items.filter((item) => item.productId !== productId);

    if (items.length !== filteredItems.length) {
      this.setItems(filteredItems);

      document.dispatchEvent(
        new CustomEvent('toast:open', {
          detail: { type: 'success', message: Theme.translations.removeFromWishlistNotificationMessage },
        }),
      );

      return true;
    }

    return false;
  }

  static hasItem(productId) {
    const items = this.getItems();
    return items.some((item) => item.productId === productId);
  }

  static getCount() {
    return this.getItems().length;
  }

  static getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
}

class WishlistHeaderIcon extends HTMLElement {
  constructor() {
    super();

    this.wishlistDrawer = null;
    this.countElement = null;
    this.countBubble = null;
  }

  connectedCallback() {
    this.wishlistDrawer = document.querySelector('[data-ref="wishlist-drawer"]');
    this.countElement = this.querySelector('[data-ref="wishlist-count"]');
    this.countBubble = this.querySelector('[data-ref="wishlist-count-bubble"]');

    this.addEventListener('click', this.#handleClick);

    // Écouter les événements de mise à jour de la wishlist
    document.addEventListener(ThemeEvents.wishlistUpdated, this.#handleWishlistUpdated);

    // Initialiser le compteur au chargement
    this.updateCount();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#handleClick);
    document.removeEventListener(ThemeEvents.wishlistUpdated, this.#handleWishlistUpdated);
  }

  #handleClick = () => {
    this.wishlistDrawer?.open();
  };

  #handleWishlistUpdated = (event) => {
    this.updateCount(event.detail.count);
  };

  updateCount(count = null) {
    if (count === null) {
      count = WishlistManager.getCount();
    }

    if (this.countElement) {
      this.countElement.textContent = count > 0 ? count : '';
    }

    // Gérer l'affichage de la bubble avec la classe hidden
    if (this.countBubble) {
      if (count > 0) {
        this.countBubble.classList.remove('hidden');
      } else {
        this.countBubble.classList.add('hidden');
      }
    }
  }
}

if (!customElements.get('wishlist-header-icon')) {
  customElements.define('wishlist-header-icon', WishlistHeaderIcon);
}

class WishlistDrawer extends HTMLElement {
  constructor() {
    super();

    this.overlay = null;
    this.drawer = null;
    this.closeButton = null;
    this.itemsContainer = null;
    this.emptyMessage = null;
    this.itemTemplate = null;
  }

  connectedCallback() {
    this.overlay = document.querySelector('[data-ref="wishlist-drawer-overlay"]');
    this.drawer = document.querySelector('[data-ref="wishlist-drawer-content"]');
    this.closeButton = this.drawer?.querySelector('[data-ref="wishlist-drawer-close"]');
    this.itemsContainer = this.drawer?.querySelector('[data-ref="wishlist-drawer-items"]');
    this.emptyMessage = this.drawer?.querySelector('[data-ref="wishlist-drawer-empty"]');
    this.itemTemplate = document.getElementById('wishlist-item-template');

    if (this.overlay) this.overlay.addEventListener('click', this.#handleOverlayClick);
    if (this.closeButton) this.closeButton.addEventListener('click', this.#handleClose);

    // Écouter les événements de wishlist
    document.addEventListener(ThemeEvents.wishlistItemAdded, this.#handleItemAdded);
    document.addEventListener(ThemeEvents.wishlistItemRemoved, this.#handleItemRemoved);

    // Initialiser le contenu au chargement
    this.loadItems();
  }

  disconnectedCallback() {
    if (this.overlay) this.overlay.removeEventListener('click', this.#handleOverlayClick);
    if (this.closeButton) this.closeButton.removeEventListener('click', this.#handleClose);
    document.removeEventListener(ThemeEvents.wishlistItemAdded, this.#handleItemAdded);
    document.removeEventListener(ThemeEvents.wishlistItemRemoved, this.#handleItemRemoved);
  }

  #handleClose = () => {
    this.close();
  };

  #handleOverlayClick = (event) => {
    // Fermer le menu si on clique sur l'overlay (pas sur le menu lui-même)
    if (event.target === this.overlay) {
      this.close();
    }
  };

  #handleItemAdded = (event) => {
    this.addItemToUI(event.detail.item);
    this.updateEmptyState();
  };

  #handleItemRemoved = (event) => {
    this.removeItemFromUI(event.detail.productId);
    this.updateEmptyState();
  };

  open() {
    // Nettoyer les classes pour éviter les conflits
    this.overlay?.classList.remove('is-closing');
    this.overlay?.classList.add('is-open');
    document.body.classList.add('overflow-hidden');

    // Focus sur le bouton de fermeture pour l'accessibilité
    setTimeout(() => {
      this.closeButton?.focus();
    }, 150);
  }

  close() {
    // Ajouter la classe de fermeture pour déclencher l'animation
    this.overlay?.classList.add('is-closing');

    // Attendre la fin de l'animation avant de masquer l'overlay
    setTimeout(() => {
      this.overlay?.classList.remove('is-open', 'is-closing');
      document.body.classList.remove('overflow-hidden');
    }, 125); // Durée légèrement inférieure à --animation-speed pour éviter les décalages
  }

  loadItems() {
    const items = WishlistManager.getItems();

    // Vider le conteneur
    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = '';
    }

    // Ajouter chaque item
    items.forEach((item) => {
      this.addItemToUI(item);
    });

    // Gérer l'affichage du message vide
    this.updateEmptyState();
  }

  addItemToUI(item) {
    if (!this.itemsContainer || !this.itemTemplate) return;

    const clone = this.itemTemplate.content.cloneNode(true);
    const itemElement = clone.querySelector('[data-wishlist-item]');
    const imageElement = clone.querySelector('[data-wishlist-item-image]');
    const titleElement = clone.querySelector('[data-wishlist-item-title]');
    const removeButton = clone.querySelector('[data-wishlist-item-remove]');

    if (itemElement) {
      itemElement.dataset.productId = item.productId;
      if (item.url) {
        itemElement.setAttribute('href', item.url);
      }
    }

    if (imageElement && item.imageUrl) {
      imageElement.src = item.imageUrl;
      imageElement.alt = item.title || 'Product image';
    }

    if (titleElement) titleElement.textContent = item.title;

    if (removeButton) {
      removeButton.addEventListener('click', (e) => {
        e.preventDefault(); // Empêcher la navigation du lien
        e.stopPropagation(); // Empêcher la propagation au parent
        this.removeItem(item.productId);
      });
    }

    this.itemsContainer.appendChild(clone);
  }

  removeItemFromUI(productId) {
    const itemElement = this.itemsContainer?.querySelector(`[data-product-id="${productId}"]`);
    if (itemElement) {
      itemElement.remove();
    }
  }

  removeItem(productId) {
    if (WishlistManager.removeItem(productId)) {
      this.removeItemFromUI(productId);

      // Déclencher les événements
      document.dispatchEvent(new WishlistItemRemovedEvent(productId));

      const items = WishlistManager.getItems();
      document.dispatchEvent(new WishlistUpdatedEvent(items, items.length));

      // Mettre à jour l'affichage du message vide
      this.updateEmptyState();
    }
  }

  updateEmptyState() {
    if (!this.itemsContainer || !this.emptyMessage) return;

    const hasItems = this.itemsContainer.children.length > 0;

    if (hasItems) {
      this.itemsContainer.style.display = '';
      this.emptyMessage.style.display = 'none';
    } else {
      this.itemsContainer.style.display = 'none';
      this.emptyMessage.style.display = 'flex';
    }
  }
}

if (!customElements.get('wishlist-drawer')) {
  customElements.define('wishlist-drawer', WishlistDrawer);
}

class AddToWishlistButton extends HTMLElement {
  constructor() {
    super();

    this.icon = null;
    this.productId = null;
    this.productTitle = null;
    this.productHandle = null;
    this.productUrl = null;
    this.productImage = null;
  }

  connectedCallback() {
    this.icon = this.querySelector('[data-ref="add-to-wishlist-button-icon"]');

    // Récupérer les données du produit depuis les attributs data
    this.productId = this.dataset.productId;
    this.productTitle = this.dataset.productTitle;
    this.productHandle = this.dataset.productHandle;
    this.productUrl = this.dataset.productUrl;
    this.productImage = this.dataset.productImage;

    this.addEventListener('click', this.#handleClick);

    // Écouter les événements de suppression pour mettre à jour l'état
    document.addEventListener(ThemeEvents.wishlistItemRemoved, this.#handleItemRemoved);

    // Initialiser l'état au chargement
    this.updateState();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#handleClick);
    document.removeEventListener(ThemeEvents.wishlistItemRemoved, this.#handleItemRemoved);
  }

  #handleClick = () => {
    if (!this.productId) {
      console.error('Product ID is required for wishlist button');
      return;
    }

    const isInWishlist = WishlistManager.hasItem(this.productId);

    if (isInWishlist) {
      // Retirer de la wishlist
      if (WishlistManager.removeItem(this.productId)) {
        this.icon?.classList.remove('add-to-wishlist-button__icon--filled');

        // Déclencher les événements
        document.dispatchEvent(new WishlistItemRemovedEvent(this.productId));

        const items = WishlistManager.getItems();
        document.dispatchEvent(new WishlistUpdatedEvent(items, items.length));
      }
    } else {
      // Ajouter à la wishlist
      if (
        WishlistManager.addItem(
          this.productId,
          this.productTitle || '',
          this.productHandle || '',
          this.productUrl || '',
          this.productImage || '',
        )
      ) {
        this.icon?.classList.add('add-to-wishlist-button__icon--filled');

        // Déclencher les événements
        const item = {
          productId: this.productId,
          title: this.productTitle || '',
          handle: this.productHandle || '',
          url: this.productUrl || '',
          imageUrl: this.productImage || '',
        };
        document.dispatchEvent(new WishlistItemAddedEvent(item));

        const items = WishlistManager.getItems();
        document.dispatchEvent(new WishlistUpdatedEvent(items, items.length));
      }
    }
  };

  #handleItemRemoved = (event) => {
    if (event.detail.productId === this.productId) {
      this.icon?.classList.remove('add-to-wishlist-button__icon--filled');
    }
  };

  updateState() {
    if (!this.productId) return;

    const isInWishlist = WishlistManager.hasItem(this.productId);

    if (isInWishlist) {
      this.icon?.classList.add('add-to-wishlist-button__icon--filled');
    } else {
      this.icon?.classList.remove('add-to-wishlist-button__icon--filled');
    }
  }
}

if (!customElements.get('add-to-wishlist-button')) {
  customElements.define('add-to-wishlist-button', AddToWishlistButton);
}

// Initialiser le compteur de la wishlist au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  const count = WishlistManager.getCount();
  const items = WishlistManager.getItems();
  document.dispatchEvent(new WishlistUpdatedEvent(items, count));
});
