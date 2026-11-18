/** Méthode : sources, périmètre, définitions et limites. Page de transparence. */
import { loadAll, pingApi } from '../services/data.js';
import { IND } from '../domain/indicators.js';
import { INS_DISC, INS_INDICATORS, MENTIONS, API_URL } from '../config.js';
import { esc, $ } from '../core/dom.js';
import { int } from '../core/format.js';

export default async function page() {
  const { meta, reperes } = await loadAll();
  const c = meta.controles;
  const defs = (o) => Object.values(o).map((d) => `<dt>${esc(d.label)}</dt><dd>${esc(d.def)}</dd>`).join('');
  return {
    title: 'Méthode et sources',
    html: `<div class="wrap page-head"><p class="eyebrow">Méthode</p><h1>D'où viennent les chiffres</h1><p class="lead">Tout ce qui est affiché provient de jeux de données publics. Rien n'est estimé ni inventé : une valeur absente s'affiche « n.d. ». Cette page explique les sources, les définitions et les limites.</p></div>
    <div class="wrap grid g-8-4">
      <div class="col" style="display:grid;gap:24px">
        <section class="panel"><h2>Les sources</h2><ul class="bul">
          <li><b>Candidatures.</b> Mon Master, jeux « candidatures en master » 2023 et 2024-2025 (ministère de l'Enseignement supérieur et de la Recherche, SIES), Licence Ouverte. Une ligne par formation et par session.</li>
          <li><b>Insertion professionnelle.</b> Enquête sur les diplômés de master en universités et établissements assimilés, promotions 2010 à 2020, à 18 et 30 mois (MESRI-SIES), Licence Ouverte.</li>
          <li><b>Localisation.</b> API REST publique Masters-stats (<code>${esc(API_URL)}</code>) pour les coordonnées des formations.</li></ul>
          <p class="source">data.gouv.fr · données préparées le ${esc(meta.genere)} avec <code>scripts/build-data.mjs</code></p></section>
        <section class="panel"><h2>Le périmètre « création numérique »</h2><p>Il n'existe pas de secteur disciplinaire « création numérique ». Le périmètre repose sur les <b>mentions nationales</b> de Master suivantes :</p>
          <ul class="bul">${Object.values(MENTIONS).map((m) => `<li>${esc(m.label)} <span class="chip ${m.niveau === 'coeur' ? 'blue' : ''}">${m.niveau === 'coeur' ? 'cœur du périmètre' : 'discipline voisine (optionnel)'}</span></li>`).join('')}</ul>
          <p>Le choix de ces mentions est éditorial : d'autres Masters (informatique, communication) mènent aussi à ces métiers. Au total : <b class="num">${int(c.formationsPerimetre)}</b> formations dans <b class="num">${int(c.etablissements)}</b> établissements sur les trois sessions (${Object.entries(c.parSession).map(([y, n]) => `${y} : ${n}`).join(', ')}).</p></section>
        <section class="panel"><h2>Définitions des indicateurs de candidature</h2><dl class="deflist wide">${defs(Object.fromEntries(['candidatsPP', 'places', 'candidatsParPlace', 'tauxProposition', 'tauxAcceptation', 'classes'].map((k) => [k, IND[k]])))}</dl>
          <div class="note"><p><b>Pourquoi pas « taux d'accès » ?</b> Aucun fichier ne fournit ce taux. Le « taux de proposition » est calculé par le site à partir de deux colonnes (candidats et propositions de la phase principale) ; il se limite à la phase principale pour que 2023 (phase unique) et 2024-2025 restent comparables.</p></div></section>
        <section class="panel"><h2>Définitions d'insertion professionnelle</h2><dl class="deflist wide">${defs(INS_INDICATORS)}</dl>
          <p>Disciplines retenues, liées aux secteurs des formations du périmètre : ${Object.values(INS_DISC).map(esc).join(', ')}.</p></section>
        <section class="panel"><h2>Limites à connaître</h2><ul class="bul">
          <li><b>Candidats ≠ personnes.</b> Les effectifs sont comptés par formation. Un candidat postule à plusieurs formations : on n'additionne pas les candidats de formations différentes. Les parts « d'origine » portent donc sur des candidatures.</li>
          <li><b>Années comparables avec prudence.</b> 2023 : une seule phase d'admission, pas de BUT séparé. 2024 et 2025 : phases principale et complémentaire, noms de colonnes différents. Les graphiques multi-années utilisent la phase principale et le signalent.</li>
          <li><b>Insertion : discipline × établissement, jusqu'en 2020.</b> Les statistiques ne concernent ni une formation précise ni les promotions récentes. Elles ne sont pas rapprochées des candidatures 2023-2025 autrement qu'à titre de repère, via l'établissement et la discipline.</li>
          <li><b>Valeurs « ns ».</b> Non significatif (échantillon trop petit). Ces valeurs sont absentes des graphiques, jamais remplacées par zéro. Le taux d'emploi est presque toujours « ns » avant 2020.</li>
          <li><b>Repères nationaux.</b> Les comparaisons « tous Masters » portent sur les formations avec au moins 20 candidats (${int(reperes['2025'].candidatsParPlace.n)} formations en 2025).</li>
          <li><b>Non disponible dans les données ouvertes :</b> programmes, frais de scolarité, dates limites, journées portes ouvertes, débouchés propres à une formation.</li></ul></section>
      </div>
      <aside class="col" style="display:grid;gap:24px;align-content:start">
        <section class="panel"><h3>Contrôles de la dernière préparation</h3><dl class="deflist"><dt>Formations du périmètre</dt><dd class="num">${int(c.formationsPerimetre)}</dd><dt>Établissements</dt><dd class="num">${int(c.etablissements)}</dd><dt>Formations sans position</dt><dd class="num">${int(c.sansPosition)}</dd><dt>Établissements avec insertion</dt><dd class="num">${int(c.etablissementsAvecInsertion)}</dd><dt>Lignes d'insertion</dt><dd class="num">${int(c.lignesInsertion)}</dd></dl></section>
        <section class="panel"><h3>API REST Masters-stats</h3><p id="api-status" class="muted">Vérification…</p><p class="source">Le site fonctionne sans l'API : les données sont préparées à l'avance et servies en fichiers statiques.</p></section>
      </aside></div>`,
    async mount(root) {
      const r = await pingApi();
      const el = $('#api-status', root); if (el) el.innerHTML = r.ok ? `<span class="chip blue">Disponible</span> ${r.n} académies renvoyées à l'instant.` : `<span class="chip warn">Indisponible</span> L'API ne répond pas pour le moment. Le site n'est pas affecté.`;
    },
  };
}
