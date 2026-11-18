/** Carte interactive : bulles par ville, filtres partagés avec l'exploration, panneau de détail. */
import { loadAll } from '../services/data.js';
import { applyFilters, DEFAULTS } from '../domain/filters.js';
import { filterBar, readFilters } from '../components/filterBar.js';
import { row } from '../components/formationRow.js';
import { carte, parVille } from '../viz/map.js';
import { destroyCharts, emptyChart } from '../viz/charts.js';
import { replaceQuery, href } from '../core/router.js';
import { $, on, debounce, esc } from '../core/dom.js';
import { int } from '../core/format.js';

export default async function page({ query }) {
  const { formations } = await loadAll();
  let q = { ...DEFAULTS, ...query }; let ville = query.ville ?? '';
  let chart = null;

  const panel = (list) => {
    const y = Number(q.annee); const { villes, sansPosition, outremer } = parVille(list);
    const v = villes.find((x) => x.ville === ville);
    const hors = [...outremer, ...sansPosition];
    if (v) return `<button class="btn ghost small" id="back" style="margin-bottom:8px">← Toutes les villes</button><p class="eyebrow">${v.formations.length} formation${v.formations.length > 1 ? 's' : ''}</p><h2>${esc(v.ville)}</h2><div class="flist compact">${v.formations.map((f) => row(f, y)).join('')}</div>`;
    return `<h2>${int(list.length)} formation${list.length > 1 ? 's' : ''}</h2>
      <p class="muted">${int(villes.length)} ville${villes.length > 1 ? 's' : ''} sur la carte. Cliquez sur une bulle pour voir les formations, ou choisissez une ville ci-dessous.</p>
      <ul class="citylist">${villes.sort((a, b) => b.formations.length - a.formations.length || a.ville.localeCompare(b.ville, 'fr')).map((x) => `<li><button class="mini" data-ville="${esc(x.ville)}"><b>${esc(x.ville)}</b><span class="num">${x.formations.length}</span></button></li>`).join('')}</ul>
      ${hors.length ? `<div class="note" style="margin-top:16px"><p><b>${hors.length} formation${hors.length > 1 ? 's' : ''} hors carte</b> (outre-mer ou position inconnue) : ${hors.slice(0, 6).map((f) => `<a href="${href('/formation/' + f.ifc)}">${esc(f.parcours)}</a> (${esc(f.etab)})`).join(', ')}${hors.length > 6 ? '…' : ''}</p></div>` : ''}`;
  };

  const draw = async (root) => {
    const list = applyFilters(formations, q);
    const el = $('#map', root);
    destroyCharts();
    if (!list.length) emptyChart(el, 'Aucune formation avec ces critères.');
    else chart = await carte(el, list, { selectedVille: ville, onSelectVille: (v) => { ville = v; draw(root); } });
    $('#panel', root).innerHTML = panel(list);
    $('#count', root).textContent = `${int(list.length)} formation${list.length > 1 ? 's' : ''}`;
  };

  return {
    title: 'Carte des formations',
    html: `<div class="wrap page-head"><p class="eyebrow">Explorer</p><h1>Carte des Masters</h1>
      <p class="lead">Une bulle par ville, dimensionnée selon le nombre de formations. Les régions sont teintées selon le nombre de formations qu'elles accueillent. Zoomez à la molette ou au pincement.</p></div>
    <div class="wrap">${filterBar(formations, q, { withSort: false })}
      <p class="muted" style="margin:16px 0 8px" role="status"><b id="count"></b> sur la carte · <a href="#/formations">voir la liste</a></p>
      <div class="map-layout"><div class="panel map-box"><div id="map" class="chart tall" role="img" aria-label="Carte de France des formations par ville"></div>
        <p class="source">MESRI-SIES, Mon Master 2023-2025 ; coordonnées : API Masters-stats · fond de carte : régions françaises</p></div>
        <aside id="panel" class="panel map-panel" aria-live="polite"></aside></div></div>`,
    mount(root) {
      draw(root);
      const form = $('#filters', root);
      const sync = () => { q = readFilters(form, q); ville = ''; replaceQuery(Object.fromEntries(Object.entries(q).filter(([k, v]) => v !== DEFAULTS[k]))); draw(root); };
      form.addEventListener('input', debounce(sync, 180)); form.addEventListener('change', sync); form.addEventListener('submit', (e) => e.preventDefault());
      $('#f-reset', root).addEventListener('click', () => { location.hash = '#/carte'; });
      on(root, 'click', '[data-ville]', (e, b) => { ville = b.dataset.ville; draw(root); });
      on(root, 'click', '#back', () => { ville = ''; draw(root); });
    },
    destroy: destroyCharts,
  };
}
