/** Visualisations de l'insertion professionnelle (discipline × établissement, promotions jusqu'en 2020). */
import { mountChart, emptyChart } from './charts.js';
import { int, dec, ND } from '../core/format.js';
import { INS_INDICATORS } from '../config.js';

const fmtVal = (key, v) => (v == null ? ND : key === 'salaireNet' ? `${int(v)} €` : `${dec(v)} %`);

/** Médiane des établissements par année, avec bande interquartile et nombre d'établissements. */
export function serieBande(el, serie, key, { extra } = {}) {
  if (!serie.length) return emptyChart(el, 'Aucune valeur significative pour cet indicateur : les valeurs « ns » (non significatif) ne sont pas affichées.');
  const unit = INS_INDICATORS[key].unit === '€' ? ' €' : ' %';
  const annees = serie.map((s) => String(s.annee));
  const series = [
    { name: 'p25', type: 'line', data: serie.map((s) => s.p25), stack: 'b', lineStyle: { opacity: 0 }, symbol: 'none', silent: true, tooltip: { show: false } },
    { name: 'Écart entre quartiles', type: 'line', data: serie.map((s) => (s.p75 - s.p25)), stack: 'b', lineStyle: { opacity: 0 }, color: '#b9d1f5', areaStyle: { color: '#dbe8fb' }, symbol: 'none', silent: true },
    { name: 'Médiane des établissements', type: 'line', data: serie.map((s) => s.p50), symbolSize: 9, lineStyle: { width: 3 }, color: '#0055cb', label: { show: true, position: 'top', formatter: ({ value }) => (key === 'salaireNet' ? int(value) : dec(value, 0)), fontSize: 11 }, z: 5 },
  ];
  if (extra) series.push({ name: extra.name, type: 'line', data: annees.map((a) => extra.data[a] ?? null), symbolSize: 11, symbol: 'diamond', lineStyle: { width: 3, type: 'dashed' }, color: '#f4c430', itemStyle: { borderColor: '#15181f', borderWidth: 1.5 }, connectNulls: false, z: 6 });
  mountChart(el, {
    grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
    legend: { top: 0, data: ['Médiane des établissements', 'Écart entre quartiles', ...(extra ? [extra.name] : [])] },
    tooltip: { trigger: 'axis', formatter: (ps) => { const i = ps[0].dataIndex, s = serie[i]; const l = [`<b>Promotion ${s.annee}</b>`, `Médiane : ${fmtVal(key, s.p50)}`, `Quartiles : ${fmtVal(key, s.p25)} à ${fmtVal(key, s.p75)}`, `${s.n} établissement${s.n > 1 ? 's' : ''} avec valeur`]; const e = ps.find((p) => p.seriesName === extra?.name && p.value != null); if (e) l.push(`${extra.name} : ${fmtVal(key, e.value)}`); return l.join('<br>'); } },
    xAxis: { type: 'category', data: annees, name: 'Promotion (année de diplôme)', nameLocation: 'middle', nameGap: 30 },
    yAxis: { type: 'value', scale: true, axisLabel: { formatter: (v) => v + unit } },
    series,
  });
}

/** Combien d'établissements ont une valeur significative, par année : rend visibles les « ns ». */
export function disponibilite(el, dispo) {
  if (!dispo.length) return emptyChart(el, 'Aucune ligne pour ces critères.');
  mountChart(el, {
    grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
    legend: { top: 0 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: dispo.map((d) => String(d.annee)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: 'Valeur significative', type: 'bar', stack: 's', data: dispo.map((d) => d.renseignes), itemStyle: { color: '#0055cb' } },
      { name: 'Non significatif ou absent', type: 'bar', stack: 's', data: dispo.map((d) => d.total - d.renseignes), itemStyle: { color: '#c9ced8' } },
    ],
  });
}

/** Classement des établissements pour une promotion donnée. */
export function classementEtab(el, rows, key) {
  if (!rows.length) return emptyChart(el, 'Aucun établissement avec une valeur significative pour cette promotion.');
  mountChart(el, {
    grid: { left: 8, right: 64, top: 4, bottom: 4, containLabel: true },
    tooltip: { trigger: 'item', formatter: ({ data }) => `<b>${data.name}</b><br>${fmtVal(key, data.value)}<br>${data.reponses != null ? `${int(data.reponses)} réponses` : 'nombre de réponses non fourni'}` },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: rows.map((r) => r.etab), axisLabel: { width: 190, overflow: 'truncate' } },
    series: [{ type: 'bar', barWidth: 14, data: rows.map((r) => ({ value: r.v, name: r.etab, reponses: r.reponses, itemStyle: { color: r.inScope ? '#0055cb' : '#9aa3b2' } })), label: { show: true, position: 'right', formatter: ({ value }) => (key === 'salaireNet' ? int(value) + ' €' : dec(value, 0) + ' %'), fontWeight: 700, fontSize: 12 } }],
  });
}
