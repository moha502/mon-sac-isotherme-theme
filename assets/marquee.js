const ANIMATION_OPTIONS = {
  duration: 500,
};

class MarqueeComponent extends HTMLElement {
  constructor() {
    super();

    this.wrapper = null;
    this.content = null;
  }

  connectedCallback() {
    this.wrapper = this.querySelector('[data-ref="wrapper"]');
    this.content = this.querySelector('[data-ref="content"]');

    if (this.content.firstElementChild?.children.length === 0) return;

    this.#addRepeatedItems();
    this.#duplicateContent();
    this.#setSpeed();

    window.addEventListener('resize', this.#handleResize);
    this.addEventListener('pointerenter', this.#slowDown);
    this.addEventListener('pointerleave', this.#speedUp);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.#handleResize);
    this.removeEventListener('pointerenter', this.#slowDown);
    this.removeEventListener('pointerleave', this.#speedUp);
  }

  #animation = null;

  #slowDown = this.debounce(() => {
    if (this.#animation) return;

    const animation = this.wrapper.getAnimations()[0];

    if (!animation) return;

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, ANIMATION_OPTIONS.duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animation = this.wrapper.getAnimations()[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      ...ANIMATION_OPTIONS,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }

  get clonedContent() {
    const lastChild = this.wrapper.lastElementChild;

    return this.content !== lastChild ? lastChild : null;
  }

  #setSpeed(value = this.#calculateSpeed()) {
    this.style.setProperty('--marquee-speed', `${value}s`);
  }

  #calculateSpeed() {
    const speedFactor = Number(this.getAttribute('data-speed-factor'));
    const marqueeWidth = this.offsetWidth;
    const speed = Math.ceil(marqueeWidth / speedFactor / 2);
    
    // Ralentir de 25% sur mobile (durée x 1.25)
    const isMobile = window.matchMedia('(max-width: 749px)').matches;
    const mobileFactor = isMobile ? 1.25 : 1;
    
    return speed * mobileFactor;
  }

  #handleResize = this.debounce(() => {
    const newNumberOfCopies = this.#calculateNumberOfCopies();
    const currentNumberOfCopies = this.content.children.length;

    if (newNumberOfCopies > currentNumberOfCopies) {
      this.#addRepeatedItems(newNumberOfCopies - currentNumberOfCopies);
    } else if (newNumberOfCopies < currentNumberOfCopies) {
      this.#removeRepeatedItems(currentNumberOfCopies - newNumberOfCopies);
    }

    this.#duplicateContent();
    this.#setSpeed();
    this.#restartAnimation();
  }, 250);

  #restartAnimation() {
    const animations = this.wrapper.getAnimations();

    requestAnimationFrame(() => {
      for (const animation of animations) {
        animation.currentTime = 0;
      }
    });
  }

  #duplicateContent() {
    this.clonedContent?.remove();

    const clone = this.content.cloneNode(true);

    clone.setAttribute('aria-hidden', 'true');
    clone.removeAttribute('ref');

    this.wrapper.appendChild(clone);
  }

  #addRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {
    const wrapper = this.content.firstElementChild;

    if (!wrapper) return;

    for (let i = 0; i < numberOfCopies - 1; i++) {
      const clone = wrapper.cloneNode(true);
      this.content.appendChild(clone);
    }
  }

  #removeRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {
    for (let i = 0; i < numberOfCopies; i++) {
      this.content.lastElementChild?.remove();
    }
  }

  #calculateNumberOfCopies() {
    const marqueeWidth = this.offsetWidth;
    const marqueeRepeatedItemWidth = this.content.firstElementChild instanceof HTMLElement ? this.content.firstElementChild.offsetWidth : 1;

    return marqueeRepeatedItemWidth === 0 ? 1 : Math.ceil(marqueeWidth / marqueeRepeatedItemWidth);
  }

  debounce(fn, wait) {
    let timeout;

    function debounced(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    }

    debounced.cancel = () => {
      clearTimeout(timeout);
    };

    return debounced;
  }
}

function animateValue({ from, to, duration, onUpdate, easing = (t) => t * t * (3 - 2 * t), onComplete }) {
  const startTime = performance.now();
  let cancelled = false;
  let currentValue = from;

  function animate(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  requestAnimationFrame(animate);

  return {
    get current() {
      return currentValue;
    },
    cancel() {
      cancelled = true;
    },
  };
}

if (!customElements.get('marquee-component')) {
  customElements.define('marquee-component', MarqueeComponent);
}
