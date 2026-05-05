import { ThemeEvents, CartUpdatedEvent } from '@theme/events';

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.checkoutButton = null;
    this.openCartIcons = null;

    this.backdropClickHandler = this.#onBackdropClick.bind(this);
    this.checkoutButtonClickHandler = this.#handleCheckoutButtonClick.bind(this);
    this.cartUpdateHandler = this.#handleCartUpdate.bind(this);
    this.openHandler = this.open.bind(this);
    this.closeHandler = this.close.bind(this);
  }

  connectedCallback() {
    this.checkoutButton = this.querySelector('[data-ref="checkout-button"]');

    this.addEventListener('click', this.backdropClickHandler);

    this.checkoutButton.addEventListener('click', this.checkoutButtonClickHandler);

    document.addEventListener(ThemeEvents.cartUpdated, this.cartUpdateHandler);

    document.addEventListener(ThemeEvents.cartOpen, this.openHandler);
    document.addEventListener(ThemeEvents.cartClose, this.closeHandler);

    // Specific logic for Shopify Theme Editor
    if (Shopify.designMode) {
      document.addEventListener('shopify:section:unload', this.#onSectionUnload);
      if (window.theme?.isCartDrawerOpen) {
        this.open();
        window.theme.isCartDrawerOpen = false; // Reset the flag
      }
    }
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.cartClose, this.closeHandler);
    document.removeEventListener(ThemeEvents.cartOpen, this.openHandler);

    document.removeEventListener(ThemeEvents.cartUpdated, this.cartUpdateHandler);

    this.checkoutButton.removeEventListener('click', this.checkoutButtonClickHandler);

    this.removeEventListener('click', this.backdropClickHandler);

    // Specific logic for Shopify Theme Editor
    if (Shopify.designMode) {
      document.removeEventListener('shopify:section:unload', this.#onSectionUnload);
    }
  }

  #onSectionUnload = (event) => {
    if (event.detail.sectionId !== this.dataset.sectionId) return;

    window.theme = window.theme || {};
    window.theme.isCartDrawerOpen = this.isOpen();
  };

  #handleCheckoutButtonClick(event) {
    event.target.classList.add('is-loading');
  }

  #handleCartUpdate(event) {
    this.renderCartContents(event.detail.data);
  }

  #onBackdropClick(event) {
    const rect = this.querySelector('.cart-drawer__inner').getBoundingClientRect();
    const isInDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      this.close();
    }
  }

  open() {
    // Nettoyer les classes pour éviter les conflits
    this.classList.remove('is-closing');
    this.classList.add('is-open');
    document.body.classList.add('overflow-hidden');
  }

  close() {
    // Ajouter la classe de fermeture pour déclencher l'animation
    this.classList.add('is-closing');

    // Attendre la fin de l'animation avant de masquer complètement
    setTimeout(() => {
      this.classList.remove('is-open', 'is-closing');
      document.body.classList.remove('overflow-hidden');
    }, 125); // Durée légèrement inférieure à --animation-speed pour éviter les décalages
  }

  isOpen() {
    return this.classList.contains('is-open');
  }

  renderCartContents(parsedState) {
    const section_cart_drawer_id = this.dataset.sectionId;

    const currentCartDrawer = this.querySelector('.cart-drawer__inner');
    const newCartDrawer = new DOMParser().parseFromString(parsedState.sections[section_cart_drawer_id], 'text/html');

    currentCartDrawer.innerHTML = newCartDrawer.querySelector('.cart-drawer__inner').innerHTML;

    setTimeout(() => {
      if (parsedState.itemCount == 0) {
        this.classList.add('cart-drawer--empty');
      } else {
        this.classList.remove('cart-drawer--empty');
      }
    });
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}

class CartDrawerItem extends HTMLElement {
  constructor() {
    super();

    this.removeItemButton = null;
    this.quantitySelectorInput = null;
    this.itemRemoveHandler = this.#handleItemRemove.bind(this);
    this.quantityInputChangeHandler = this.#handleQuantityInputChange.bind(this);
  }

  connectedCallback() {
    this.removeItemButton = this.querySelector('[data-ref="remove-item"]');
    this.quantitySelectorInput = this.querySelector('[data-ref="quantity-selector-input"]');

    this.removeItemButton?.addEventListener('click', this.itemRemoveHandler);
    this.quantitySelectorInput?.addEventListener('change', this.quantityInputChangeHandler);
  }

  disconnectedCallback() {
    this.quantitySelectorInput?.removeEventListener('change', this.quantityInputChangeHandler);
    this.removeItemButton?.removeEventListener('click', this.itemRemoveHandler);
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
      sections: this.closest('cart-drawer').dataset.sectionId,
      sections_url: window.location.pathname,
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
          document.dispatchEvent(new CustomEvent('toast:open', { detail: { type: 'error', message: message } }));
          return;
        }

        document.dispatchEvent(
          new CartUpdatedEvent(
            {},
            {
              itemCount: parsedResponseText.item_count,
              source: 'cart-drawer-item',
              sections: parsedResponseText.sections,
            },
          ),
        );
      })
      .catch((e) => {
        console.error(e);
        this.#disableLoading();
      })
      .finally(() => {
        this.#disableLoading();
      });
  }

  #enableLoading() {
    this.classList.add('cart-drawer__item--loading');
  }

  #disableLoading() {
    this.classList.remove('cart-drawer__item--loading');
  }
}

if (!customElements.get('cart-drawer-item')) {
  customElements.define('cart-drawer-item', CartDrawerItem);
}
// ===== TIMER PANIER FIX =====

let cartTimerInterval = null;

function startCartTimer() {
  let display = document.getElementById("cart-timer");
  if (!display) return;

  // STOP anciens timers
  if (cartTimerInterval) {
    clearInterval(cartTimerInterval);
  }

  let duration = 10 * 60;
  let timer = duration;

  cartTimerInterval = setInterval(function () {
    let minutes = Math.floor(timer / 60);
    let seconds = timer % 60;

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      clearInterval(cartTimerInterval);
      fetch('/cart/clear.js', { method: 'POST' })
        .then(() => location.reload());
    }
  }, 1000);
}

// détecte ouverture du panier UNE SEULE FOIS
let cartTimerStarted = false;

document.addEventListener("click", function () {
  if (cartTimerStarted) return;

  setTimeout(() => {
    let display = document.getElementById("cart-timer");
    if (display) {
      startCartTimer();
      cartTimerStarted = true;
    }
  }, 300);
});
// === AJOUT AUTO EBOOK (COMPATIBLE CART DRAWER AJAX) ===
let ebookAdding = false;

async function addFreeEbook() {
  if (ebookAdding) return;

  try {
    const ebookHandle = "ebook-comment-preparer-ses-repas-a-lavance";

    const cartRes = await fetch("/cart.js");
    const cart = await cartRes.json();

    // ❌ panier vide
    if (cart.item_count === 0) return;

    // ❌ déjà présent
    const hasEbook = cart.items.some(item =>
      item.product_handle === ebookHandle
    );
    if (hasEbook) return;

    // ❌ uniquement ebook
    const nonEbook = cart.items.filter(item =>
      item.product_handle !== ebookHandle
    );
    if (nonEbook.length === 0) return;

    ebookAdding = true;

    const productRes = await fetch(`/products/${ebookHandle}.js`);
    const product = await productRes.json();

    const variantId = product.variants[0].id;

    await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: variantId,
        quantity: 1
      })
    });

    // 🔥 recharge le drawer
    document.dispatchEvent(new Event("cart:refresh"));

  } catch (e) {
    console.log("Erreur ebook:", e);
  } finally {
    ebookAdding = false;
  }
}

// 🔥 écoute ouverture panier
document.addEventListener("click", function () {
  setTimeout(addFreeEbook, 500);
});

// 🔥 sécurité supplémentaire
setInterval(addFreeEbook, 2000);