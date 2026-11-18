/** Carte de France interactive (ECharts geo) : bulles par ville, régions teintées selon le nombre de formations. */
import { mountChart } from './charts.js';
import { loadRegions } from '../services/data.js';
import { int } from '../core/format.js';

let registered = false;
async function ensureMap() {
  if (registered) return;
  // Les territoires d'outre-mer sont replacés dans un encart à gauche de la métropole (méthode de la démo du cours).
  const X = -7.834939110760255;
  echarts.registerMap('France', await loadRegions(), {
    Guyane: { left: X, top: 48.1885808164957, width: 1 }, Guadeloupe: { left: X, top: 46, width: 2 },
    Martinique: { left: X, top: 44, width: 1 }, Mayotte: { left: X, top: 42, width: 1 }, 'La Réunion': { left: X, top: 40, width: 1 },
  });
  registered = true;
}

/** Regroupe les formations par ville (position moyenne). Les formations sans coordonnées sont retournées à part. */
export function parVille(formations) {
  const villes = new Map(); const sansPosition = []; const outremer = [];
  for (const f of formations) {
    if (f.lat == null || f.lon == null) { sansPosition.push(f); continue; }
    // L'outre-mer n'est pas représentable à ses coordonnées réelles sur cette carte : listé à part.
    if (f.lon < -25 || f.lat < 30) { outremer.push(f); continue; }
    const k = f.ville ?? '?';
    if (!villes.has(k)) villes.set(k, { ville: k, lat: 0, lon: 0, formations: [] });
    const v = villes.get(k); v.formations.push(f); v.lat += f.lat; v.lon += f.lon;
  }
  const list = [...villes.values()].map((v) => ({ ...v, lat: v.lat / v.formations.length, lon: v.lon / v.formations.length }));
  return { villes: list, sansPosition, outremer };
}

export async function carte(el, formations, { selectedVille, onSelectVille } = {}) {
  await ensureMap();
  const { villes } = parVille(formations);
  const parRegion = {};
  for (const f of formations) parRegion[f.region] = (parRegion[f.region] ?? 0) + 1;
  const max = Math.max(1, ...Object.values(parRegion));
  const teinte = (n) => (n ? ['#eaf1fc', '#c3d7f7', '#8fb4ef', '#4f88e0'][Math.min(3, Math.ceil((n / max) * 4) - 1)] : '#eceff3');
  const regions = Object.keys(parRegion).map((name) => ({ name, itemStyle: { areaColor: teinte(parRegion[name]) } }));
  return mountChart(el, {
    tooltip: { trigger: 'item', formatter: (p) => (p.seriesType === 'scatter' ? `<b>${p.data.name}</b><br>${p.data.value[2]} formation${p.data.value[2] > 1 ? 's' : ''}` : `<b>${p.name}</b><br>${int(parRegion[p.name] ?? 0)} formation${(parRegion[p.name] ?? 0) > 1 ? 's' : ''}`) },
    geo: { map: 'France', roam: true, nameProperty: 'nom', scaleLimit: { min: 1, max: 12 }, itemStyle: { areaColor: '#eceff3', borderColor: '#ffffff', borderWidth: 1 }, emphasis: { itemStyle: { areaColor: '#c3d7f7' }, label: { show: false } }, select: { disabled: true }, regions, left: 8, right: 8, top: 8, bottom: 8 },
    series: [{
      type: 'scatter', coordinateSystem: 'geo', zlevel: 2,
      data: villes.map((v) => ({ name: v.ville, value: [v.lon, v.lat, v.formations.length], itemStyle: { color: v.ville === selectedVille ? '#f4c430' : '#0055cb', borderColor: '#fff', borderWidth: 2 }, label: { color: v.ville === selectedVille ? '#15181f' : '#fff' } })),
      symbolSize: (val) => 14 + Math.sqrt(val[2]) * 9,
      label: { show: true, formatter: ({ value }) => value[2], color: '#fff', fontWeight: 700, fontSize: 12 },
      emphasis: { scale: 1.15, itemStyle: { borderColor: '#15181f' } },
    }],
  }, { onClick: (p) => p.seriesType === 'scatter' && onSelectVille?.(p.data.name) });
}
