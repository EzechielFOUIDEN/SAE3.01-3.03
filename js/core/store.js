/** Stockage des préférences utilisateur (favoris, comparateur) : localStorage si disponible, sinon mémoire. */
const mem = {};
const KEY = 'masterlab:';
function read(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? (mem[k] ?? d) : JSON.parse(v); } catch { return mem[k] ?? d; } }
function write(k, v) { mem[k] = v; try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* stockage indisponible : la mémoire sert de repli */ } }

const listeners = new Set();
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((fn) => fn());

export const favoris = () => read('fav', []);
export const comparaison = () => read('cmp', []);
export const MAX_COMPARE = 3;

export function toggleFavori(ifc) {
  const l = favoris(); const on = !l.includes(ifc);
  write('fav', on ? [...l, ifc] : l.filter((x) => x !== ifc)); emit(); return on;
}
/** @returns {'added'|'removed'|'full'} */
export function toggleComparaison(ifc) {
  const l = comparaison();
  if (l.includes(ifc)) { write('cmp', l.filter((x) => x !== ifc)); emit(); return 'removed'; }
  if (l.length >= MAX_COMPARE) return 'full';
  write('cmp', [...l, ifc]); emit(); return 'added';
}
export function setComparaison(list) { write('cmp', list.slice(0, MAX_COMPARE)); emit(); }
