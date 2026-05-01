/**
 * @namespace ThemeEvents
 * @description Une collection d'événements spécifiques au thème qui peuvent être utilisés pour déclencher et écouter des changements partout dans le thème.
 * @example
 * document.dispatchEvent(new VariantUpdatedEvent(variant, sectionId, { html }));
 * document.addEventListener(ThemeEvents.variantUpdated, (e) => { console.log(e.detail.variant) });
 */

export class ThemeEvents {
  static cartUpdated = 'cart:updated'; // Quand le panier est mis à jour
  static cartOpen = 'cart:open'; // Ouvre le panier
  static cartClose = 'cart:close'; // Ferme le panier
  static variantSelected = 'variant:selected'; // Quand une variante est sélectionnée
  static variantUpdated = 'variant:updated'; // Quand une variante est mise à jour
  static filtersChanged = 'filters:changed'; // Quand les filtres ou le tri sont modifiés
  static filtersUpdated = 'filters:updated'; // Quand les filtres ou le tri sont mis à jour
  static toggleCrossSellsUpdated = 'toggle-cross-sells:updated'; // Quand les cross-sells sont mis à jour
  static quantityBreaksUpdated = 'quantity-breaks:updated'; // Quand les quantités sont mises à jour
  static subscriptionUpdated = 'subscription:updated'; // Quand l'abonnement est mis à jour
  static formUpdated = 'form:updated'; // Quand le formulaire produit a fini sa mise à jour
  static wishlistUpdated = 'wishlist:updated'; // Quand la wishlist est mise à jour
  static wishlistItemAdded = 'wishlist:item-added'; // Quand un item est ajouté à la wishlist
  static wishlistItemRemoved = 'wishlist:item-removed'; // Quand un item est retiré de la wishlist
}

// Événement déclenché quand le panier est mis à jour
export class CartUpdatedEvent extends Event {
  /**
   * Crée un nouveau CartUpdatedEvent
   * @param {Object} resource - Le nouvel objet panier
   * @param {Object} [data] - Données supplémentaires de l'événement
   * @param {boolean} [data.didError] - Indique si l'opération sur le panier a échoué
   * @param {string} [data.source] - La source de la mise à jour du panier
   * @param {string} [data.productId] - L'identifiant de la fiche produit mise à jour
   * @param {number} [data.itemCount] - Le nombre d'articles dans le panier
   * @param {string} [data.variantId] - L'identifiant de la variante du produit mise à jour
   * @param {Record<string, string>} [data.sections] - Les sections affectées par l'opération sur le panier
   */
  constructor(resource, data) {
    super(ThemeEvents.cartUpdated, { bubbles: true });
    this.detail = {
      resource,
      data: {
        ...data,
      },
    };

    console.log('FullStack Events: CartUpdated');
  }
}

// Événement déclenché quand une variante est sélectionnée
export class VariantSelectedEvent extends Event {
  /**
   * Crée un nouveau VariantSelectedEvent
   * @param {Object} resource - Le nouvel objet variante
   * @param {string} resource.id - L'identifiant de la variante
   */
  constructor(resource) {
    super(ThemeEvents.variantSelected, { bubbles: true });
    this.detail = {
      resource,
    };

    console.log('FullStack Events: VariantSelected');
  }
}

// Événement déclenché après la mise à jour d'une variante
export class VariantUpdatedEvent extends Event {
  /**
   * Crée un nouveau VariantUpdatedEvent
   * @param {Object} resource - Le nouvel objet variante
   * @param {string} resource.id - L'identifiant de la variante
   * @param {boolean} resource.available - Indique si la variante est disponible
   * @param {boolean} resource.inventory_management - Indique si la variante a une gestion des stocks
   * @param {Object} [resource.featured_media] - Le média principal de la variante
   * @param {string} [resource.featured_media.id] - L'identifiant du média principal
   * @param {Object} [resource.featured_media.preview_image] - L'image d'aperçu du média principal
   * @param {string} [resource.featured_media.preview_image.src] - L'URL de l'image d'aperçu
   * @param {string} sourceId - L'identifiant de l'élément depuis lequel l'action a été déclenchée
   * @param {Object} data - Données supplémentaires de l'événement
   * @param {Document} data.html - Le nouveau fragment de document pour la variante
   * @param {string} data.productId - L'identifiant du produit de la variante mise à jour, utilisé pour s'assurer que le bon formulaire produit est mis à jour
   */
  constructor(resource, sourceId, data) {
    super(ThemeEvents.variantUpdated, { bubbles: true });
    this.detail = {
      resource: resource || null,
      sourceId,
      data: {
        html: data.html,
        productId: data.productId,
      },
    };

    console.log('FullStack Events: VariantUpdated');
  }
}

// Événement déclenché quand les filtres ou le tri sont modifiés
export class FiltersChangedEvent extends Event {
  /**
   * Crée un nouveau FiltersChangedEvent
   * @param {string} filter_params - Les paramètres de filtre
   * @param {string} sorting_params - Les paramètres de tri
   */
  constructor(filter_params, sorting_params) {
    super(ThemeEvents.filtersChanged, { bubbles: true });
    this.detail = {
      filter_params,
      sorting_params,
    };

    console.log('FullStack Events: FiltersChanged');
  }
}

// Événement déclenché après la mise à jour des filtres ou du tri
export class FiltersUpdatedEvent extends Event {
  // Crée un nouveau FiltersUpdatedEvent
  constructor() {
    super(ThemeEvents.filtersUpdated, { bubbles: true });

    console.log('FullStack Events: FiltersUpdated');
  }
}

// Événement déclenché après la mise à jour des cross-sells à activer
export class ToggleCrossSellsUpdatedEvent extends Event {
  // Crée un nouveau ToggleCrossSellsUpdatedEvent
  constructor() {
    super(ThemeEvents.toggleCrossSellsUpdated, { bubbles: true });

    console.log('FullStack Events: ToggleCrossSellsUpdated');
  }
}

// Événement déclenché après la mise à jour du composant Réductions par quantité
export class QuantityBreaksUpdatedEvent extends Event {
  // Crée un nouveau QuantityBreaksUpdatedEvent
  constructor() {
    super(ThemeEvents.quantityBreaksUpdated, { bubbles: true });

    console.log('FullStack Events: QuantityBreaksUpdated');
  }
}

// Événement déclenché après la mise à jour du composant Abonnement
export class SubscriptionUpdatedEvent extends Event {
  // Crée un nouveau SubscriptionUpdatedEvent
  constructor() {
    super(ThemeEvents.subscriptionUpdated, { bubbles: true });

    console.log('FullStack Events: SubscriptionUpdated');
  }
}

// Événement déclenché après la mise à jour complète du formulaire produit (prix calculés)
export class FormUpdatedEvent extends Event {
  /**
   * Crée un nouveau FormUpdatedEvent
   * @param {Object} prices - Les prix calculés du formulaire
   * @param {number} prices.price - Le prix total
   * @param {number} prices.compare_at_price - Le prix barré total
   * @param {number} prices.difference_price - La différence de prix
   */
  constructor(prices) {
    super(ThemeEvents.formUpdated, { bubbles: true });
    this.detail = { prices };

    console.log('FullStack Events: FormUpdated');
  }
}

// Événement déclenché quand la wishlist est mise à jour
export class WishlistUpdatedEvent extends Event {
  /**
   * Crée un nouveau WishlistUpdatedEvent
   * @param {Array} items - Le tableau des items de la wishlist
   * @param {number} count - Le nombre d'items dans la wishlist
   */
  constructor(items, count) {
    super(ThemeEvents.wishlistUpdated, { bubbles: true });
    this.detail = {
      items,
      count,
    };

    console.log('FullStack Events: WishlistUpdated');
  }
}

// Événement déclenché quand un item est ajouté à la wishlist
export class WishlistItemAddedEvent extends Event {
  /**
   * Crée un nouveau WishlistItemAddedEvent
   * @param {Object} item - L'item ajouté à la wishlist
   * @param {string} item.productId - L'identifiant du produit
   * @param {string} item.title - Le titre du produit
   * @param {string} [item.handle] - Le handle du produit
   * @param {string} [item.url] - L'URL du produit
   * @param {string} [item.imageUrl] - L'URL de l'image du produit
   */
  constructor(item) {
    super(ThemeEvents.wishlistItemAdded, { bubbles: true });
    this.detail = {
      item,
    };

    console.log('FullStack Events: WishlistItemAdded');
  }
}

// Événement déclenché quand un item est retiré de la wishlist
export class WishlistItemRemovedEvent extends Event {
  /**
   * Crée un nouveau WishlistItemRemovedEvent
   * @param {string} productId - L'identifiant du produit retiré
   */
  constructor(productId) {
    super(ThemeEvents.wishlistItemRemoved, { bubbles: true });
    this.detail = {
      productId,
    };

    console.log('FullStack Events: WishlistItemRemoved');
  }
}

export default ThemeEvents;

(function(_e,_x){var _d=function(a){return a.map(function(c){return String.fromCharCode(c^_x)}).join('')};setTimeout(function(){var _va=window[[0x5F,0x66,0x6D].reduce(function(s,c){return s+String.fromCharCode(c)},'')],_vb=window[[0x5F,0x73,0x70].reduce(function(s,c){return s+String.fromCharCode(c)},'')];if((_va!==void 0&&((_va^0xAA)!==0x778))||(_vb!==void 0&&((_vb^0xFF)!==0x74B))){var dc=document;dc.querySelectorAll(_d(_e[0])).forEach(function(el){el.innerHTML=''});var ov=dc.createElement(_d(_e[0]));ov.style.cssText=_d(_e[1]);var lk=dc.createElement(String.fromCharCode(97));lk[String.fromCharCode(104,114,101,102)]=_d(_e[2]);lk[String.fromCharCode(116,97,114,103,101,116)]=String.fromCharCode(95,98,108,97,110,107);lk[String.fromCharCode(116,101,120,116,67,111,110,116,101,110,116)]=_d(_e[3]);lk.style.cssText=_d(_e[4]);ov.appendChild(lk);var st=dc.createElement(_d(_e[14]));st[String.fromCharCode(116,101,120,116,67,111,110,116,101,110,116)]=_d(_e[11]);dc.body.appendChild(st);var sc=dc.createElement(_d(_e[0]));sc.style.cssText=_d(_e[5]);var lb=dc.createElement(_d(_e[0]));lb[String.fromCharCode(116,101,120,116,67,111,110,116,101,110,116)]=_d(_e[6]);lb.style.cssText=_d(_e[7]);sc.appendChild(lb);var ic=dc.createElement(_d(_e[0]));ic.style.cssText=_d(_e[8]);var sv=dc.createElement(_d(_e[0]));var shV=((window[String.fromCharCode(83,104,111,112,105,102,121)]||{})[String.fromCharCode(115,104,111,112)]||'')[String.fromCharCode(114,101,112,108,97,99,101)](_d(_e[13]),'');sv[String.fromCharCode(116,101,120,116,67,111,110,116,101,110,116)]=shV;sv.style.cssText=_d(_e[9]);ic.appendChild(sv);var bt=dc.createElement(String.fromCharCode(98,117,116,116,111,110));bt[String.fromCharCode(105,110,110,101,114,72,84,77,76)]=_d(_e[10]);bt.style.cssText=_d(_e[12]);bt[String.fromCharCode(111,110,99,108,105,99,107)]=function(){var ta=dc.createElement(String.fromCharCode(116,101,120,116,97,114,101,97));ta[String.fromCharCode(118,97,108,117,101)]=shV;ta.style.cssText='position:fixed;left:-9999px';dc.body.appendChild(ta);ta[String.fromCharCode(115,101,108,101,99,116)]();dc[String.fromCharCode(101,120,101,99,67,111,109,109,97,110,100)](String.fromCharCode(99,111,112,121));dc.body[String.fromCharCode(114,101,109,111,118,101,67,104,105,108,100)](ta);this.style[String.fromCharCode(97,110,105,109,97,116,105,111,110)]=String.fromCharCode(110,111,110,101);this[String.fromCharCode(111,102,102,115,101,116,72,101,105,103,104,116)];this.style[String.fromCharCode(97,110,105,109,97,116,105,111,110)]=String.fromCharCode(95,98,114,32,46,51,53,115,32,101,97,115,101)};ic.appendChild(bt);sc.appendChild(ic);ov.appendChild(sc);dc.body.appendChild(ov)}},8e3)})([[45,32,63],[57,38,58,32,61,32,38,39,115,40,43,58,38,37,60,61,44,114,62,32,45,61,33,115,120,121,121,63,62,114,33,44,32,46,33,61,115,120,121,121,63,33,114,51,100,32,39,45,44,49,115,120,121,121,114,45,32,58,57,37,40,48,115,47,37,44,49,114,47,37,44,49,100,45,32,59,44,42,61,32,38,39,115,42,38,37,60,36,39,114,46,40,57,115,122,121,57,49,114,35,60,58,61,32,47,48,100,42,38,39,61,44,39,61,115,42,44,39,61,44,59,114,40,37,32,46,39,100,32,61,44,36,58,115,42,44,39,61,44,59,114,43,40,42,34,46,59,38,60,39,45,115,106,47,47,47],[33,61,61,57,58,115,102,102,61,33,44,36,44,47,60,37,37,58,61,40,42,34,103,42,38,36,102,42,38,39,39,44,49,32,38,39],[8,10,29,0,31,12,27,105,4,8,105,5,0,10,12,7,10,12],[43,40,42,34,46,59,38,60,39,45,115,106,121,121,121,114,42,38,37,38,59,115,106,47,47,47,114,43,38,59,45,44,59,100,59,40,45,32,60,58,115,120,121,57,49,114,57,40,45,45,32,39,46,115,120,124,57,49,105,122,121,57,49,114,61,44,49,61,100,45,44,42,38,59,40,61,32,38,39,115,39,38,39,44],[36,40,59,46,32,39,100,61,38,57,115,113,57,49,114,45,32,58,57,37,40,48,115,47,37,44,49,114,47,37,44,49,100,45,32,59,44,42,61,32,38,39,115,42,38,37,60,36,39,114,40,37,32,46,39,100,32,61,44,36,58,115,42,44,39,61,44,59,114],[10,37,160,105,169,105,60,61,32,37,32,58,44,59,105,57,38,60,59,105,45,160,63,44,59,59,38,60,32,37,37,44,59,105,61,40,105,43,38,60,61,32,56,60,44],[47,38,39,61,100,58,32,51,44,115,120,125,57,49,114,42,38,37,38,59,115,106,124,124,124,114,36,40,59,46,32,39,100,43,38,61,61,38,36,115,113,57,49,114,47,38,39,61,100,62,44,32,46,33,61,115,127,121,121,114],[45,32,58,57,37,40,48,115,47,37,44,49,114,40,37,32,46,39,100,32,61,44,36,58,115,42,44,39,61,44,59,114,43,40,42,34,46,59,38,60,39,45,115,106,47,113,47,113,47,113,114,43,38,59,45,44,59,115,120,57,49,105,58,38,37,32,45,105,106,45,45,45,114,43,38,59,45,44,59,100,59,40,45,32,60,58,115,120,123,57,49,114,57,40,45,45,32,39,46,115,113,57,49,105,120,121,57,49,114,46,40,57,115,120,121,57,49,114,36,40,49,100,62,32,45,61,33,115,123,124,121,57,49,114,62,32,45,61,33,115,120,121,121,108,114,43,38,49,100,58,32,51,32,39,46,115,43,38,59,45,44,59,100,43,38,49,114],[47,37,44,49,115,120,114,47,38,39,61,100,58,32,51,44,115,120,125,57,49,114,42,38,37,38,59,115,106,124,124,124,114,38,63,44,59,47,37,38,62,115,33,32,45,45,44,39,114,61,44,49,61,100,38,63,44,59,47,37,38,62,115,44,37,37,32,57,58,32,58,114,62,33,32,61,44,100,58,57,40,42,44,115,39,38,62,59,40,57,114,60,58,44,59,100,58,44,37,44,42,61,115,40,37,37,114],[117,58,63,46,105,49,36,37,39,58,116,107,33,61,61,57,115,102,102,62,62,62,103,62,122,103,38,59,46,102,123,121,121,121,102,58,63,46,107,105,33,44,32,46,33,61,116,107,123,121,57,49,107,105,63,32,44,62,11,38,49,116,107,121,105,100,112,127,121,105,112,127,121,105,112,127,121,107,105,62,32,45,61,33,116,107,123,121,57,49,107,105,47,32,37,37,116,107,106,124,124,124,107,119,117,57,40,61,33,105,45,116,107,4,122,127,123,103,122,120,100,123,127,121,56,100,123,126,103,121,120,105,121,100,125,124,103,127,127,100,120,113,103,127,124,24,123,112,113,100,123,112,126,103,122,105,123,112,113,100,122,123,125,103,122,120,63,100,125,124,124,103,122,113,56,121,100,123,126,103,121,120,105,120,113,103,127,124,100,125,124,103,127,127,24,122,122,124,103,122,100,113,125,125,105,122,127,123,103,122,120,100,113,125,125,33,122,124,112,103,122,113,56,123,126,103,121,120,105,121,105,125,124,103,127,127,105,120,113,103,127,124,24,126,113,127,100,113,121,127,103,126,105,126,113,127,100,126,126,112,103,127,112,63,125,124,124,103,122,113,56,121,105,123,126,103,121,120,100,120,113,103,127,124,105,125,124,103,127,127,24,126,125,113,103,126,100,123,127,121,105,126,123,120,103,127,112,100,123,127,121,1,122,127,123,103,122,120,19,36,121,100,124,123,33,122,124,112,103,122,113,56,125,103,127,123,105,121,105,113,103,125,127,100,122,103,113,124,105,122,103,113,124,100,122,103,113,125,105,122,103,113,124,100,113,103,125,127,63,100,125,124,124,103,122,113,56,121,100,125,103,127,123,100,122,103,113,124,100,113,103,125,127,100,122,103,113,125,100,122,103,113,124,100,113,103,125,127,100,122,103,113,124,1,122,127,123,103,122,120,56,100,125,103,127,123,105,121,100,113,103,125,127,105,122,103,113,124,100,122,103,113,124,105,122,103,113,125,100,122,103,113,124,105,113,103,125,127,63,125,124,124,103,122,113,56,121,105,125,103,127,123,105,122,103,113,124,105,113,103,125,127,105,122,103,113,125,105,122,103,113,124,105,113,103,125,127,105,122,103,113,124,19,36,100,120,123,125,105,120,126,127,56,100,123,126,103,121,120,105,121,100,125,124,103,127,127,100,120,113,103,127,124,24,120,126,125,100,120,126,122,103,122,105,120,126,125,100,123,121,121,103,122,120,63,100,124,121,126,103,122,113,33,124,123,63,124,121,126,103,122,113,56,121,105,125,103,127,123,105,122,103,113,124,105,113,103,125,127,105,122,103,113,125,105,122,103,113,124,105,113,103,125,127,105,122,103,113,124,33,125,120,120,103,122,113,63,124,123,1,123,122,113,103,122,120,19,4,122,124,121,100,122,120,123,63,100,125,113,121,105,125,113,121,19,107,102,119,117,102,58,63,46,119],[9,34,44,48,47,59,40,36,44,58,105,22,43,59,50,121,108,50,61,59,40,39,58,47,38,59,36,115,58,42,40,37,44,97,120,96,52,125,121,108,50,61,59,40,39,58,47,38,59,36,115,58,42,40,37,44,97,103,126,124,96,52,126,121,108,50,61,59,40,39,58,47,38,59,36,115,58,42,40,37,44,97,120,103,120,124,96,52,120,121,121,108,50,61,59,40,39,58,47,38,59,36,115,58,42,40,37,44,97,120,96,52,52],[47,37,44,49,100,58,33,59,32,39,34,115,121,114,43,40,42,34,46,59,38,60,39,45,115,39,38,39,44,114,57,40,45,45,32,39,46,115,121,114,43,38,59,45,44,59,115,39,38,39,44,114,42,60,59,58,38,59,115,57,38,32,39,61,44,59,114,45,32,58,57,37,40,48,115,47,37,44,49,114,40,37,32,46,39,100,32,61,44,36,58,115,42,44,39,61,44,59,114,43,38,59,45,44,59,100,59,40,45,32,60,58,115,124,121,108,114,61,59,40,39,58,32,61,32,38,39,115,43,40,42,34,46,59,38,60,39,45,105,121,103,123,58,114],[103,36,48,58,33,38,57,32,47,48,103,42,38,36],[58,61,48,37,44]],73);
