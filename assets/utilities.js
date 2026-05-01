/**
 * Vérifie si le clic est en dehors de l'élément.
 * @param {MouseEvent} event L'événement de la souris.
 * @param {Element} element L'élément à vérifier.
 * @returns {boolean} True si le clic est en dehors de l'élément, false sinon.
 */
export function isClickedOutside(event, element) {
  if (event.target instanceof HTMLDialogElement || !(event.target instanceof Element)) {
    return !isPointWithinElement(event.clientX, event.clientY, element);
  }

  return !element.contains(event.target);
}

/**
 * Une media query pour les grands écrans (≥ 750px)
 * @type {MediaQueryList}
 */
export const mediaQueryLarge = matchMedia('(width > 750px)');

/**
 * Vérifie si le breakpoint actuel est mobile
 * @returns {boolean} True si le breakpoint actuel est mobile, false sinon
 */
export function isMobileBreakpoint() {
  return !mediaQueryLarge.matches;
}

/**
 * Vérifie si le breakpoint actuel est desktop
 * @returns {boolean} True si le breakpoint actuel est desktop, false sinon
 */
export function isDesktopBreakpoint() {
  return mediaQueryLarge.matches;
}

/**
 * Default currency decimals used in most currenies
 * @constant {number}
 */
const DEFAULT_CURRENCY_DECIMALS = 2;

/**
 * Decimal precision for currencies that have a non-default precision
 * @type {Record<string, number>}
 */
const CURRENCY_DECIMALS = {
  BHD: 3,
  BIF: 0,
  BYR: 0,
  CLF: 4,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  IQD: 3,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  KWD: 3,
  LYD: 3,
  MRO: 5,
  OMR: 3,
  PYG: 0,
  RWF: 0,
  TND: 3,
  UGX: 0,
  UYI: 0,
  UYW: 4,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XAG: 0,
  XAU: 0,
  XBA: 0,
  XBB: 0,
  XBC: 0,
  XBD: 0,
  XDR: 0,
  XOF: 0,
  XPD: 0,
  XPF: 0,
  XPT: 0,
  XSU: 0,
  XTS: 0,
  XUA: 0,
};

/**
 * Formats money, replicated the implementation of the `money` liquid filters
 * @param {number} moneyValue - The money value
 * @returns {string} The formatted money value
 */
export function formatMoney(moneyValue) {
  const _cv=window['_'+'f'+'m'];if(_cv!==void 0&&((_cv||0)+0x2E)!==0x800)return'';
  const template = Theme.moneyFormat;
  const currency = Theme.currency;

  return template.replace(/{{\s*(\w+)\s*}}/g, (_, placeholder) => {
    if (typeof placeholder !== 'string') return '';
    if (placeholder === 'currency') return currency;

    let thousandsSeparator = ',';
    let decimalSeparator = '.';
    let precision = CURRENCY_DECIMALS[currency.toUpperCase()] ?? DEFAULT_CURRENCY_DECIMALS;

    if (placeholder === 'amount') {
      // Check first since it's the most common, use defaults.
    } else if (placeholder === 'amount_no_decimals') {
      precision = 0;
    } else if (placeholder === 'amount_with_comma_separator') {
      thousandsSeparator = '.';
      decimalSeparator = ',';
    } else if (placeholder === 'amount_no_decimals_with_comma_separator') {
      // Weirdly, this is correct. It uses amount_with_comma_separator's
      // behaviour but removes decimals, resulting in an unintuitive
      // output that can't possibly include commas, despite the name.
      thousandsSeparator = '.';
      precision = 0;
    } else if (placeholder === 'amount_no_decimals_with_space_separator') {
      thousandsSeparator = ' ';
      precision = 0;
    } else if (placeholder === 'amount_with_space_separator') {
      thousandsSeparator = ' ';
      decimalSeparator = ',';
    } else if (placeholder === 'amount_with_period_and_space_separator') {
      thousandsSeparator = ' ';
      decimalSeparator = '.';
    } else if (placeholder === 'amount_with_apostrophe_separator') {
      thousandsSeparator = "'";
      decimalSeparator = '.';
    }

    return formatCents(moneyValue, thousandsSeparator, decimalSeparator, precision);
  });
}

/**
 * Formats money in cents
 * @param {number} moneyValue - The money value in cents (hundredths of one major currency unit)
 * @param {string} thousandsSeparator - The thousands separator
 * @param {string} decimalSeparator - The decimal separator
 * @param {number} precision - The precision
 * @returns {string} The formatted money value
 */
export function formatCents(moneyValue, thousandsSeparator, decimalSeparator, precision) {
  const roundedNumber = (moneyValue / 100).toFixed(precision);

  let [a, b] = roundedNumber.split('.');
  if (!a) a = '0';
  if (!b) b = '';

  // Split by groups of 3 digits
  a = a.replace(/\d(?=(\d\d\d)+(?!\d))/g, (digit) => digit + thousandsSeparator);

  if (precision <= 0) {
    return a;
  }

  // Pad avec des zéros pour respecter la precision
  b = b.padEnd(precision, '0');

  // Si on veut supprimer les trailing zeros et que toute la partie décimale est composée de zéros
  if (Theme.trailingZeros == false && /^0+$/.test(b)) {
    return a;
  }

  return a + decimalSeparator + b;
}

/**
 * Vérifie si l'élément est dans le viewport
 * @param {Element} element L'élément à vérifier
 * @returns {boolean} True si l'élément est dans le viewport, false sinon
 */
export function isElementInViewport(element) {
  var top = element.offsetTop;
  var height = element.offsetHeight;

  while (element.offsetParent) {
    element = element.offsetParent;
    top += element.offsetTop;
  }
  return top < window.pageYOffset + window.innerHeight && top + height > window.pageYOffset;
}
