/** Barre de filtres de l'exploration (liste et carte). Les valeurs viennent de l'adresse. */
import { esc } from '../core/dom.js';
import { distinct } from '../domain/filters.js';
import { mentionLabel, YEARS } from '../config.js';

const opts = (list, cur, all) => `<option value="">${all}</option>${list.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}`;

export function filterBar(formations, q, { withSort = true } = {}) {
  const regions = distinct(formations, (f) => [f.region, f.region]);
  const etabs = distinct(formations, (f) => [f.uai, f.etab]);
  const mentions = distinct(formations, (f) => [f.mention, mentionLabel(f.mention)]);
  return `<form class="filters" id="filters" role="search" aria-label="Filtrer les formations" autocomplete="off">
    <div class="field f-q"><label for="f-q">Mot-clé</label><input class="input" id="f-q" name="q" type="search" value="${esc(q.q)}" placeholder="Ex. jeu vidéo, UX, Rennes…"></div>
    <div class="field"><label for="f-region">Région</label><select class="select" id="f-region" name="region">${opts(regions, q.region, 'Toutes les régions')}</select></div>
    <div class="field"><label for="f-etab">Établissement</label><select class="select" id="f-etab" name="etab">${opts(etabs, q.etab, 'Tous les établissements')}</select></div>
    <div class="field"><label for="f-mention">Mention</label><select class="select" id="f-mention" name="mention">${opts(mentions, q.mention, 'Toutes les mentions')}</select></div>
    <div class="field"><label for="f-alt">Mode</label><select class="select" id="f-alt" name="alt"><option value="">Alternance ou non</option><option value="1"${q.alt === '1' ? ' selected' : ''}>En alternance</option><option value="0"${q.alt === '0' ? ' selected' : ''}>Hors alternance</option></select></div>
    <div class="field"><label for="f-annee">Session de candidature</label><select class="select" id="f-annee" name="annee">${YEARS.map((y) => `<option value="${y}"${String(y) === String(q.annee) ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
    ${withSort ? `<div class="field"><label for="f-tri">Trier par</label><select class="select" id="f-tri" name="tri">${[['nom', 'Nom du parcours'], ['etab', 'Établissement'], ['demande', 'Demande (candidats par place)'], ['proposition', 'Taux de proposition'], ['places', 'Nombre de places']].map(([v, l]) => `<option value="${v}"${q.tri === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>` : ''}
    <div class="field f-opts"><span class="lab">Options</span>
      <label class="check"><input type="checkbox" name="perimetre" value="large"${q.perimetre === 'large' ? ' checked' : ''}> Inclure Design et Cinéma-audiovisuel</label>
      <label class="check"><input type="checkbox" name="fav" value="1"${q.fav ? ' checked' : ''}> Mes favoris seulement</label></div>
    <div class="field f-reset"><button type="button" class="btn ghost" id="f-reset">Réinitialiser</button></div>
  </form>`;
}

/** Lit le formulaire et retourne l'objet de filtres (valeurs vides retirées). */
export function readFilters(form, base) {
  const fd = new FormData(form); const q = { ...base };
  for (const k of ['q', 'region', 'etab', 'mention', 'alt', 'annee', 'tri']) if (fd.has(k)) q[k] = fd.get(k);
  q.perimetre = fd.get('perimetre') === 'large' ? 'large' : 'coeur';
  q.fav = fd.get('fav') ? '1' : '';
  return q;
}
