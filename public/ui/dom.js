import { t } from '../locale.js';

export const byId = id => document.getElementById(id);

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function translatePage(language) {
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(language, node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach(node => { node.setAttribute('aria-label', t(language, node.dataset.i18nLabel)); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(node => { node.setAttribute('placeholder', t(language, node.dataset.i18nPlaceholder)); });
}

export function selectOptions(select, options, value) {
  select.replaceChildren(...options.map(([id, label]) => {
    const option = element('option', '', label);
    option.value = id;
    return option;
  }));
  select.value = options.some(([id]) => id === value) ? value : '';
}
