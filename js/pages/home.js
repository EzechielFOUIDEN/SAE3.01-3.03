/** Accueil éditorial : promesse, chiffres réels, entrées dans l'application, clés de lecture. */
import { loadAll } from '../services/data.js';
import { int, dec } from '../core/format.js';
import { median } from '../domain/indicators.js';
import { LAST_YEAR } from '../config.js';
import { $ } from '../core/dom.js';
import { navigate } from '../core/router.js';

export default async function page() {
  const { formations, reperes } = await loadAll();
  const fs = formations.filter((f) => f.niveau === 'coeur' && f.sessions[LAST_YEAR]);
  const etabs = new Set(fs.map((f) => f.uai)); const regions = new Set(fs.map((f) => f.region));
  const places = fs.reduce((n, f) => n + (f.sessions[LAST_YEAR].places ?? 0), 0);
  const alt = fs.filter((f) => f.alternance).length;
  const med = median(fs.filter((f) => f.sessions[LAST_YEAR].candidatsPP >= 20).map((f) => f.sessions[LAST_YEAR].candidatsParPlace));
  return {
    title: 'Explorer les Masters en création numérique',
    html: `<section class="hero"><div class="wrap hero-in">
        <p class="eyebrow on-dark">Création numérique · Masters publics</p>
        <h1>Trouvez le Master qui <em>vous ressemble</em>, avec les vrais chiffres.</h1>
        <p class="lead on-dark">Formations, candidatures, insertion professionnelle : explorez les données officielles de Mon Master, sans jargon, avec les limites de chaque chiffre expliquées.</p>
        <form class="hero-search" id="hs" role="search"><label class="sr-only" for="hq">Rechercher une formation, une ville, un établissement</label>
          <input class="input" id="hq" type="search" placeholder="Une ville, une spécialité : « jeu vidéo », « Rennes », « UX »…"><button class="btn accent">Rechercher</button></form>
        <p class="hero-links"><a href="#/guide">Je ne sais pas par où commencer →</a><a href="#/carte">Voir la carte</a></p></div></section>
    <section class="wrap figures" aria-label="Le périmètre en chiffres"><div class="grid g4 keep2">
      <div class="kpi"><b>${int(fs.length)}</b><span>formations de Master en création numérique ouvertes en ${LAST_YEAR}</span></div>
      <div class="kpi"><b>${int(etabs.size)}</b><span>établissements dans ${int(regions.size)} régions</span></div>
      <div class="kpi"><b>${int(places)}</b><span>places déclarées, dont ${int(alt)} formations en alternance</span></div>
      <div class="kpi"><b>${dec(med)}</b><span>candidats par place (médiane), contre ${dec(reperes[LAST_YEAR].candidatsParPlace.p50)} tous Masters confondus</span></div></div>
      <p class="source">MESRI-SIES, Mon Master ${LAST_YEAR}, phase principale · périmètre : mentions Création numérique, Arts-technologies-création, Audiovisuel-médias interactifs-jeux, Humanités numériques</p></section>
    <section class="wrap entries"><p class="eyebrow">Explorer</p><h2>Quatre façons d'entrer dans les données</h2>
      <div class="grid g2 entry-grid">
        <a class="entry" href="#/formations"><span class="n">01</span><h3>Parcourir les formations</h3><p>Filtrez par région, mention ou alternance, puis ouvrez une fiche : admission, évolution, origine des candidats.</p></a>
        <a class="entry" href="#/carte"><span class="n">02</span><h3>Explorer la carte</h3><p>Où se trouvent les Masters ? Zoomez sur une ville et découvrez ses formations.</p></a>
        <a class="entry" href="#/statistiques"><span class="n">03</span><h3>Comprendre la demande</h3><p>Quelles formations sont les plus demandées, les plus sélectives, et comment cela évolue-t-il ?</p></a>
        <a class="entry" href="#/insertion"><span class="n">04</span><h3>Voir l'après-Master</h3><p>Insertion, emplois stables et salaires 18 et 30 mois après le diplôme, avec leurs limites.</p></a></div></section>
    <section class="band"><div class="wrap grid g3 keep1">
      <div><h3>Un candidat n'est pas une personne</h3><p>Une même personne candidate à plusieurs formations. Les effectifs sont comptés par formation : on ne les additionne pas.</p></div>
      <div><h3>Le taux de proposition n'est pas un taux d'accès</h3><p>Il indique la part des candidats qui reçoivent une proposition en phase principale, pas vos chances personnelles d'être admis.</p></div>
      <div><h3>L'insertion parle de disciplines, pas de formations</h3><p>L'enquête publie des résultats par discipline et par établissement, jusqu'aux promotions 2020.</p></div></div>
      <div class="wrap" style="margin-top:24px"><a class="btn" href="#/methode">Lire la méthode et les sources</a></div></section>`,
    mount(root) {
      $('#hs', root).addEventListener('submit', (e) => { e.preventDefault(); navigate('/formations', { q: $('#hq', root).value.trim() }); });
    },
  };
}
