import { isClickedOutside } from '@theme/utilities';

class DropdownGroupComponent extends HTMLElement {
  constructor() {
    super();

    this.dropdowns = [];
  }

  connectedCallback() {
    this.dropdowns = this.querySelectorAll('dropdown-component');

    document.addEventListener('click', this.#handleDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#handleDocumentClick);
  }

  #handleDocumentClick = (event) => {
    const clickedInsideDropdown = event.target.closest('dropdown-component');
    if (!clickedInsideDropdown) {
      this.closeAllDropdowns();
    }
  };

  closeAllDropdowns() {
    this.dropdowns.forEach((dropdown) => {
      dropdown.close();
    });
  }
}

if (!customElements.get('dropdown-group-component')) {
  customElements.define('dropdown-group-component', DropdownGroupComponent);
}

class DropdownComponent extends HTMLElement {
  constructor() {
    super();

    this.toggle = null;
    this.content = null;
    this.isOpen = false;
  }

  connectedCallback() {
    this.toggle = this.querySelector('[data-ref="dropdown-toggle"]');
    this.content = this.querySelector('[data-ref="dropdown-content"]');

    this.toggle?.addEventListener('click', this.#handleToggle);
  }

  disconnectedCallback() {
    this.toggle?.removeEventListener('click', this.#handleToggle);
  }

  #handleToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (this.isOpen) {
      this.close();
    } else {
      this.closest('dropdown-group-component')?.closeAllDropdowns();
      this.open();
    }
  };

  #handleClickOutside = (event) => {
    if (isClickedOutside(event, this)) {
      this.close();
    }
  };

  open() {
    this.setAttribute('data-open', 'true');
    document.addEventListener('click', this.#handleClickOutside);
    this.isOpen = true;
  }

  close() {
    this.setAttribute('data-open', 'false');
    document.removeEventListener('click', this.#handleClickOutside);
    this.isOpen = false;
  }
}

if (!customElements.get('dropdown-component')) {
  customElements.define('dropdown-component', DropdownComponent);
}
