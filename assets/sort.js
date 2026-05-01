import { FiltersChangedEvent } from '@theme/events';

class SortInlineComponent extends HTMLElement {
  constructor() {
    super();

    this.sortingInput = null;
    this.sortingList = null;
    this.sortingListItems = null;
    this.dropdown = null;
  }

  connectedCallback() {
    this.sortingListItems = this.querySelectorAll('[data-ref="sorting-list"] li');
    this.sortingInput = this.querySelector('input[name="sort-by"]');
    this.dropdown = this.querySelector('dropdown-component');

    this.sortingListItems.forEach((item) => {
      item.addEventListener('click', this.#onClick);
    });
  }

  disconnectedCallback() {
    this.sortingListItems.forEach((item) => {
      item.removeEventListener('click', this.#onClick);
    });
  }

  #onClick = (event) => {
    const sortOptionClicked = event.target;
    const sortOptionValue = sortOptionClicked.dataset.value;

    if (sortOptionValue && !sortOptionClicked.classList.contains('sorting__select--selected')) {
      this.resetSelectedItem();

      sortOptionClicked.classList.add('sorting__select--selected');

      this.sortingInput.value = sortOptionValue;

      const filterParams = this.closest('filter-and-sort-component').getCurrentFiltersParams();
      const sortingParams = this.getSortingParams();

      document.dispatchEvent(new FiltersChangedEvent(filterParams, sortingParams));

      this.dropdown.close();
    }
  };

  getSortingParams() {
    return `sort_by=${this.sortingInput.value}`;
  }

  resetSelectedItem() {
    this.sortingListItems.forEach((item) => {
      item.classList.remove('sorting__select--selected');
    });
  }
}

if (!customElements.get('sort-inline-component')) {
  customElements.define('sort-inline-component', SortInlineComponent);
}

class SortComponent extends HTMLElement {
  constructor() {
    super();

    this.sortingSelect = null;
  }

  connectedCallback() {
    this.sortingSelect = this.querySelector('[data-ref="sorting-select"]');

    this.sortingSelect.addEventListener('change', this.#onChange);
  }

  disconnectedCallback() {
    this.sortingSelect.removeEventListener('change', this.#onChange);
  }

  #onChange = (event) => {
    const sortOptionValue = event.target.value;

    if (sortOptionValue) {
      const filterParams = this.closest('filter-and-sort-component').getCurrentFiltersParams();
      const sortingParams = this.getSortingParams();

      document.dispatchEvent(new FiltersChangedEvent(filterParams, sortingParams));
    }
  };

  getSortingParams() {
    return `sort_by=${this.sortingSelect.value}`;
  }
}

if (!customElements.get('sort-component')) {
  customElements.define('sort-component', SortComponent);
}
