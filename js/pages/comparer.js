/** Comparateur : jusqu'à 3 formations côte à côte (admission, évolution, insertion de la discipline). */
import { loadAll } from '../services/data.js';
import { comparaison, setComparaison, MAX_COMPARE } from '../core/store.js';
import { esc, $, on } from '../core/dom.js';
import { int, dec, pct, eur, ND } from '../core/format.js';
import { mentionLabel, YEARS, LAST_YEAR, INS_DISC } from '../config.js';
import { dernierePoint } from '../domain/insertion.js';
import { chartPanel, destroyCharts, mountChart } from '../viz/charts.js';
import { NOTE_ANNEES } from '../domain/indicators.js';
import { href } from '../core/router.js';

export default async function page({ query }) {
  const { formations, insertion, byIfc } = await loadAll();
  if (query.f) setComparaison(query.f.split(',').filter((i) => byIfc.has(i)));
  const year = LAST_YEAR;

  const html = () => {
    const sel = comparaison().map((i) => byIfc.get(i)).filter(Boolean);
    const options = formations.filter((f) => f.niveau === 'coeur' && !sel.includes(f)).sort((a, b) => a.etab.localeCompare(b.etab, 'fr') || a.parcours.localeCompare(b.parcours, 'fr'));
    const head = `<div class="wrap page-head"><p class="eyebrow">Comparer</p><h1>Comparateur de formations</h1><p class="lead">Placez jusqu'à ${MAX_COMPARE} formations côte à côte. Ajoutez-les depuis la liste, la carte ou une fiche, ou choisissez-les ici.</p>
      ${sel.length < MAX_COMPARE ? `<div class="field" style="max-width:640px"><label for="c-add">Ajouter une formation</label><select class="select" id="c-add"><option value="">Choisir…</option>${options.map((f) => `<option value="${esc(f.ifc)}">${esc(f.etab)} — ${esc(f.parcours)}</option>`).join('')}</select></div>` : ''}</div>`;
    if (!sel.length) return `${head}<div class="wrap"><div class="state"><h2>Aucune formation à comparer</h2><p>Utilisez le bouton « Comparer » d'une formation ou le menu ci-dessus.</p><a class="btn primary" href="#/formations">Explorer les formations</a></div></div>`;
    const cols = sel.map((f) => { const s = f.sessions[year]; return { f, s }; });
    const line = (label, fn) => `<tr><th scope="row">${label}</th>${cols.map((c) => `<td>${fn(c.f, c.s)}</td>`).join('')}</tr>`;
    const insCell = (f, mois, key) => { if (!f.insDisc) return ND; const p = dernierePoint(insertion, f.uai, f.insDisc, mois, key); return p ? `${key === 'salaireNet' ? eur(p.salaireNet) : pct(p[key], 0)} <span class="muted">(${p.annee})</span>` : ND; };
    return `${head}<div class="wrap"><section class="panel"><h2 style="font-size:var(--t-l)">Admission en ${year}</h2><div class="tbl-scroll"><table class="data-table cmp"><thead><tr><th scope="col"></th>${cols.map(({ f }) => `<th scope="col"><a href="${href('/formation/' + f.ifc)}">${esc(f.parcours)}</a><br><span class="muted" style="font-weight:400;text-transform:none;letter-spacing:0">${esc(f.etab)}</span><br><button class="btn ghost small" data-rm="${esc(f.ifc)}">Retirer</button></th>`).join('')}</tr></thead><tbody>
      ${line('Mention', (f) => esc(mentionLabel(f.mention)))}${line('Ville', (f) => esc(f.ville ?? ND))}${line('Alternance', (f) => (f.alternance ? 'Oui' : 'Non'))}
      ${line('Places', (f, s) => int(s?.places))}${line('Candidats', (f, s) => int(s?.candidatsPP))}${line('Candidats par place', (f, s) => dec(s?.candidatsParPlace))}${line('Taux de proposition', (f, s) => pct(s?.tauxProposition, 0))}${line("Taux d'acceptation", (f, s) => pct(s?.tauxAcceptation, 0))}
      </tbody></table></div><p class="source">MESRI-SIES, Mon Master, phase principale, session ${year}. ${cols.some((c) => !c.s) ? 'Une formation absente de la session ' + year + ' affiche « n.d. ».' : ''}</p></section>
      <div class="grid g2" style="margin-top:24px">${chartPanel({ id: 'k-tx', title: 'Taux de proposition par session', sub: 'Phase principale.', note: NOTE_ANNEES, source: 'MESRI-SIES, Mon Master', period: 'sessions 2023 à 2025' })}${chartPanel({ id: 'k-cpp', title: 'Candidats par place par session', sub: 'Phase principale.', source: 'MESRI-SIES, Mon Master', period: 'sessions 2023 à 2025' })}</div>
      <section class="panel" style="margin-top:24px"><h2 style="font-size:var(--t-l)">Insertion de la discipline dans l'établissement</h2><div class="note warn"><p>Données de la discipline dans l'établissement (pas de la formation), promotions jusqu'en 2020.</p></div><div class="tbl-scroll"><table class="data-table cmp"><thead><tr><th scope="col"></th>${cols.map(({ f }) => `<th scope="col">${esc(f.parcours.length > 40 ? f.parcours.slice(0, 38) + '…' : f.parcours)}</th>`).join('')}</tr></thead><tbody>
      ${line('Discipline', (f) => esc(INS_DISC[f.insDisc] ?? ND))}${line("Insertion à 30 mois", (f) => insCell(f, 30, 'insertion'))}${line('Emplois stables à 30 mois', (f) => insCell(f, 30, 'stables'))}${line('Salaire net médian à 30 mois', (f) => insCell(f, 30, 'salaireNet'))}</tbody></table></div><p class="source">MESRI-SIES, insertion professionnelle 2010-2020 ; entre parenthèses, la promotion de la dernière valeur significative.</p></section></div>`;
  };

  const draw = (root) => {
    destroyCharts();
    const sel = comparaison().map((i) => byIfc.get(i)).filter(Boolean);
    if (!sel.length) return;
    const mk = (id, key, unit) => mountChart($(id, root), {
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true }, legend: { top: 0, type: 'scroll' }, tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? ND : dec(v) + unit) },
      xAxis: { type: 'category', data: YEARS.map(String) }, yAxis: { type: 'value', min: 0, axisLabel: { formatter: (v) => v + unit } },
      series: sel.map((f) => ({ name: f.parcours.length > 34 ? f.parcours.slice(0, 32) + '…' : f.parcours, type: 'line', symbolSize: 9, lineStyle: { width: 3 }, data: YEARS.map((y) => f.sessions[y]?.[key] ?? null) })),
    });
    mk('#k-tx', 'tauxProposition', ' %'); mk('#k-cpp', 'candidatsParPlace', '');
  };

  return {
    title: 'Comparateur', html: html(),
    mount(root) {
      const again = () => { root.innerHTML = html(); draw(root); };
      draw(root);
      on(root, 'change', '#c-add', (e, s) => { if (s.value) { setComparaison([...comparaison(), s.value]); again(); } });
      on(root, 'click', '[data-rm]', (e, b) => { setComparaison(comparaison().filter((i) => i !== b.dataset.rm)); again(); });
    },
    destroy: destroyCharts,
  };
}
