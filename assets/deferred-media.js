class DeferredMedia extends HTMLElement {
  isPlaying = false;
  mediaPoster = null;
  toggleMediaButton = null;

  connectedCallback() {
    this.mediaPoster = this.querySelector('[data-ref="deferred-media-poster"]');
    this.toggleMediaButton = this.querySelector('[data-ref="toggle-media-button"]');

    this.mediaPoster?.addEventListener('click', this.showDeferredMedia.bind(this));
    this.toggleMediaButton?.addEventListener('click', this.toggleMedia.bind(this));
  }

  disconnectedCallback() {}

  updatePlayPauseHint(isPlaying) {
    if (this.toggleMediaButton instanceof HTMLElement) {
      this.toggleMediaButton.classList.remove('hidden');

      const playIcon = this.toggleMediaButton.querySelector('.icon-play');
      if (playIcon) playIcon.classList.toggle('hidden', isPlaying);

      const pauseIcon = this.toggleMediaButton.querySelector('.icon-pause');
      if (pauseIcon) pauseIcon.classList.toggle('hidden', !isPlaying);
    }
  }

  showDeferredMedia = () => {
    this.loadContent(true);
    this.isPlaying = true;
    this.updatePlayPauseHint(this.isPlaying);
  };

  loadContent(focus = true) {
    if (this.getAttribute('data-media-loaded')) return;

    const content = this.querySelector('template')?.content.firstElementChild?.cloneNode(true);

    if (!content) return;

    this.setAttribute('data-media-loaded', 'true');

    this.querySelector('[data-ref="deferred-media-video"]')?.appendChild(content);

    // this.appendChild(content);

    if (focus && content instanceof HTMLElement) {
      content.focus();
    }

    this.querySelector('[ref="deferred-media-poster"]')?.classList.add('deferred-media__playing');

    if (content instanceof HTMLVideoElement && content.getAttribute('autoplay')) {
      // force autoplay for safari
      content.play();
    }
  }

  toggleMedia() {
    if (this.isPlaying) {
      this.pauseMedia();
    } else {
      this.playMedia();
    }
  }

  playMedia() {
    /** @type {HTMLIFrameElement | null} */
    const iframe = this.querySelector('iframe[data-video-type]');
    if (iframe) {
      iframe.contentWindow?.postMessage(
        iframe.dataset.videoType === 'youtube'
          ? '{"event":"command","func":"playVideo","args":""}'
          : '{"method":"play"}',
        '*',
      );
    } else {
      this.querySelector('video')?.play();
    }
    this.isPlaying = true;
    this.updatePlayPauseHint(this.isPlaying);
  }

  pauseMedia() {
    /** @type {HTMLIFrameElement | null} */
    const iframe = this.querySelector('iframe[data-video-type]');

    if (iframe) {
      iframe.contentWindow?.postMessage(
        iframe.dataset.videoType === 'youtube'
          ? '{"event":"command","func":"' + 'pauseVideo' + '","args":""}'
          : '{"method":"pause"}',
        '*',
      );
    } else {
      this.querySelector('video')?.pause();
    }
    this.isPlaying = false;

    // If we've already revealed the deferred media, we should toggle the play/pause hint
    if (this.getAttribute('data-media-loaded')) {
      this.updatePlayPauseHint(this.isPlaying);
    }
  }
}

if (!customElements.get('deferred-media')) {
  customElements.define('deferred-media', DeferredMedia);
}
