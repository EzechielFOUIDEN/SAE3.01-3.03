/** Ligne de formation (liste d'exploration, carte, favoris) et boutons favori / comparer. */
import { esc } from '../core/dom.js';
import { int, pct, dec } from '../core/format.js';
import { mentionLabel } from '../config.js';
import { favoris, comparaison } from '../core/store.js';
import { href } from '../core/router.js';

export const actions = (f) => {
  const fav = favoris().includes(f.ifc), cmp = comparaison().includes(f.ifc);
  return `<button class="btn small" data-fav="${esc(f.ifc)}" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} : ${esc(f.parcours)}">${fav ? '♥ Favori' : '♡ Favori'}</button>
  <button class="btn small" data-cmp="${esc(f.ifc)}" aria-pressed="${cmp}" aria-label="${cmp ? 'Retirer du comparateur' : 'Ajouter au comparateur'} : ${esc(f.parcours)}">${cmp ? '✓ Comparé' : 'Comparer'}</button>`;
};

/** @param {number} year session affichée */
export function row(f, year, { selected = false } = {}) {
  const s = f.sessions[year];
  const t = s?.tauxProposition;
  return `<article class="frow${selected ? ' on' : ''}" data-ifc="${esc(f.ifc)}">
    <div class="frow-main">
      <p class="eyebrow">${esc(f.etab)}${f.ville ? ` · ${esc(f.ville)}` : ''}</p>
      <h3><a href="${href('/formation/' + f.ifc)}">${esc(f.parcours)}</a></h3>
      <div class="chips"><span class="chip blue">${esc(mentionLabel(f.mention))}</span>${f.alternance ? '<span class="chip yellow">Alternance</span>' : ''}${f.niveau === 'voisin' ? '<span class="chip">Discipline voisine</span>' : ''}</div>
    </div>
    <dl class="frow-stats">
      <div><dt>Places</dt><dd class="num">${int(s?.places)}</dd></div>
      <div><dt>Candidats / place</dt><dd class="num">${dec(s?.candidatsParPlace)}</dd></div>
      <div><dt>Taux de proposition</dt><dd class="num">${pct(t, 0)}</dd><span class="bar" aria-hidden="true"><i style="width:${Math.min(100, t ?? 0)}%"></i></span></div>
    </dl>
    <div class="frow-act">${actions(f)}</div>
  </article>`;
}
