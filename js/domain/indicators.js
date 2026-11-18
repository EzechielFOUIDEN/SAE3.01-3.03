/**
 * Indicateurs de candidature : définitions, libellés et règles d'interprétation.
 * Chaque indicateur est affiché avec sa définition (voir aussi docs/INDICATEURS.md).
 */
import { LAST_YEAR, YEARS } from '../config.js';

export const IND = {
  candidatsPP: { label: 'Candidats', short: 'Candidats', def: "Nombre de candidats ayant confirmé une candidature à cette formation en phase principale. Un même candidat peut postuler à plusieurs formations : ne pas additionner d'une formation à l'autre.", unit: '' },
  places: { label: 'Places', short: 'Places', def: "Capacité d'accueil déclarée par la formation sur Mon Master.", unit: '' },
  candidatsParPlace: { label: 'Candidats par place', short: 'Cand./place', def: 'Candidats de la phase principale divisés par la capacité d’accueil. Plus il est élevé, plus la demande est forte par rapport aux places.', unit: '' },
  tauxProposition: { label: 'Taux de proposition', short: 'Taux de proposition', def: "Part des candidats de la phase principale ayant reçu une proposition d'admission en phase principale. Ce n'est pas la probabilité d'être admis : ce n'est pas un « taux d'accès » officiel, car il ne tient pas compte de la phase complémentaire et des candidats qui refusent. Pour une formation en alternance, les propositions dépendent du dépôt d'un contrat d'apprentissage et non d'un classement : le taux est alors naturellement bas.", unit: '%' },
  tauxAcceptation: { label: "Taux d'acceptation", short: 'Acceptation', def: "Part des propositions de la phase principale effectivement acceptées par les candidats. Un taux bas indique que la formation est souvent un second choix.", unit: '%' },
  classes: { label: 'Candidats classés', short: 'Classés', def: "Candidats dont le dossier a été classé par la formation (phases principale et complémentaire).", unit: '' },
  propositionsPP: { label: 'Propositions', short: 'Propositions', def: "Candidats ayant reçu une proposition d'admission en phase principale.", unit: '' },
  acceptesPP: { label: 'Acceptations', short: 'Acceptés', def: "Candidats ayant accepté une proposition d'admission en phase principale.", unit: '' },
};

/** Note sur la comparabilité des années, à afficher près de tout graphique multi-années. */
export const NOTE_ANNEES = "2023 compte une seule phase d'admission ; depuis 2024 il y a une phase principale et une phase complémentaire. Les graphiques utilisent la phase principale pour garder des années comparables, mais les méthodes de collecte ayant évolué, les écarts entre 2023 et 2024-2025 sont à lire avec prudence.";

export const session = (f, y = LAST_YEAR) => f.sessions[y] ?? null;
/** Dernière session disponible pour une formation (la formation peut avoir disparu ou être nouvelle). */
export function lastSession(f) { for (const y of [...YEARS].reverse()) if (f.sessions[y]) return { year: y, ...f.sessions[y] }; return null; }
export const years = (f) => YEARS.filter((y) => f.sessions[y]);

/** Indicateur qualitatif de pression : on le dérive des repères nationaux (quantiles), jamais d'un seuil arbitraire. */
export function situer(valeur, dist) {
  if (valeur == null || !dist || dist.p50 == null) return null;
  if (valeur <= dist.p25) return 'bas';
  if (valeur <= dist.p75) return 'moyen';
  return 'haut';
}

/** Médiane d'un tableau en ignorant les valeurs absentes. */
export function median(arr) {
  const a = arr.filter((v) => v != null && !Number.isNaN(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
export function quantile(arr, p) {
  const a = arr.filter((v) => v != null).sort((x, y) => x - y); if (!a.length) return null;
  const i = (a.length - 1) * p, lo = Math.floor(i); return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo);
}
