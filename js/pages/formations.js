/** Exploration : liste filtrable des formations du périmètre. */
import { loadAll } from '../services/data.js';
import { applyFilters, DEFAULTS } from '../domain/filters.js';
import { filterBar, readFilters } from '../components/filterBar.js';
import { row } from '../components/formationRow.js';
import { replaceQuery, href } from '../core/router.js';
import { $, on, debounce, esc } from '../core/dom.js';
import { int } from '../core/format.js';

const PAGE = 20;

export default async function page({ query }) {
  const { formations } = await loadAll();
  let q = { ...DEFAULTS, ...query }; let shown = PAGE;

  const results = () => {
    const list = applyFilters(formations, q);
    const y = Number(q.annee);
    const places = list.reduce((n, f) => n + (f.sessions[y]?.places ?? 0), 0);
    const carteQs = new URLSearchParams(Object.entries(q).filter(([k, v]) => v && v !== DEFAULTS[k])).toString();
    const body = list.length ? `<div class="flist">${list.slice(0, shown).map((f) => row(f, y)).join('')}</div>${list.length > shown ? `<p style="text-align:center;margin-top:24px"><button class="btn" id="more">Afficher ${Math.min(PAGE, list.length - shown)} formations de plus (${int(list.length - shown)} restantes)</button></p>` : ''}`
      : `<div class="state"><h2>Aucune formation ne correspond</h2><p>Élargissez la recherche ou retirez un filtre.</p><button class="btn" id="f-reset2">Réinitialiser les filtres</button></div>`;
    return `<div class="resbar"><p role="status" aria-live="polite"><b class="num">${int(list.length)}</b> formation${list.length > 1 ? 's' : ''} · <span class="num">${int(places)}</span> places · session ${y}</p>
      <a class="btn small" href="#/carte${carteQs ? '?' + carteQs : ''}">Voir sur la carte</a></div>${body}`;
  };

  return {
    title: 'Explorer les formations',
    html: `<div class="wrap page-head"><p class="eyebrow">Explorer</p><h1>Les Masters en création numérique</h1>
      <p class="lead">Filtrez par lieu, mention ou mode de formation. Pour chaque formation, les chiffres de candidature viennent de Mon Master (ministère de l'Enseignement supérieur) ; ouvrez une fiche pour comprendre ce qu'ils disent et ce qu'ils ne disent pas.</p></div>
    <div class="wrap">${filterBar(formations, q)}
      <div class="note blue" style="margin-top:16px"><p><b>Lire le taux de proposition.</b> C'est la part des candidats de la phase principale qui ont reçu une proposition d'admission. Ce n'est pas votre probabilité d'être admis, et ce n'est pas un « taux d'accès » officiel. <a href="#/methode">Voir les définitions</a>.</p></div>
      <div id="results" aria-live="polite">${results()}</div></div>`,
    mount(root) {
      const form = $('#filters', root); const out = $('#results', root);
      const refresh = () => { out.innerHTML = results(); };
      const sync = () => { q = readFilters(form, q); shown = PAGE; replaceQuery(Object.fromEntries(Object.entries(q).filter(([k, v]) => v !== DEFAULTS[k]))); refresh(); };
      form.addEventListener('input', debounce(sync, 180)); form.addEventListener('change', sync);
      form.addEventListener('submit', (e) => e.preventDefault());
      const reset = () => { location.hash = '#/formations'; };
      $('#f-reset', root).addEventListener('click', reset);
      on(root, 'click', '#f-reset2', reset);
      on(root, 'click', '#more', () => { shown += PAGE; refresh(); });
    },
  };
}
