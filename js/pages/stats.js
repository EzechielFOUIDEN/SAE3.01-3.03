/** Statistiques de candidatures du périmètre : demande, sélectivité, évolution, origine. */
import { loadAll } from '../services/data.js';
import { chartPanel, destroyCharts, mountChart, emptyChart } from '../viz/charts.js';
import * as cand from '../viz/candidatures.js';
import { int, dec, pct } from '../core/format.js';
import { YEARS, LAST_YEAR, mentionLabel } from '../config.js';
import { median, NOTE_ANNEES } from '../domain/indicators.js';
import { $, on, esc } from '../core/dom.js';
import { navigate, replaceQuery } from '../core/router.js';

const SRC = 'MESRI-SIES, Mon Master (open data), phase principale';

export default async function page({ query }) {
  const { formations, reperes } = await loadAll();
  let year = YEARS.includes(Number(query.annee)) ? Number(query.annee) : LAST_YEAR;
  let large = query.perimetre === 'large';
  let metric = query.metric === 'tx' ? 'tx' : 'cpp';

  const scope = () => formations.filter((f) => large || f.niveau === 'coeur');
  const MIN = 20; // en dessous de 20 candidats, les ratios sont trop instables pour être classés

  const view = () => {
    const fs = scope().filter((f) => f.sessions[year]);
    const S = (f) => f.sessions[year];
    const etabs = new Set(fs.map((f) => f.uai));
    const places = fs.reduce((n, f) => n + (S(f).places ?? 0), 0);
    const alt = fs.filter((f) => f.alternance).length;
    const sig = fs.filter((f) => (S(f).candidatsPP ?? 0) >= MIN);
    const nat = reperes[year];
    return { fs, S, etabs, places, alt, sig, nat };
  };

  const html = () => {
    const { fs, etabs, places, alt, sig, nat, S } = view();
    return `<div class="wrap page-head"><p class="eyebrow">Candidatures</p><h1>Demande et sélectivité</h1>
      <p class="lead">Combien de candidats pour combien de places, et quelle part reçoit une proposition ? Ces graphiques portent sur les formations du périmètre « création numérique » et les comparent à l'ensemble des Masters français.</p>
      <div class="fiche-act"><div class="seg" role="group" aria-label="Session">${YEARS.map((y) => `<button type="button" data-year="${y}" aria-pressed="${y === year}">${y}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" id="large"${large ? ' checked' : ''}> Inclure Design et Cinéma-audiovisuel</label></div></div>
    <div class="wrap"><div class="grid g4 keep2">
      <div class="kpi"><b>${int(fs.length)}</b><span>formations en ${year}, dans ${int(etabs.size)} établissements</span></div>
      <div class="kpi"><b>${int(places)}</b><span>places au total (capacité déclarée)</span></div>
      <div class="kpi"><b>${dec(median(sig.map((f) => S(f).candidatsParPlace)))}</b><span>candidats par place (médiane des formations). Tous Masters : ${dec(nat.candidatsParPlace.p50)}</span></div>
      <div class="kpi"><b>${pct(median(sig.map((f) => S(f).tauxProposition)), 0)}</b><span>taux de proposition (médiane). Tous Masters : ${pct(nat.tauxProposition.p50, 0)}</span></div></div>
      <p class="source" style="margin-top:16px">${SRC}, session ${year}. ${alt} formation${alt > 1 ? 's' : ''} en alternance. Les médianes portent sur les ${sig.length} formations ayant au moins ${MIN} candidats.</p></div>
    <div class="wrap" style="margin-top:32px">${chartPanel({ id: 's-nuage', title: 'Chaque formation selon sa demande et sa sélectivité', sub: "Un point = une formation. Plus un point est à droite, plus il y a de candidats par place ; plus il est bas, plus la formation propose à une petite part de ses candidats. La taille indique le nombre de places ; jaune : alternance. Cliquez sur un point pour ouvrir la fiche.", note: "Les formations en haut à gauche sont peu demandées et proposent à beaucoup de candidats ; celles en bas à droite sont les plus sélectives. L'échelle horizontale est logarithmique. Pour l'alternance (points jaunes), les propositions dépendent surtout du dépôt d'un contrat d'apprentissage et non d'un classement : leurs taux de proposition sont naturellement bas et ne se comparent pas à ceux des formations hors alternance.", source: SRC, period: `session ${year}`, height: 'tall' })}</div>
    <div class="wrap grid g2" style="margin-top:24px">
      <section class="panel" aria-labelledby="s-cl-t"><h3 id="s-cl-t">Classement des formations</h3><p class="sub">Formations avec au moins ${MIN} candidats. <span class="seg" role="group" aria-label="Indicateur" style="margin-left:8px"><button type="button" data-metric="cpp" aria-pressed="${metric === 'cpp'}">Demande</button><button type="button" data-metric="tx" aria-pressed="${metric === 'tx'}">Sélectivité</button></span></p>
        <div id="s-cl" class="chart tall" role="img" aria-label="Classement"></div><p class="source">${SRC} · session ${year}. Demande : candidats par place, les plus élevés. Sélectivité : taux de proposition, les plus bas.</p></section>
      ${chartPanel({ id: 's-evo', title: 'Évolution depuis 2023', sub: 'Médiane des formations présentes aux trois sessions.', note: NOTE_ANNEES, source: SRC, period: 'sessions 2023 à 2025' })}
    </div>
    <div class="wrap" style="margin-top:24px">${chartPanel({ id: 's-ori', title: "Origine des candidatures", sub: "Part des candidatures selon la formation suivie l'année précédente (somme sur les formations du périmètre).", note: "Il s'agit de candidatures, pas de personnes : un candidat qui postule à plusieurs formations est compté plusieurs fois. Les BUT ne sont distingués que depuis 2024.", source: SRC, period: 'sessions 2024 et 2025', height: 'short' })}</div>`;
  };

  const draw = () => {
    destroyCharts();
    const { fs, S, sig } = view();
    cand.nuage($('#s-nuage'), sig.map((f) => ({ x: S(f).candidatsParPlace, y: S(f).tauxProposition, nom: f.parcours, etab: f.etab, places: S(f).places, ifc: f.ifc, alt: f.alternance })).filter((p) => p.x != null && p.y != null && p.x > 0), { onSelect: (ifc) => navigate('/formation/' + ifc) });
    const rows = [...sig].filter((f) => (metric === 'cpp' ? S(f).candidatsParPlace : S(f).tauxProposition) != null)
      .sort((a, b) => (metric === 'cpp' ? S(b).candidatsParPlace - S(a).candidatsParPlace : S(a).tauxProposition - S(b).tauxProposition)).slice(0, 15)
      .map((f) => ({ court: f.parcours.length > 38 ? f.parcours.slice(0, 36) + '…' : f.parcours, nom: f.parcours, etab: f.etab, ifc: f.ifc, value: metric === 'cpp' ? S(f).candidatsParPlace : S(f).tauxProposition }));
    cand.classement($('#s-cl'), rows, { unit: metric === 'cpp' ? '' : ' %', onSelect: (ifc) => navigate('/formation/' + ifc), color: metric === 'cpp' ? '#0055cb' : '#00296b' });

    // Évolution : uniquement les formations présentes aux 3 sessions pour comparer le même ensemble
    const stable = scope().filter((f) => YEARS.every((y) => f.sessions[y] && (f.sessions[y].candidatsPP ?? 0) >= MIN));
    if (stable.length < 3) emptyChart($('#s-evo'), 'Pas assez de formations présentes aux trois sessions.');
    else mountChart($('#s-evo'), {
      grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true }, legend: { top: 0 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: YEARS.map(String) },
      yAxis: [{ type: 'value', min: 0 }, { type: 'value', min: 0, max: 100, splitLine: { show: false }, axisLabel: { formatter: '{value} %' } }],
      series: [
        { name: `Candidats par place (${stable.length} formations)`, type: 'line', data: YEARS.map((y) => Math.round(median(stable.map((f) => f.sessions[y].candidatsParPlace)) * 10) / 10), symbolSize: 9, lineStyle: { width: 3 }, label: { show: true, position: 'top' } },
        { name: 'Taux de proposition', type: 'line', yAxisIndex: 1, data: YEARS.map((y) => Math.round(median(stable.map((f) => f.sessions[y].tauxProposition)) * 10) / 10), symbolSize: 9, lineStyle: { width: 3 }, color: '#f4c430', label: { show: true, position: 'bottom', formatter: ({ value }) => value + ' %' } },
      ],
    });

    // Origine : 2024 et 2025
    const yrs = [2024, 2025];
    const cats = [['BUT 3e année', (s) => s.candidatsBUT, '#f4c430'], ['Licence générale', (s) => s.origines.lg3, '#0055cb'], ['Licence professionnelle', (s) => s.origines.lp3, '#6fa3ee'], ['Master', (s) => s.origines.master, '#00296b'], ['Autre formation', (s) => s.origines.autre, '#7a8394'], ['Non inscrit en France', (s) => s.origines.nonInscrit, '#c9ced8']];
    const tot = (y) => scope().reduce((n, f) => n + (f.sessions[y]?.candidatsPP ?? 0), 0);
    mountChart($('#s-ori'), {
      grid: { left: 8, right: 24, top: 40, bottom: 8, containLabel: true }, legend: { top: 0 },
      tooltip: { trigger: 'item', formatter: ({ seriesName, name, value }) => `${name} · ${seriesName}<br><b>${dec(value)} %</b> des candidatures` },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value} %' } }, yAxis: { type: 'category', data: yrs.map(String), inverse: true },
      series: cats.map(([name, get, color]) => ({ name, type: 'bar', stack: 'o', barWidth: 36, itemStyle: { color }, label: { show: true, formatter: ({ value }) => (value >= 6 ? Math.round(value) + ' %' : ''), color: color === '#00296b' || color === '#0055cb' || color === '#7a8394' ? '#fff' : '#15181f', fontSize: 11 }, data: yrs.map((y) => Math.round((scope().reduce((n, f) => n + (get(f.sessions[y] ?? { origines: {} }) ?? 0), 0) / tot(y)) * 1000) / 10) })),
    });
  };

  return {
    title: 'Statistiques de candidatures', html: html(),
    mount(root) {
      const rerender = () => { replaceQuery({ annee: year === LAST_YEAR ? '' : year, perimetre: large ? 'large' : '', metric: metric === 'cpp' ? '' : metric }); root.innerHTML = html(); draw(); };
      draw();
      on(root, 'click', '[data-year]', (e, b) => { year = Number(b.dataset.year); rerender(); });
      on(root, 'click', '[data-metric]', (e, b) => { metric = b.dataset.metric; rerender(); });
      on(root, 'change', '#large', (e, c) => { large = c.checked; rerender(); });
    },
    destroy: destroyCharts,
  };
}
