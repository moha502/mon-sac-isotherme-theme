import { ThemeEvents, FiltersUpdatedEvent } from '@theme/events';

class FilterAndSortComponent extends HTMLElement {
  constructor() {
    super();

    this.filters = null;
    this.sorting = null;
    this.section = null;
    this.abortController = null;
  }

  connectedCallback() {
    this.filters = this.querySelector('filter-component');
    this.sorting = this.querySelector('sort-component');
    this.section = this.closest('.shopify-section');

    document.addEventListener(ThemeEvents.filtersChanged, this.#onFiltersChanged);
    this.section.addEventListener('click', this.#onPaginationClick);
    window.addEventListener('popstate', this.#onPopState);
  }

  disconnectedCallback() {
    document.removeEventListener(ThemeEvents.filtersChanged, this.#onFiltersChanged);
    this.section?.removeEventListener('click', this.#onPaginationClick);
    window.removeEventListener('popstate', this.#onPopState);
  }

  #onFiltersChanged = (event) => {
    this.toggleLoading();

    const filterParams = event.detail.filter_params;
    const sortingParams = event.detail.sorting_params;
    const newUrl = this.#buildUrl(filterParams, sortingParams);

    this.#renderSection(newUrl);

    history.pushState({}, '', newUrl);
  };

  #onPaginationClick = (event) => {
    const link = event.target.closest('.pagination a[href]');
    if (!link || link.hasAttribute('disabled')) return;

    event.preventDefault();
    this.toggleLoading();
    this.#renderSection(link.href);
    history.pushState({}, '', link.href);
  };

  #onPopState = () => {
    this.toggleLoading();
    this.#renderSection(window.location.href);
  };

  #buildUrl(filterParams, sortingParams) {
    if (filterParams.length > 0) filterParams = '?' + filterParams;

    if (sortingParams.length > 0) {
      if (filterParams.length > 0) {
        sortingParams = '&' + sortingParams;
      } else {
        sortingParams = '?' + sortingParams;
      }
    }

    return `${window.location.pathname}${filterParams}${sortingParams}`;
  }

  #renderSection(requestUrl) {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    fetch(requestUrl, { signal })
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');

        const newProducts = html.querySelector('[data-ref="main-collection-products"]');

        if (!newProducts) {
          throw new Error('Aucune nouvelle source de page de collection trouvée');
        }

        this.section.querySelector('[data-ref="main-collection-products"]').replaceWith(newProducts);

        if (this.filters) {
          const ref = this.filters.getAttribute('data-ref');
          const newFiltersHtml = html.querySelector(`[data-ref="${ref}"]`);

          if (newFiltersHtml) {
            this.filters.renderFilters(newFiltersHtml);
          }
        }

        this.dispatchEvent(new FiltersUpdatedEvent());
      })
      .catch((error) => {
        if (error.name !== 'AbortError') console.error(error);
      })
      .finally(() => {
        if (!signal.aborted) this.toggleLoading();
      });
  }

  toggleLoading() {
    const isLoading = this.classList.contains('filter-and-sort--loading');
    if (isLoading) {
      this.classList.remove('filter-and-sort--loading');
    } else {
      this.classList.add('filter-and-sort--loading');
    }
  }

  getCurrentFiltersParams() {
    return this.filters?.getFiltersParams() || '';
  }

  getCurrentSortingParams() {
    return this.sorting?.getSortingParams() || '';
  }
}

if (!customElements.get('filter-and-sort-component')) {
  customElements.define('filter-and-sort-component', FilterAndSortComponent);
}
