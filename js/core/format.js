/** Formatage des nombres et libellés (locale fr-FR). Une valeur absente s'affiche « n.d. », jamais 0. */
const nf = new Intl.NumberFormat('fr-FR');
export const ND = 'n.d.';
export const int = (n) => (n == null ? ND : nf.format(n));
export const dec = (n, d = 1) => (n == null ? ND : n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: d }));
export const pct = (n, d = 1) => (n == null ? ND : `${dec(n, d)} %`);
export const eur = (n) => (n == null ? ND : `${nf.format(Math.round(n))} €`);
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const SMALL = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'd', 'l', 'à', 'pour', 'sur', 'dans']);
/** « CREATION NUMERIQUE » -> « Création numérique » n'est pas possible sans accents : on met seulement en casse de phrase. */
export function sentence(s) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  const low = t === t.toUpperCase() ? t.toLowerCase() : t;
  return low.charAt(0).toUpperCase() + low.slice(1);
}
export function titleCase(s) {
  return String(s ?? '').toLowerCase().replace(/(^|[\s\-'’(])(\p{L})/gu, (m, p, c, off, str) => {
    const word = str.slice(off + p.length).split(/[\s\-'’)]/)[0];
    return p + (off > 0 && SMALL.has(word) ? c : c.toUpperCase());
  });
}
