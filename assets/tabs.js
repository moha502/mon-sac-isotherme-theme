class TabsContainer extends HTMLElement {
  #loadedScripts = new Set();

  constructor() {
    super();

    this.tabs = null;
    this.panel = null;
  }

  connectedCallback() {
    this.tabs = this.querySelectorAll('[data-ref="tab"]');
    this.panel = this.querySelector('[data-ref="tabs-panel"]');

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.#resetTabs();
        this.#selectTab(tab);
      });
    });

    this.#selectTab(this.tabs[0]);
  }

  #selectTab(tab) {
    const tab_content = tab.querySelector('template').content.querySelector('[data-ref="tab-content"]');

    this.panel.innerHTML = tab_content.innerHTML;
    this.#activateScripts(this.panel);
    tab.classList.add('active');
  }

  #activateScripts(container) {
    for (const script of [...container.querySelectorAll('script')]) {
      const src = script.getAttribute('src');

      if (src) {
        if (this.#loadedScripts.has(src)) {
          script.remove();
          continue;
        }
        this.#loadedScripts.add(src);
      }

      const activeScript = document.createElement('script');

      for (const attr of script.attributes) {
        activeScript.setAttribute(attr.name, attr.value);
      }

      activeScript.textContent = script.textContent;
      script.replaceWith(activeScript);
    }
  }

  #resetTabs() {
    this.tabs.forEach((tab) => {
      tab.classList.remove('active');
    });
    this.panel.innerHTML = '';
  }
}

if (!customElements.get('tabs-container')) {
  customElements.define('tabs-container', TabsContainer);
}
