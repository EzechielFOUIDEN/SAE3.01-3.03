/** Visualisations des candidatures (une fiche formation et la page Statistiques). */
import { mountChart, emptyChart } from './charts.js';
import { int, dec, pct, ND } from '../core/format.js';
import { YEARS } from '../config.js';
import { IND } from '../domain/indicators.js';

const tipNum = (v) => (v == null ? ND : int(v));

/** Évolution 2023-2025 : candidats, propositions, acceptations (phase principale). */
export function evolution(el, f) {
  const ys = YEARS.filter((y) => f.sessions[y]);
  if (ys.length < 2) return emptyChart(el, ys.length ? 'Cette formation n’apparaît que sur une session : pas d’évolution à tracer.' : 'Aucune donnée de candidature.');
  const serie = (key, name, color, type = 'line') => ({ name, type, data: YEARS.map((y) => f.sessions[y]?.[key] ?? null), color, connectNulls: false, symbolSize: 9, lineStyle: { width: 3 }, label: { show: true, position: 'top', formatter: ({ value }) => (value == null ? '' : int(value)), fontSize: 11 } });
  mountChart(el, {
    grid: { left: 8, right: 16, top: 76, bottom: 8, containLabel: true },
    legend: { top: 0 },
    tooltip: { trigger: 'axis', valueFormatter: tipNum },
    xAxis: { type: 'category', data: YEARS.map(String), boundaryGap: true },
    yAxis: { type: 'value', minInterval: 1 },
    series: [serie('candidatsPP', 'Candidats (phase principale)', '#0055cb'), serie('propositionsPP', 'Propositions', '#f4c430'), serie('acceptesPP', 'Acceptations', '#7a8394')],
  });
}

/** Entonnoir de l'admission pour une année : de la candidature à l'acceptation. */
export function entonnoir(el, s) {
  const steps = [['Candidats (phase principale)', s.candidatsPP], ['Candidats classés (PP + PC)', s.classes], ['Propositions (phase principale)', s.propositionsPP], ['Acceptations (phase principale)', s.acceptesPP]];
  mountChart(el, {
    grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', formatter: ({ name, value }) => `${name}<br><b>${tipNum(value)}</b>` },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: steps.map((x) => x[0]), axisLabel: { width: 150, overflow: 'break' } },
    series: [{ type: 'bar', barWidth: 26, data: steps.map(([, v], i) => ({ value: v, itemStyle: { color: ['#00296b', '#6fa3ee', '#0055cb', '#f4c430'][i] } })), label: { show: true, position: 'right', formatter: ({ value }) => tipNum(value), fontWeight: 700 } }],
  });
}

/** Origine des candidats (formation d'origine l'année précédente). Le BUT n'est distinct qu'à partir de 2024. */
export function origines(el, s, year) {
  const o = s.origines ?? {};
  const rows = [['Licence générale (L3)', o.lg3], ['Licence professionnelle', o.lp3]];
  if (year >= 2024) rows.push(['BUT 3e année', s.candidatsBUT]);
  rows.push(['Master', o.master], ['Autre formation', o.autre], ['Non inscrit dans le supérieur en France', o.nonInscrit]);
  const ok = rows.filter(([, v]) => v != null);
  if (!ok.length || ok.every(([, v]) => !v)) return emptyChart(el, 'Origine des candidats non disponible pour cette formation.');
  mountChart(el, {
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', formatter: ({ name, value }) => `${name}<br><b>${tipNum(value)}</b> candidats` },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: ok.map((r) => r[0]), axisLabel: { width: 170, overflow: 'break' } },
    series: [{ type: 'bar', barWidth: 20, data: ok.map(([n, v]) => ({ value: v, itemStyle: { color: n.startsWith('BUT') ? '#f4c430' : '#0055cb' } })), label: { show: true, position: 'right', formatter: ({ value }) => tipNum(value) } }],
  });
  return ok;
}

/** Position d'une formation par rapport à la distribution nationale (p10-p90, p25-p75, médiane). */
export function position(el, valeur, dist, { name, unit = '', max } = {}) {
  if (valeur == null || !dist?.p50) return emptyChart(el, 'Position non calculable (donnée manquante).');
  const top = max ?? Math.max(dist.p90 * 1.15, valeur * 1.1);
  mountChart(el, {
    grid: { left: 8, right: 24, top: 24, bottom: 32, containLabel: true },
    tooltip: { trigger: 'item', formatter: ({ seriesName, value }) => seriesName === 'Cette formation' ? `<b>Cette formation</b><br>${dec(valeur)}${unit}` : '' },
    xAxis: { type: 'value', min: 0, max: Math.ceil(top), axisLabel: { formatter: (v) => v + unit } },
    yAxis: { type: 'category', data: [name], show: false },
    series: [
      { name: 'p10', type: 'bar', stack: 'r', silent: true, itemStyle: { color: 'transparent' }, data: [dist.p10] },
      { name: '10-25', type: 'bar', stack: 'r', silent: true, itemStyle: { color: '#dbe8fb' }, data: [dist.p25 - dist.p10], barWidth: 30 },
      { name: '25-75', type: 'bar', stack: 'r', silent: true, itemStyle: { color: '#6fa3ee' }, data: [dist.p75 - dist.p25] },
      { name: '75-90', type: 'bar', stack: 'r', silent: true, itemStyle: { color: '#dbe8fb' }, data: [dist.p90 - dist.p75],
        markLine: { silent: true, symbol: 'none', lineStyle: { color: '#15181f', type: 'dashed' }, label: { formatter: () => 'médiane ' + dec(dist.p50) + unit, position: 'end', fontSize: 11 }, data: [{ xAxis: dist.p50 }] } },
      { name: 'Cette formation', type: 'scatter', symbol: 'diamond', symbolSize: 26, itemStyle: { color: '#f4c430', borderColor: '#15181f', borderWidth: 2 }, z: 10, data: [[valeur, 0]], label: { show: true, position: 'right', distance: 14, formatter: () => dec(valeur) + unit, fontWeight: 700 } },
    ],
  });
}

/** Nuage : demande (candidats par place) x sélectivité (taux de proposition), taille = places. */
export function nuage(el, points, { onSelect } = {}) {
  if (!points.length) return emptyChart(el, 'Aucune formation avec ces critères.');
  mountChart(el, {
    grid: { left: 8, right: 24, top: 24, bottom: 40, containLabel: true },
    tooltip: { trigger: 'item', formatter: ({ data }) => `<b>${data.nom}</b><br>${data.etab}<br>${dec(data.value[0])} candidats par place<br>${pct(data.value[1])} de propositions<br>${int(data.places)} places` },
    xAxis: { type: 'log', name: 'Candidats par place (échelle logarithmique)', nameLocation: 'middle', nameGap: 28, min: 0.5, axisLabel: { formatter: (v) => v } },
    yAxis: { type: 'value', name: 'Taux de proposition (%)', max: 100, min: 0 },
    series: [{ type: 'scatter', data: points.map((p) => ({ value: [p.x, p.y], nom: p.nom, etab: p.etab, places: p.places, ifc: p.ifc, itemStyle: { color: p.alt ? '#f4c430' : '#0055cb', opacity: .8, borderColor: '#fff', borderWidth: 1 } })), symbolSize: (v, { data }) => 8 + Math.sqrt(data.places ?? 1) * 2.6, emphasis: { focus: 'self', itemStyle: { borderColor: '#15181f', borderWidth: 2 } } }],
  }, { onClick: ({ data }) => onSelect?.(data.ifc) });
}

/** Classement horizontal (top N). */
export function classement(el, rows, { unit = '', onSelect, color = '#0055cb' } = {}) {
  if (!rows.length) return emptyChart(el, 'Aucune donnée à classer.');
  mountChart(el, {
    grid: { left: 8, right: 56, top: 4, bottom: 4, containLabel: true },
    tooltip: { trigger: 'item', formatter: ({ data }) => `<b>${data.nom}</b><br>${data.etab ?? ''}<br>${dec(data.value)}${unit}` },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: rows.map((r) => r.court), axisLabel: { width: 200, overflow: 'truncate', fontSize: 12 } },
    series: [{ type: 'bar', barWidth: 16, data: rows.map((r) => ({ value: r.value, nom: r.nom, etab: r.etab, ifc: r.ifc, itemStyle: { color } })), label: { show: true, position: 'right', formatter: ({ value }) => dec(value) + unit, fontWeight: 700, fontSize: 12 } }],
  }, { onClick: ({ data }) => onSelect?.(data.ifc) });
}
