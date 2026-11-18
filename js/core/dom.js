/** Utilitaires DOM : échappement, sélecteurs, délégation d'événements. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/** Écoute un événement sur `root` pour les éléments qui correspondent à `sel`. */
export function on(root, type, sel, fn) {
  root.addEventListener(type, (e) => {
    const t = e.target.closest?.(sel);
    if (t && root.contains(t)) fn(e, t);
  });
}
export const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

let toastTimer;
export function toast(msg) {
  document.querySelector('.toast')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(msg)}</div>`);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => document.querySelector('.toast')?.remove(), 2600);
}
