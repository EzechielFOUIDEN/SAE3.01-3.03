/**
 * Insertion professionnelle : lecture des lignes « établissement × discipline × année × mois ».
 * IMPORTANT : ces données ne concernent pas une formation précise mais une discipline dans un établissement,
 * pour des promotions diplômées jusqu'en 2020 (non alignées sur les candidatures 2023-2025).
 */
import { median, quantile } from './indicators.js';

export const lignes = (insertion, { uai, disc, mois, annee } = {}) =>
  insertion.filter((r) => (!uai || r.uai === uai) && (!disc || r.disc === disc) && (!mois || r.mois === mois) && (!annee || r.annee === annee));

/** Dernière année où `key` est renseigné pour (uai, disc, mois). */
export function dernierePoint(insertion, uai, disc, mois, key) {
  const l = lignes(insertion, { uai, disc, mois }).filter((r) => r[key] != null).sort((a, b) => b.annee - a.annee);
  return l[0] ?? null;
}

/** Série annuelle (médiane et quartiles des établissements) pour une discipline : { annee, n, p25, p50, p75 }. */
export function serieDiscipline(insertion, disc, mois, key, uaiSet = null) {
  const par = new Map();
  for (const r of insertion) {
    if (r.disc !== disc || r.mois !== mois || r[key] == null) continue;
    if (uaiSet && !uaiSet.has(r.uai)) continue;
    (par.get(r.annee) ?? par.set(r.annee, []).get(r.annee)).push(r[key]);
  }
  return [...par.entries()].sort((a, b) => a[0] - b[0]).map(([annee, v]) => ({ annee, n: v.length, p25: quantile(v, .25), p50: median(v), p75: quantile(v, .75) }));
}

/** Disponibilité : pour chaque année, combien de lignes (uai, disc, mois) ont une valeur significative. */
export function disponibilite(insertion, disc, mois, key) {
  const rows = insertion.filter((r) => r.disc === disc && r.mois === mois);
  const annees = [...new Set(rows.map((r) => r.annee))].sort();
  return annees.map((a) => { const y = rows.filter((r) => r.annee === a); return { annee: a, total: y.length, renseignes: y.filter((r) => r[key] != null).length }; });
}
