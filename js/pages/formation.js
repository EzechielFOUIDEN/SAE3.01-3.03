/** Fiche formation : indicateurs d'admission, évolution, origine des candidats, position nationale, insertion. */
import { loadAll } from '../services/data.js';
import { esc, $, on } from '../core/dom.js';
import { int, dec, pct, eur, ND } from '../core/format.js';
import { mentionLabel, INS_DISC, INS_INDICATORS, YEARS, LAST_YEAR } from '../config.js';
import { IND, NOTE_ANNEES, situer, years } from '../domain/indicators.js';
import { lignes, serieDiscipline, dernierePoint } from '../domain/insertion.js';
import { chartPanel, destroyCharts, tableHtml } from '../viz/charts.js';
import * as cand from '../viz/candidatures.js';
import * as insViz from '../viz/insertion.js';
import { actions, row } from '../components/formationRow.js';
import { href } from '../core/router.js';

const info = (key) => `<details class="info"><summary aria-label="Définition : ${esc(IND[key].label)}">i</summary><div><b>${esc(IND[key].label)}.</b> ${esc(IND[key].def)}</div></details>`;
const SRC_CAND = 'MESRI-SIES, Mon Master (open data), phase principale';
const SRC_INS = 'MESRI-SIES, insertion professionnelle des diplômés de master 2010-2020';

const lecture = { bas: 'inférieure à la majorité des Masters français', moyen: 'dans la moyenne des Masters français', haut: 'supérieure à la majorité des Masters français' };

export default async function page({ params }) {
  const { formations, insertion, reperes, byIfc } = await loadAll();
  const f = byIfc.get(params.ifc);
  if (!f) return { title: 'Formation introuvable', html: `<div class="wrap" style="padding-top:48px"><div class="state"><h1>Formation introuvable</h1><p>L'identifiant « ${esc(params.ifc)} » ne correspond à aucune formation du périmètre.</p><a class="btn" href="#/formations">Retour à l'exploration</a></div></div>` };
  const ys = years(f);
  let year = ys.includes(LAST_YEAR) ? LAST_YEAR : ys[ys.length - 1];

  const discNom = INS_DISC[f.insDisc] ?? null;
  const insFiche = () => {
    if (!f.insDisc) return `<div class="state"><p>Aucune discipline d'insertion n'est associée à cette formation.</p></div>`;
    const blocs = [18, 30].map((mois) => {
      const k = ['insertion', 'stables', 'salaireNet'].map((key) => ({ key, p: dernierePoint(insertion, f.uai, f.insDisc, mois, key) }));
      return { mois, k };
    });
    const any = blocs.some((b) => b.k.some((x) => x.p));
    const exist = lignes(insertion, { uai: f.uai, disc: f.insDisc }).length;
    if (!any) return `<div class="note warn"><p>${exist ? `Le fichier contient ${exist} ligne(s) pour la discipline « ${esc(discNom)} » dans cet établissement, mais aucune valeur n'est significative (« ns »).` : `Aucune donnée d'insertion n'est publiée pour la discipline « ${esc(discNom)} » dans cet établissement.`} Cela ne dit rien de la qualité de la formation : l'échantillon est trop petit ou l'enquête ne couvre pas cet établissement.</p></div>`;
    const cell = (p, key) => (p ? `<b class="num">${key === 'salaireNet' ? eur(p.salaireNet) : pct(p[key], 0)}</b><br><span class="muted" style="font-size:var(--t-xs)">promotion ${p.annee}${p.reponses ? ` · ${int(p.reponses)} réponses` : ''}</span>` : `<span class="muted">${ND}</span>`);
    return `<div class="tbl-scroll"><table class="data-table"><thead><tr><th scope="col">Après le diplôme</th><th scope="col">${INS_INDICATORS.insertion.label}</th><th scope="col">${INS_INDICATORS.stables.label}</th><th scope="col">${INS_INDICATORS.salaireNet.label}</th></tr></thead><tbody>${blocs.map((b) => `<tr><th scope="row">${b.mois} mois</th>${b.k.map((x) => `<td>${cell(x.p, x.key)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="source">Dernière promotion avec une valeur significative pour chaque case.</p>`;
  };

  const body = () => {
    const s = f.sessions[year]; const rep = reperes[year];
    const sCpp = situer(s.candidatsParPlace, rep?.candidatsParPlace), sTx = situer(s.tauxProposition, rep?.tauxProposition);
    const memes = formations.filter((g) => g.ifc !== f.ifc && g.sessions[year] && (g.uai === f.uai || g.mention === f.mention)).sort((a, b) => (a.uai === f.uai ? -1 : 0) - (b.uai === f.uai ? -1 : 0)).slice(0, 4);
    const evoRows = YEARS.filter((y) => f.sessions[y]).map((y) => [String(y), int(f.sessions[y].candidatsPP), int(f.sessions[y].propositionsPP), int(f.sessions[y].acceptesPP), pct(f.sessions[y].tauxProposition)]);
    return `
    <section class="wrap kpis" aria-label="Chiffres clés ${year}">
      <div class="grid g4 keep2">
        <div class="kpi"><b>${int(s.places)}</b><span>Places ${info('places')}</span></div>
        <div class="kpi"><b>${int(s.candidatsPP)}</b><span>Candidats en phase principale ${info('candidatsPP')}</span></div>
        <div class="kpi"><b>${dec(s.candidatsParPlace)}</b><span>Candidats par place ${info('candidatsParPlace')}</span>${sCpp ? `<span class="def">Demande ${lecture[sCpp]}.</span>` : ''}</div>
        <div class="kpi"><b>${pct(s.tauxProposition, 0)}</b><span>Taux de proposition ${info('tauxProposition')}</span>${sTx ? `<span class="def">Part de propositions ${lecture[sTx]}.</span>` : ''}</div>
      </div></section>
    <div class="wrap grid g-7-5" style="margin-top:40px">
      ${chartPanel({ id: 'c-evo', title: 'Évolution des candidatures', sub: 'Candidats, propositions et acceptations en phase principale, session par session.', note: NOTE_ANNEES, source: SRC_CAND, period: 'sessions 2023 à 2025', table: { head: ['Session', 'Candidats', 'Propositions', 'Acceptations', 'Taux de proposition'], rows: evoRows } })}
      ${chartPanel({ id: 'c-ent', title: `De la candidature à l'acceptation, ${year}`, sub: `Taux d'acceptation : <b>${pct(s.tauxAcceptation, 0)}</b> ${info('tauxAcceptation')}`, source: SRC_CAND, period: `session ${year}`, height: 'short', table: { head: ['Étape', 'Candidats'], rows: [['Candidats', s.candidatsPP], ['Classés (PP + PC)', s.classes], ['Propositions', s.propositionsPP], ['Acceptations', s.acceptesPP]].map(([a, b]) => [a, int(b)]) } })}
    </div>
    <div class="wrap grid g-5-7" style="margin-top:24px">
      ${chartPanel({ id: 'c-ori', title: "D'où viennent les candidats ?", sub: `Formation suivie l'année précédente (candidats de la phase principale, ${year}).`, note: year < 2024 ? "En 2023, les étudiants de BUT ne sont pas distingués des autres : le BUT est inclus dans « Autre formation » ou « Licence »." : '', source: SRC_CAND, period: `session ${year}`, height: 'short' })}
      <section class="panel" aria-labelledby="c-pos-t"><h3 id="c-pos-t">Où se situe cette formation ?</h3>
        <p class="sub">Comparée à l'ensemble des Masters ouverts sur Mon Master en ${year} (${int(rep?.candidatsParPlace?.n)} formations avec au moins 20 candidats). Bande foncée : la moitié centrale des formations ; bande claire : 80 % d'entre elles.</p>
        <h4>Candidats par place</h4><div id="c-pos1" class="chart" style="height:120px" role="img" aria-label="Position en candidats par place"></div>
        <h4>Taux de proposition (%)</h4><div id="c-pos2" class="chart" style="height:120px" role="img" aria-label="Position en taux de proposition"></div>
        <p class="source">${SRC_CAND}, ${year}</p></section>
    </div>
    <div class="wrap" style="margin-top:24px"><section class="panel" aria-labelledby="ins-t">
      <h2 id="ins-t" style="font-size:var(--t-xl)">Et après le Master ?</h2>
      ${discNom ? `<div class="note warn"><p><b>À lire avant d'interpréter.</b> Ces chiffres décrivent la discipline « ${esc(discNom)} » dans l'établissement ${esc(f.etab)}, tous Masters confondus, et non cette formation précise. Ils concernent des diplômés jusqu'en 2020 : ils indiquent un ordre de grandeur, pas ce que vivront les promotions actuelles.</p></div>` : ''}
      ${insFiche()}
      ${discNom ? `<h3 style="margin-top:32px">Cet établissement face aux autres, discipline « ${esc(discNom)} »</h3><p class="sub">Taux d'insertion à 30 mois : médiane des établissements (trait bleu), moitié centrale (zone claire) et cet établissement (losanges jaunes).</p><div id="c-ins" class="chart short" role="img" aria-label="Insertion à 30 mois dans la discipline"></div><p class="source">${SRC_INS}</p>` : ''}
      <p style="margin-top:16px"><a href="#/insertion?disc=${esc(f.insDisc ?? '')}">Explorer l'insertion professionnelle de cette discipline</a></p>
    </section></div>
    <div class="wrap grid g2" style="margin-top:24px">
      <section class="panel"><h3>Informations</h3><dl class="deflist">
        <dt>Établissement</dt><dd>${esc(f.etab)}</dd><dt>Lieu de formation</dt><dd>${esc(f.lieux || ND)}</dd><dt>Région académique</dt><dd>${esc(f.region)}</dd>
        <dt>Mention nationale</dt><dd>${esc(mentionLabel(f.mention))}</dd><dt>Secteur disciplinaire</dt><dd>${esc(f.secteur)}</dd>
        <dt>Modalités</dt><dd>${esc((f.modalite || ND).toLowerCase())}</dd><dt>Identifiant Mon Master</dt><dd class="num">${esc(f.ifc)}</dd></dl>
        ${f.positionApprox ? `<p class="source" style="margin-top:12px">Position géographique approchée (autre formation du même établissement).</p>` : ''}</section>
      <section class="panel"><h3>Ce que les données ne disent pas</h3>
        <p>Les données ouvertes ne contiennent ni le programme, ni les frais, ni les dates limites, ni les débouchés propres à cette formation. Pour ces informations, consultez la page de la formation sur le site de l'établissement et la plateforme officielle <a href="https://monmaster.gouv.fr" rel="noopener">Mon Master</a>.</p></section>
    </div>
    ${memes.length ? `<div class="wrap" style="margin-top:48px"><h2>Formations proches</h2><p class="muted">Même établissement ou même mention, session ${year}.</p><div class="flist">${memes.map((g) => row(g, year)).join('')}</div></div>` : ''}`;
  };

  const drawCharts = () => {
    const s = f.sessions[year]; const rep = reperes[year];
    cand.evolution($('#c-evo'), f); cand.entonnoir($('#c-ent'), s); cand.origines($('#c-ori'), s, year);
    cand.position($('#c-pos1'), s.candidatsParPlace, rep?.candidatsParPlace, { name: 'cpp' });
    cand.position($('#c-pos2'), s.tauxProposition, rep?.tauxProposition, { name: 'tx', unit: ' %', max: 100 });
    if (f.insDisc && $('#c-ins')) {
      const extra = {}; for (const r of lignes(insertion, { uai: f.uai, disc: f.insDisc, mois: 30 })) if (r.insertion != null) extra[String(r.annee)] = r.insertion;
      insViz.serieBande($('#c-ins'), serieDiscipline(insertion, f.insDisc, 30, 'insertion'), 'insertion', { extra: Object.keys(extra).length ? { name: f.etab, data: extra } : null });
    }
  };

  return {
    title: `${f.parcours} · ${f.etab}`,
    html: `<div class="wrap fiche-head"><a href="#/formations" class="back">← Toutes les formations</a>
      <p class="eyebrow">${esc(f.etab)}${f.ville ? ` · ${esc(f.ville)}` : ''} · ${esc(f.region)}</p>
      <h1>${esc(f.parcours)}</h1>
      <div class="chips"><span class="chip blue">${esc(mentionLabel(f.mention))}</span>${f.alternance ? '<span class="chip yellow">Alternance</span>' : ''}${f.niveau === 'voisin' ? '<span class="chip">Discipline voisine</span>' : ''}</div>
      <div class="fiche-act">${actions(f)}<a class="btn small" href="#/comparer">Ouvrir le comparateur</a>
        <div class="seg" role="group" aria-label="Session de candidature">${ys.map((y) => `<button type="button" data-year="${y}" aria-pressed="${y === year}">${y}</button>`).join('')}</div></div>
      ${ys.length < 3 ? `<div class="note" style="margin-top:16px"><p>Cette formation n'apparaît que sur ${ys.length === 1 ? 'la session ' + ys[0] : 'les sessions ' + ys.join(' et ')} de Mon Master (ouverture, fermeture ou changement d'identifiant).</p></div>` : ''}</div>
    <div id="fiche-body">${body()}</div>`,
    mount(root) {
      drawCharts();
      on(root, 'click', '[data-year]', (e, b) => {
        year = Number(b.dataset.year); destroyCharts();
        $('#fiche-body', root).innerHTML = body();
        root.querySelectorAll('[data-year]').forEach((x) => x.setAttribute('aria-pressed', x === b));
        drawCharts();
      });
    },
    destroy: destroyCharts,
  };
}
