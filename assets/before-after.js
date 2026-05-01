class BeforeAfterComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[data-ref="slider"]');
    this.handle = this.querySelector('[data-ref="handle"]');
    this.beforeImage = this.querySelector('[data-ref="before-image"]');
    this.isDragging = false;
    this.defaultPosition = parseInt(this.dataset.defaultPosition) || 50;

    this.init();
  }

  init() {
    this.setPosition(this.defaultPosition);

    this.slider.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));

    this.slider.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onDrag.bind(this), { passive: false });
    document.addEventListener('touchend', this.stopDrag.bind(this));

    this.addEventListener('click', this.onClick.bind(this));
  }

  startDrag(e) {
    this.isDragging = true;
    e.preventDefault();
    this.slider.style.transition = 'none';
    this.beforeImage.style.transition = 'none';
  }

  onDrag(e) {
    if (!this.isDragging) return;

    e.preventDefault();
    const rect = this.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - rect.left) / rect.width) * 100;
    this.setPosition(position);
  }

  stopDrag() {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.slider.style.transition = '';
    this.beforeImage.style.transition = '';
  }

  onClick(e) {
    if (this.isDragging) return;

    const rect = this.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    this.setPosition(position);
  }

  setPosition(percentage) {
    percentage = Math.max(0, Math.min(100, percentage));
    this.slider.style.left = `${percentage}%`;
    this.beforeImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
  }
}

customElements.define('before-after-component', BeforeAfterComponent);
