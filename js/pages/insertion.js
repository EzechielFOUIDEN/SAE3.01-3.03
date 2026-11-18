/** Insertion professionnelle par discipline : évolution, disponibilité des données, classement des établissements. */
import { loadAll } from '../services/data.js';
import { chartPanel, destroyCharts } from '../viz/charts.js';
import * as ins from '../viz/insertion.js';
import { serieDiscipline, disponibilite } from '../domain/insertion.js';
import { INS_DISC, INS_INDICATORS } from '../config.js';
import { $, on, esc } from '../core/dom.js';
import { replaceQuery } from '../core/router.js';

const SRC = 'MESRI-SIES, insertion professionnelle des diplômés de master en universités et établissements assimilés, 2010-2020';
const KEYS = Object.keys(INS_INDICATORS);

export default async function page({ query }) {
  const { formations, insertion } = await loadAll();
  const uaiScope = new Set(formations.map((f) => f.uai));
  let disc = INS_DISC[query.disc] ? query.disc : 'disc10';
  let key = KEYS.includes(query.ind) ? query.ind : 'insertion';
  let mois = Number(query.mois) === 18 ? 18 : 30;
  let promo = Number(query.promo) || null;
  let only = query.tous !== '1';

  const rowsFor = (a) => insertion.filter((r) => r.disc === disc && r.mois === mois && r.annee === a && r[key] != null && (!only || uaiScope.has(r.uai))).map((r) => ({ etab: r.etab, v: r[key], reponses: r.reponses, inScope: uaiScope.has(r.uai) })).sort((a, b) => b.v - a.v);
  const years = () => [...new Set(insertion.filter((r) => r.disc === disc && r.mois === mois && r[key] != null && (!only || uaiScope.has(r.uai))).map((r) => r.annee))].sort();

  const html = () => {
    const ys = years(); if (!ys.includes(promo)) promo = ys[ys.length - 1] ?? null;
    const def = INS_INDICATORS[key];
    return `<div class="wrap page-head"><p class="eyebrow">Insertion professionnelle</p><h1>Que deviennent les diplômés ?</h1>
      <p class="lead">Taux d'insertion, emplois stables, salaires : l'enquête ministérielle suit les diplômés de Master 18 et 30 mois après leur diplôme. Elle est publiée par <b>discipline et par établissement</b>, pas par formation.</p>
      <div class="note warn"><p><b>Ce que ces données permettent, et ce qu'elles ne permettent pas.</b> Elles couvrent les promotions diplômées jusqu'en 2020 : ce sont des repères historiques. Il n'existe pas de discipline « création numérique » dans l'enquête ; les formations du périmètre relèvent surtout des disciplines ci-dessous. Beaucoup de valeurs sont « ns » (non significatif, échantillon trop petit) et ne sont pas affichées.</p></div></div>
    <div class="wrap"><form class="filters ins-f" id="ins-f" onsubmit="return false">
      <div class="field"><label for="i-disc">Discipline</label><select class="select" id="i-disc">${Object.entries(INS_DISC).map(([k, l]) => `<option value="${k}"${k === disc ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="field"><label for="i-ind">Indicateur</label><select class="select" id="i-ind">${KEYS.map((k) => `<option value="${k}"${k === key ? ' selected' : ''}>${esc(INS_INDICATORS[k].label)}</option>`).join('')}</select></div>
      <div class="field"><span class="lab">Après le diplôme</span><div class="seg" role="group" aria-label="Délai"><button type="button" data-mois="18" aria-pressed="${mois === 18}">18 mois</button><button type="button" data-mois="30" aria-pressed="${mois === 30}">30 mois</button></div></div>
      <div class="field f-opts"><span class="lab">Établissements</span><label class="check"><input type="checkbox" id="i-only"${only ? ' checked' : ''}> Seulement ceux qui proposent un Master du périmètre</label></div></form>
      <p class="muted" style="margin:12px 0 24px"><b>${esc(def.label)}.</b> ${esc(def.def)}</p>
      <div class="grid g-7-5">
        ${chartPanel({ id: 'i-serie', title: `${def.label}, ${mois} mois après le diplôme`, sub: `Discipline « ${esc(INS_DISC[disc])} » : médiane des établissements et moitié centrale, par année de diplôme.`, source: SRC, period: 'promotions 2010 à 2020' })}
        ${chartPanel({ id: 'i-dispo', title: 'Combien de valeurs exploitables ?', sub: 'Nombre d’établissements avec une valeur significative, pour cet indicateur.', source: SRC, height: 'short' })}
      </div>
      <div style="margin-top:24px">${ys.length ? `<section class="panel" aria-labelledby="i-cl-t"><h3 id="i-cl-t">Classement des établissements, promotion ${promo}</h3>
        <div class="fiche-act" style="margin-bottom:12px"><div class="field"><label for="i-promo">Promotion</label><select class="select" id="i-promo" style="width:auto">${ys.slice().reverse().map((a) => `<option${a === promo ? ' selected' : ''}>${a}</option>`).join('')}</select></div></div>
        <div id="i-cl" class="chart tall" role="img" aria-label="Classement des établissements"></div>
        <p class="source">${SRC}, promotion ${promo}. Bleu : établissement proposant un Master du périmètre. Les écarts entre établissements reflètent aussi des différences de taille d'échantillon.</p></section>` : `<div class="state"><h2>Aucune valeur significative</h2><p>Pour ces critères, toutes les valeurs sont « ns » ou absentes. Essayez l'autre délai, un autre indicateur ou élargissez aux autres établissements.</p></div>`}</div></div>`;
  };

  const draw = () => {
    destroyCharts();
    const uai = only ? uaiScope : null;
    ins.serieBande($('#i-serie'), serieDiscipline(insertion, disc, mois, key, uai), key);
    ins.disponibilite($('#i-dispo'), disponibilite(only ? insertion.filter((r) => uaiScope.has(r.uai)) : insertion, disc, mois, key));
    if (promo && $('#i-cl')) ins.classementEtab($('#i-cl'), rowsFor(promo).slice(0, 25), key);
  };

  return {
    title: 'Insertion professionnelle', html: html(),
    mount(root) {
      const go = () => { replaceQuery({ disc, ind: key === 'insertion' ? '' : key, mois: mois === 30 ? '' : mois, promo: '', tous: only ? '' : '1' }); root.innerHTML = html(); draw(); };
      draw();
      on(root, 'change', '#i-disc', (e, s) => { disc = s.value; go(); });
      on(root, 'change', '#i-ind', (e, s) => { key = s.value; go(); });
      on(root, 'click', '[data-mois]', (e, b) => { mois = Number(b.dataset.mois); go(); });
      on(root, 'change', '#i-only', (e, c) => { only = c.checked; go(); });
      on(root, 'change', '#i-promo', (e, s) => { promo = Number(s.value); destroyCharts(); const r = $('#i-cl', root); draw(); $('#i-cl-t', root).textContent = `Classement des établissements, promotion ${promo}`; });
    },
    destroy: destroyCharts,
  };
}
