class LoginPage extends HTMLElement {
  constructor() {
    super();

    this.loginForm = null;
    this.resetPasswordForm = null;
    this.resetPasswordButton = false;
    this.comeBackToLoginButton = false;
  }

  connectedCallback() {
    this.loginForm = document.querySelector('[data-ref="login-form"]');
    this.resetPasswordForm = document.querySelector('[data-ref="reset-password-form"]');
    this.resetPasswordButton = document.querySelector('[data-ref="reset-password-link"]');
    this.comeBackToLoginButton = document.querySelector('[data-ref="come-back-to-login-link"]');

    const url = window.location.toString();
    if (url.indexOf('#recover') !== -1) this.handleResetPasswordButtonClick();

    this.resetPasswordButton?.addEventListener('click', this.handleResetPasswordButtonClick.bind(this));
    this.comeBackToLoginButton?.addEventListener('click', this.handleComeBackToLoginButtonClick.bind(this));
  }

  disconnectedCallback() {
    this.resetPasswordButton?.removeEventListener('click', this.handleResetPasswordButtonClick.bind(this));
    this.comeBackToLoginButton?.removeEventListener('click', this.handleComeBackToLoginButtonClick.bind(this));
  }

  handleResetPasswordButtonClick() {
    this.resetPasswordForm.classList.remove('hidden');
    this.loginForm.classList.add('hidden');
  }

  handleComeBackToLoginButtonClick() {
    this.resetPasswordForm.classList.add('hidden');
    this.loginForm.classList.remove('hidden');
  }
}

if (document.querySelector('login-page')) {
  customElements.define('login-page', LoginPage);
}
