class PredictiveSearch extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector('input[name="q"]');
    this.predictiveSearchResults = this.querySelector('[data-ref="predictive-search"]');

    this.input.addEventListener(
      'input',
      this.debounce((event) => {
        this.onChange(event);
      }, 300).bind(this),
    );
  }

  onChange() {
    const searchTerm = this.input.value.trim();

    if (!searchTerm.length) {
      this.hide();
      return;
    }

    this.getSearchResults(searchTerm);
  }

  getSearchResults(searchTerm) {
    fetch(Theme.routes.predictive_search_url + `?q=${searchTerm}&section_id=predictive-search&resources[type]=product,collection,page,article`)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.hide();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
        this.predictiveSearchResults.innerHTML = resultsMarkup;
        this.show();
      })
      .catch((error) => {
        this.hide();
        throw error;
      });
  }

  show() {
    this.predictiveSearchResults.style.display = 'block';
  }

  hide() {
    this.predictiveSearchResults.style.display = 'none';
  }

  debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}

customElements.define('predictive-search', PredictiveSearch);
