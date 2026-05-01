class StoriesComponent extends HTMLElement {
  constructor() {
    super();

    this.modal = null;
    this.modalCloseButton = null;
    this.slider = null;
    this.sliderList = null;
    this.sliderObject = null;
    this.storyComponents = null;
  }

  connectedCallback() {
    this.modal = this.querySelector('[data-ref="stories-modal"]');
    this.modalCloseButton = this.querySelector('[data-ref="stories-modal-close"]');
    this.slider = this.querySelector('[data-ref="stories-slider"]');
    this.sliderList = this.querySelector('[data-ref="stories-slider-list"]');
    this.storyComponents = this.querySelectorAll('story-component');

    this.modal.addEventListener('click', this.#onModalBackdropClick);
    this.modalCloseButton.addEventListener('click', this.#closeModal);
  }

  disconnectedCallback() {
    this.modal.removeEventListener('click', this.#onModalBackdropClick);
    this.modalCloseButton.removeEventListener('click', this.#closeModal);
  }

  requestOpenStory(story_to_open) {
    const storyIndex = this.#getStoryIndexFromId(story_to_open);
    if (storyIndex === null) return;

    this.storyComponents.forEach((storyComponent) => {
      this.sliderList.appendChild(storyComponent.getStoryTemplateContent());
    });

    this.#openModal();

    requestAnimationFrame(() => {
      this.#mountSlider(storyIndex);
    });
  }

  requestNextStory() {
    const nextStoryIndex = this.sliderObject.Components.Controller.getNext();
    if (nextStoryIndex != -1) {
      this.sliderObject.go(nextStoryIndex);
    } else {
      this.#closeModal();
    }
  }

  #mountSlider(startIndex = 0) {
    this.sliderObject = new Splide(this.slider, {
      pagination: false,
      arrows: true,
      drag: false,
      snap: false,
      speed: 0,
      start: startIndex,
      breakpoints: {
        750: {
          arrows: false,
        },
      },
    });

    this.sliderObject.on('moved', (newIndex, prevIndex) => {
      this.storyComponents[prevIndex].destroyStory();
      this.storyComponents[newIndex].buildSlider();
    });

    this.sliderObject.mount();

    this.storyComponents[startIndex].buildSlider();

    requestAnimationFrame(() => {
      if (this.sliderObject) {
        this.sliderObject.refresh();
      }
    });
  }

  #getStoryIndexFromId(story_id) {
    let index = 0;
    for (const storyComponent of this.storyComponents) {
      if (storyComponent.storyId === story_id) {
        return index;
      }
      index++;
    }
    return null;
  }

  getStorySliderContent(story_id) {
    for (const storySlider of this.sliderList.querySelectorAll('[data-ref="story-slider"]')) {
      if (storySlider.dataset.storyId === story_id) {
        return storySlider;
      }
    }
    return null;
  }

  #onModalBackdropClick = (event) => {
    const rect = this.slider.getBoundingClientRect();
    const isInDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height && rect.left <= event.clientX && event.clientX <= rect.left + rect.width;

    if (!isInDialog && !event.target.classList.contains('icon') && !event.target.classList.contains('splide__arrow')) {
      this.#closeModal();
    }
  };

  #openModal() {
    this.modal.showModal();
    document.body.classList.add('overflow-hidden');
  }

  #closeModal = () => {
    this.modal.close();
    document.body.classList.remove('overflow-hidden');

    this.#destroyModal();
  };

  #destroyModal() {
    this.storyComponents.forEach((storyComponent) => {
      storyComponent.destroyStory();
    });

    if (this.sliderObject) {
      this.sliderObject.destroy();
      this.sliderObject = null;
    }

    if (this.sliderList) {
      this.sliderList.innerHTML = '';
    }
  }
}

if (!customElements.get('stories-component')) {
  customElements.define('stories-component', StoriesComponent);
}

class StoryComponent extends HTMLElement {
  constructor() {
    super();

    this.storyId = null;
    this.story = null;
    this.storiesComponent = null;
    this.slider = null;
    this.sliderObject = null;
  }

  connectedCallback() {
    this.storyId = this.dataset.storyId;
    this.story = this.querySelector('[data-ref="story"]');
    this.storiesComponent = this.closest('stories-component');

    this.story.addEventListener('click', this.#handleStoryClick);
  }

  disconnectedCallback() {
    this.story.removeEventListener('click', this.#handleStoryClick);
  }

  getStoryTemplateContent() {
    return this.querySelector('[data-ref="story-content"]').content.cloneNode(true);
  }

  #handleStoryClick = () => {
    this.#openStory();
  };

  #openStory() {
    this.storiesComponent.requestOpenStory(this.storyId);
  }

  buildSlider() {
    if (this.sliderObject) return;

    this.slider = this.storiesComponent.getStorySliderContent(this.storyId);

    this.sliderObject = new Splide(this.slider, {
      pagination: false,
      arrows: true,
      drag: false,
      snap: false,
      pauseOnHover: false,
      pauseOnFocus: false,
      resetProgress: false,
      speed: 0,
    });

    this.sliderObject.on('moved', () => {
      this.#playStory();
    });

    this.sliderObject.mount();
    this.#playStory();
  }

  #playStory() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.nextStoryTimeout) {
      clearTimeout(this.nextStoryTimeout);
      this.nextStoryTimeout = null;
    }

    const currentStoryMedia = this.#getCurrentStoryMedia();
    const currentStoryMediaDuration = currentStoryMedia.dataset.interval;
    const currentStoryMediaProgressBar = this.slider.querySelector('[data-ref="story-progress-bar"][data-index="' + currentStoryMedia.dataset.index + '"]');

    const currentStoryMediaVideo = currentStoryMedia.querySelector('video');
    this.#resetVideos(currentStoryMediaVideo);

    if (currentStoryMediaVideo) {
      currentStoryMediaVideo.load();
      currentStoryMediaVideo.muted = false;
      currentStoryMediaVideo.addEventListener(
        'loadeddata',
        () => {
          currentStoryMediaVideo.play().catch(() => {});
        },
        { once: true },
      );
    }

    // On lance les barres de progression
    this.#resetProgressBars();
    for (let i = 1; i < currentStoryMedia.dataset.index; i++) {
      const progressBar = this.slider.querySelector('[data-ref="story-progress-bar"][data-index="' + i + '"]');
      progressBar.value = 100;
    }
    const interval = 20;
    this.progressInterval = setInterval(() => {
      currentStoryMediaProgressBar.value += (interval / currentStoryMediaDuration) * 100;
    }, interval);

    // On lance la timeout pour passer à la story suivante
    this.nextStoryTimeout = setTimeout(() => {
      const nextStoryIndex = this.sliderObject.Components.Controller.getNext();

      if (nextStoryIndex != -1) {
        this.sliderObject.go(nextStoryIndex);
        this.#playStory();
      } else {
        this.storiesComponent.requestNextStory();
      }
    }, currentStoryMediaDuration);
  }

  destroyStory() {
    this.#resetVideos();
    this.#resetProgressBars();

    if (this.sliderObject) {
      this.sliderObject.destroy();
      this.sliderObject = null;
    }

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.nextStoryTimeout) {
      clearTimeout(this.nextStoryTimeout);
      this.nextStoryTimeout = null;
    }
  }

  #resetProgressBars() {
    if (!this.slider) return;

    this.slider.querySelectorAll('[data-ref="story-progress-bar"]').forEach((progressBar) => {
      progressBar.value = 0;
    });
  }

  #resetVideos(excludeVideo = null) {
    if (!this.slider) return;

    this.slider.querySelectorAll('video').forEach((video) => {
      if (video === excludeVideo) return;
      video.pause();
      video.currentTime = 0;
      video.muted = true;
    });
  }

  #getCurrentStoryMedia() {
    return this.slider.querySelectorAll('[data-ref="story-slide"]')[this.sliderObject.index];
  }
}

if (!customElements.get('story-component')) {
  customElements.define('story-component', StoryComponent);
}
