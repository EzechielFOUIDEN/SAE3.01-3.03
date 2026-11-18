/** Guide d'orientation : 4 questions traduites en filtres visibles et modifiables. Aucun score caché. */
import { loadAll } from '../services/data.js';
import { esc, $ } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { distinct } from '../domain/filters.js';
import { mentionLabel } from '../config.js';

// Les mentions sont séparées par « | » car leurs libellés contiennent des virgules.
const THEMES = [
  ['Concevoir des expériences et produits numériques interactifs', 'CREATION NUMERIQUE|AUDIOVISUEL, MEDIAS INTERACTIFS NUMERIQUES, JEUX'],
  ["Créer des images, de l'art et du design avec les technologies", 'ARTS, TECHNOLOGIES, CREATION|DESIGN'],
  ["Raconter par l'image, le son, la vidéo ou le jeu", 'AUDIOVISUEL, MEDIAS INTERACTIFS NUMERIQUES, JEUX|CINEMA ET AUDIOVISUEL'],
  ["Analyser la culture et la société à l'ère du numérique", 'HUMANITES NUMERIQUES'],
  ['Je ne sais pas encore', ''],
];

export default async function page() {
  const { formations } = await loadAll();
  const regions = distinct(formations, (f) => [f.region, f.region]);
  const a = {};
  const Q = [
    { id: 'theme', t: "Qu'est-ce qui vous attire le plus ?", opts: THEMES.map(([l], i) => [String(i), l]) },
    { id: 'alt', t: "L'alternance, pour vous, c'est…", opts: [['1', 'Indispensable : seulement des formations en alternance'], ['', 'Un plus, mais pas obligatoire'], ['0', 'Non : formation initiale uniquement']] },
    { id: 'region', t: 'Où souhaitez-vous étudier ?', opts: [['', 'Peu importe'], ...regions] },
    { id: 'tri', t: 'Côté demande, vous préférez…', opts: [['demande', 'Viser les formations les plus demandées'], ['proposition', 'Maximiser vos chances : voir en premier celles qui proposent à une plus grande part de candidats'], ['nom', 'Pas de préférence']] },
  ];
  const traduire = () => {
    const th = THEMES[Number(a.theme ?? 4)];
    return { mention: th[1], alt: a.alt ?? '', region: a.region ?? '', tri: a.tri ?? 'nom', perimetre: /DESIGN|CINEMA/.test(th[1]) ? 'large' : 'coeur' };
  };
  const field = (q) => (q.id === 'region'
    ? `<select class="select" name="region" aria-label="Région">${q.opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`
    : q.opts.map(([v, l]) => `<label class="opt"><input type="radio" name="${q.id}" value="${esc(v)}"><span>${esc(l)}</span></label>`).join(''));
  return {
    title: "Guide d'orientation",
    html: `<div class="wrap page-head"><p class="eyebrow">Guide d'orientation</p><h1>Trouver par où commencer</h1>
      <p class="lead">Quatre questions pour ouvrir des pistes. Vos réponses sont transformées en filtres que vous voyez et pouvez modifier : le guide ne calcule aucun « score de compatibilité ».</p></div>
      <div class="wrap narrow"><form id="guide" onsubmit="return false">${Q.map((q) => `<fieldset class="q"><legend>${esc(q.t)}</legend>${field(q)}</fieldset>`).join('')}
        <div class="note blue"><p id="trad">Répondez aux questions : les filtres correspondants s'afficheront ici.</p></div>
        <button class="btn primary" id="go">Voir les formations correspondantes</button></form></div>`,
    mount(root) {
      const form = $('#guide', root);
      const upd = () => {
        const fd = new FormData(form); for (const q of Q) if (fd.has(q.id)) a[q.id] = fd.get(q.id);
        const t = traduire(); const parts = [];
        if (a.theme !== undefined) parts.push(t.mention ? `mentions : ${t.mention.split('|').map((m) => mentionLabel(m)).join(' ; ')}` : 'toutes les mentions du périmètre');
        if (a.alt !== undefined) parts.push(t.alt === '1' ? 'alternance uniquement' : t.alt === '0' ? 'hors alternance' : 'alternance ou non');
        if (a.region !== undefined) parts.push(t.region ? `région : ${t.region}` : 'toutes les régions');
        if (a.tri !== undefined) parts.push({ demande: 'tri par demande décroissante', proposition: 'tri par taux de proposition décroissant', nom: 'tri par nom' }[t.tri]);
        $('#trad', root).innerHTML = parts.length ? `<b>Vos réponses deviennent ces filtres :</b> ${parts.map(esc).join(' · ')}.` : "Répondez aux questions : les filtres correspondants s'afficheront ici.";
      };
      form.addEventListener('change', upd);
      $('#go', root).addEventListener('click', () => { upd(); const t = traduire(); navigate('/formations', { mention: t.mention, alt: t.alt, region: t.region, tri: t.tri === 'nom' ? '' : t.tri, perimetre: t.perimetre === 'large' ? 'large' : '' }); });
    },
  };
}
