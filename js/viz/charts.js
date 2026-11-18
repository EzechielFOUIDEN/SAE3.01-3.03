/** Socle des graphiques : thème ECharts Master Lab, montage/démontage, version tableau accessible. */
import { esc } from '../core/dom.js';

const FONT = "'Open Sans', system-ui, sans-serif";
export const COLORS = ['#0055cb', '#f4c430', '#7a8394', '#6fa3ee', '#00296b', '#c99a00'];

echarts.registerTheme('masterlab', {
  color: COLORS,
  textStyle: { fontFamily: FONT, color: '#15181f' },
  title: { textStyle: { fontFamily: "'League Spartan', sans-serif" } },
  categoryAxis: { axisLine: { lineStyle: { color: '#15181f' } }, axisTick: { show: false }, axisLabel: { color: '#3b3f48', fontSize: 12 }, splitLine: { show: false } },
  valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#3b3f48', fontSize: 12 }, splitLine: { lineStyle: { color: '#e6e8ec' } }, nameTextStyle: { color: '#3b3f48' } },
  tooltip: { backgroundColor: '#15181f', borderWidth: 0, padding: [10, 14], textStyle: { color: '#fff', fontFamily: FONT, fontSize: 13 }, extraCssText: 'border-radius:4px;box-shadow:0 8px 24px -8px rgba(0,0,0,.4);' },
  legend: { textStyle: { color: '#15181f', fontFamily: FONT }, icon: 'roundRect', itemWidth: 14, itemHeight: 8 },
});

const live = new Set();

/**
 * Crée un graphique dans `el`. `build` retourne l'option ECharts.
 * Le graphique se redimensionne avec son conteneur et est détruit avec `destroyCharts()`.
 */
export function mountChart(el, option, { onClick } = {}) {
  if (!el) return null;
  const chart = echarts.init(el, 'masterlab', { renderer: 'canvas' });
  chart.setOption({ aria: { enabled: true }, animationDuration: 500, animationEasing: 'cubicOut', ...option });
  if (onClick) chart.on('click', onClick);
  const ro = new ResizeObserver(() => requestAnimationFrame(() => !chart.isDisposed() && chart.resize()));
  ro.observe(el);
  const handle = { chart, destroy() { ro.disconnect(); chart.dispose(); live.delete(handle); } };
  live.add(handle);
  return chart;
}
export const destroyCharts = () => [...live].forEach((h) => h.destroy());

/** Bloc standard : titre explicite, explication, graphique, période, source, tableau de données équivalent. */
export function chartPanel({ id, title, sub, note, source, period, height = '', table }) {
  return `<section class="panel" aria-labelledby="${id}-t">
    <h3 id="${id}-t">${esc(title)}</h3>
    ${sub ? `<p class="sub">${sub}</p>` : ''}
    ${note ? `<div class="note blue"><p>${note}</p></div>` : ''}
    <div class="chart-wrap"><div id="${id}" class="chart ${height}" role="img" aria-label="${esc(title)}"></div></div>
    <p class="source">${source}${period ? ` · ${esc(period)}` : ''}</p>
    ${table ? tableHtml(table) : ''}
  </section>`;
}

/** Tableau de données (alternative textuelle au graphique). */
export function tableHtml({ head, rows }) {
  return `<details class="alt-table"><summary>Voir les données du graphique</summary><div class="tbl-scroll"><table class="data-table"><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}

export const emptyChart = (el, msg) => { if (el) el.innerHTML = `<div class="chart-fallback">${esc(msg)}</div>`; };
