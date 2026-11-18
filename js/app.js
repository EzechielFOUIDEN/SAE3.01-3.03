// Master Lab : éléments communs (données, calculs, en-tête, pied de page, mémoire locale, cartes de formation).
// Scripts classiques (pas de modules) : le site s'ouvre aussi directement depuis le disque.
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const params = new URLSearchParams(location.search);

/* ---------- Données (js/data.js, généré par scripts/build-data.mjs) ---------- */
const D = window.MASTERLAB;
const MASTERS = D.masters;
const YEARS = [2023, 2024, 2025];
const LAST = 2025;
const ND = 'n.d.';
const byId = (id) => MASTERS.find((m) => m.ifc === id);
const MENTIONS = {
  'CREATION NUMERIQUE': 'Création numérique',
  'ARTS, TECHNOLOGIES, CREATION': 'Arts, technologies, création',
  'AUDIOVISUEL, MEDIAS INTERACTIFS NUMERIQUES, JEUX': 'Audiovisuel, médias interactifs numériques, jeux',
  'HUMANITES NUMERIQUES': 'Humanités numériques',
  'DESIGN': 'Design',
  'CINEMA ET AUDIOVISUEL': 'Cinéma et audiovisuel',
};
const INS_DISC = { disc06: 'Lettres, langues, arts', disc10: 'Information et communication', disc16: 'Informatique' };
const mentionLabel = (m) => MENTIONS[m] ?? m;

/* ---------- Mise en forme : une valeur absente s'affiche « n.d. », jamais 0 ---------- */
const nf = new Intl.NumberFormat('fr-FR');
const fmt = (n) => (n == null ? ND : nf.format(n));
const dec = (n, d = 1) => (n == null ? ND : n.toLocaleString('fr-FR', { maximumFractionDigits: d }));
const pc = (n, d = 0) => (n == null ? ND : `${dec(n, d)} %`);
const eur = (n) => (n == null ? ND : `${nf.format(Math.round(n))} €`);
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const titleCase = (s) => String(s ?? '').toLowerCase().replace(/(^|[\s\-'’(])(\p{L})/gu, (m, p, c) => p + c.toUpperCase()).replace(/ (De|Du|Des|La|Le|Les|Et|En|Sur|Sous) /g, (m, w) => ` ${w.toLowerCase()} `);
MASTERS.forEach((m) => { if (m.ville) m.ville = titleCase(m.ville); }); // la source donne les villes en capitales

/* ---------- Indicateurs ---------- */
/** Session affichée : la plus récente où la formation existe. */
const S = (m, y = LAST) => m.sessions[y] ?? m.sessions[[...YEARS].reverse().find((a) => m.sessions[a])];
const taux = (m, y) => S(m, y).tauxProposition; // « taux d'accès » : voir DEF.taux
const nom = (m) => (!m.parcours || norm(m.parcours) === norm(mentionLabel(m.mention)) ? mentionLabel(m.mention) : `${mentionLabel(m.mention)} – ${m.parcours}`);
const DEF = {
  taux: "Part des candidats de la phase principale qui ont reçu une proposition d'admission en phase principale. Calcul Master Lab (propositions ÷ candidats) : ce n'est pas un taux officiel ni votre probabilité d'être admis. Pour l'alternance, les propositions dépendent surtout des contrats d'apprentissage : le taux est naturellement bas.",
  candidats: "Candidats ayant confirmé une candidature à cette formation en phase principale. Une même personne candidate à plusieurs formations : on ne peut pas additionner les candidats de formations différentes.",
  places: "Capacité d'accueil déclarée par la formation sur Mon Master.",
  insertion: "Discipline de l'établissement, tous Masters confondus (pas cette formation seule), pour les diplômés jusqu'en 2020. Les valeurs « ns » (échantillon trop petit) ne sont pas affichées.",
};
const help = (txt, label = 'Définition') => `<details class="help"><summary aria-label="${esc(label)}">?</summary><div>${esc(txt)}</div></details>`;

/** Insertion : dernière promotion avec une valeur significative pour (établissement, discipline, délai). */
const INS = new Map();
D.insertion.forEach((r) => { const k = `${r.uai}|${r.disc}|${r.mois}`; (INS.get(k) ?? INS.set(k, []).get(k)).push(r); });
const insRows = (m, mois) => INS.get(`${m.uai}|${m.insDisc}|${mois}`) ?? [];
function insPoint(m, mois, key) {
  let best = null;
  for (const r of insRows(m, mois)) if (r[key] != null && (!best || r.annee > best.annee)) best = r;
  return best;
}
const insVal = (m, mois, key) => insPoint(m, mois, key)?.[key] ?? null;

/* ---------- Recherche ---------- */
const hayCache = new Map();
const hay = (m) => hayCache.get(m) ?? (hayCache.set(m, norm([m.mention, mentionLabel(m.mention), m.parcours, m.etab, m.ville, m.region, m.secteur].join(' '))), hayCache.get(m));
/** Mots-clés : tous présents. Zone : ville, région ou académie. Par défaut, le cœur du périmètre en 2025. */
function filterMasters({ q = '', zone = '', mention = '', alt = false, tauxMin = 0, large = false, fav = false } = {}) {
  const fv = fav ? new Set(favs()) : null;
  return MASTERS.filter((m) => {
    if (!m.sessions[LAST]) return false; // formation absente de la session 2025
    if (!large && m.niveau !== 'coeur' && !mention) return false;
    return norm(q).split(/\s+/).filter(Boolean).every((w) => hay(m).includes(w))
      && (!zone || norm(`${m.ville} ${m.region} ${m.academie}`).includes(norm(zone)))
      && (!mention || m.mention === mention)
      && (!alt || m.alternance)
      && (tauxMin <= 0 || (taux(m) != null && taux(m) >= tauxMin))
      && (!fv || fv.has(m.ifc));
  });
}

/* ---------- Mémoire du navigateur (le site marche aussi sans : on perd seulement les choix) ---------- */
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('ml_' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ml_' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
};
const user = () => (store.get('logged', false) ? store.get('user', null) : null);

/* ---------- En-tête, pied de page, menu burger ---------- */
const page = document.body.dataset.page;
const link = (href, label, key) => `<a href="${href}"${key === page ? ' class="on" aria-current="page"' : ''}>${label}</a>`;
const u = user();
document.body.insertAdjacentHTML('afterbegin', `
<a class="skip" href="#main">Aller au contenu</a>
<header class="hd">
  <button class="burger" aria-label="Menu" aria-expanded="false"></button>
  <a class="logo" href="index.html"><i></i>Master Lab</a>
  <nav aria-label="Navigation principale">
    ${link('index.html', 'Accueil', 'accueil')}
    ${link('carte.html', 'Carte interactive', 'carte')}
    ${link('formations.html', 'Formations', 'formations')}
    ${link('comparateur.html', 'Comparateur', 'comparateur')}
    ${link('quiz.html', 'Quiz', 'quiz')}
  </nav>
  <div class="row acct" style="flex-wrap:nowrap">
    ${u ? `<a class="me${page === 'espace' ? ' on' : ''}" href="espace.html">Mon espace</a><button class="btn" data-logout>Déconnexion</button>`
    : '<a class="btn" href="connexion.html">Connexion</a><a class="btn p" href="inscription.html">Inscription</a>'}
  </div>
</header>`);
document.body.insertAdjacentHTML('beforeend', `
<footer class="ft">
  <div><b>Master Lab</b> : explorer les Masters publics en création numérique.</div>
  <div>Données : MESRI-SIES, Mon Master 2023-2025 et insertion professionnelle 2010-2020 (Licence Ouverte). Projet SAÉ 3.01 · BUT MMI Laval.</div>
</footer>`);
const main = $('main'); if (main) { main.id ||= 'main'; main.tabIndex = -1; $('.skip').href = '#' + main.id; }
const hd = $('.hd'), burger = $('.burger', hd);
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', hd.classList.toggle('open')));

/* Messages courts */
function toast(msg) {
  $('.toast')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${esc(msg)}</div>`);
  setTimeout(() => $('.toast')?.remove(), 2600);
}

/* ---------- Favoris (compte requis) et comparateur (3 formations au plus) ---------- */
const favs = () => store.get('fav', []);
const cmps = () => store.get('cmp', []);
function syncButtons() {
  $$('[data-fav]').forEach((b) => { const on = favs().includes(b.dataset.fav); b.setAttribute('aria-pressed', on); b.textContent = on ? '♥ En favori' : '♡ Favori'; });
  $$('[data-cmp]').forEach((b) => { const on = cmps().includes(b.dataset.cmp); b.setAttribute('aria-pressed', on); b.textContent = on ? '✓ Comparé' : 'Comparer'; });
}
document.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]'), cmp = e.target.closest('[data-cmp]');
  if (e.target.closest('[data-logout]')) { store.set('logged', false); location.href = 'index.html'; }
  if (fav) {
    if (!user()) { location.href = 'connexion.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search + location.hash); return; }
    const id = fav.dataset.fav, list = favs();
    store.set('fav', list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
    toast(list.includes(id) ? 'Retiré des favoris' : 'Ajouté à tes favoris (Mon espace)');
  }
  if (cmp) {
    const id = cmp.dataset.cmp, list = cmps();
    if (list.includes(id)) { store.set('cmp', list.filter((x) => x !== id)); toast('Retiré du comparateur'); }
    else if (list.length >= 3) toast('3 formations au plus dans le comparateur');
    else { store.set('cmp', [...list, id]); toast(`Ajouté au comparateur (${list.length + 1}/3)`); }
  }
  if (fav || cmp) { syncButtons(); document.dispatchEvent(new Event('ml:change')); }
});

/* ---------- Carte de formation (liste, favoris, quiz) ---------- */
const chips = (m) => `<div class="chips"><span class="chip">${fmt(S(m).places)} places</span><span class="chip">Taux d’accès ${pc(taux(m))}</span>${m.alternance ? '<span class="chip">Alternance</span>' : ''}</div>`;
const card = (m, extra = '') => `
<article class="fc">
  <div class="grow col" style="gap:8px">
    <p class="eyebrow">${esc(m.etab)}${m.ville ? ` · ${esc(m.ville)}` : ''}</p>
    <h3><a href="fiche.html?id=${esc(m.ifc)}">${esc(nom(m))}</a></h3>
    ${chips(m)}${extra}
  </div>
  <div class="acts">
    <a class="btn p" href="fiche.html?id=${esc(m.ifc)}">Voir la formation</a>
    <div class="row" style="flex-wrap:nowrap"><button class="btn grow" data-fav="${esc(m.ifc)}"></button><button class="btn grow" data-cmp="${esc(m.ifc)}"></button></div>
  </div>
</article>`;

/* ---------- Villes : regroupement des formations pour la carte ---------- */
/** L'outre-mer et les formations sans coordonnées ne sont pas placées (hors carte). */
function byCity(list) {
  const cities = new Map(), hors = [];
  for (const m of list) {
    if (m.lat == null || m.lon == null || m.lon < -25 || m.lat < 30) { hors.push(m); continue; }
    (cities.get(m.ville) ?? cities.set(m.ville, { ville: m.ville, ms: [] }).get(m.ville)).ms.push(m);
  }
  const villes = [...cities.values()].map((c) => ({ ...c, lat: c.ms.reduce((a, m) => a + m.lat, 0) / c.ms.length, lon: c.ms.reduce((a, m) => a + m.lon, 0) / c.ms.length }));
  return { villes, hors };
}

syncButtons();
