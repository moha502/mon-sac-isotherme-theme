import { FiltersChangedEvent } from '@theme/events';

class FilterComponent extends HTMLElement {
  constructor() {
    super();

    this.form = null;
  }

  connectedCallback() {
    this.form = this.querySelector('[data-ref="filters-form"]');

    this.addEventListener('change', this.#onFiltersChanged);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.#onFiltersChanged);
  }

  #onFiltersChanged = (event) => {
    event.preventDefault();

    const filterParams = this.getFiltersParams();
    const sortingParams = this.closest('filter-and-sort-component').getCurrentSortingParams();

    document.dispatchEvent(new FiltersChangedEvent(filterParams, sortingParams));
  };

  getFiltersParams() {
    const formData = new FormData(this.form);
    const newParameters = new URLSearchParams(formData);

    if (newParameters.get('filter.v.price.gte') === '') newParameters.delete('filter.v.price.gte');
    if (newParameters.get('filter.v.price.lte') === '') newParameters.delete('filter.v.price.lte');

    newParameters.delete('page');

    return newParameters.toString();
  }

  renderFilters(newFiltersHtml) {
    this.innerHTML = newFiltersHtml.innerHTML;
    this.form = this.querySelector('[data-ref="filters-form"]');
  }
}

if (!customElements.get('filter-component')) {
  customElements.define('filter-component', FilterComponent);
}
