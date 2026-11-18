/**
 * build-data.mjs : prépare les données de Master Lab à partir des sources officielles.
 *
 * Usage : node scripts/build-data.mjs <dossier-sources>
 *   <dossier-sources> contient :
 *     Données des candidatures-20261118/fr-esr-mon_master_2023.csv
 *     Données des candidatures-20261118/fr-esr-mon_master_2024-2025.csv
 *     fr-esr-insertion_professionnelle-master_2010-2020.csv
 *
 * Sorties (dossier data/) :
 *   formations.json  formations du périmètre « création numérique » + candidatures 2023-2025 + coordonnées (API REST)
 *   insertion.json   insertion professionnelle (2010-2020) des disciplines liées au périmètre
 *   repères.json     distribution nationale (quantiles) pour situer une formation
 *   meta.json        sources, périmètre, date de génération, comptages de contrôle
 *
 * Aucune donnée n'est inventée : valeur absente ou non numérique => null.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2];
if (!SRC) { console.error('Usage : node scripts/build-data.mjs <dossier-sources>'); process.exit(1); }
const API = 'https://la-lab4ce.univ-lemans.fr/masters-stats/api/rest';

// Périmètre : mentions nationales (noms normalisés). "coeur" = création numérique au sens strict.
const SCOPE = {
  'CREATION NUMERIQUE': 'coeur',
  'ARTS, TECHNOLOGIES, CREATION': 'coeur',
  'AUDIOVISUEL, MEDIAS INTERACTIFS NUMERIQUES, JEUX': 'coeur',
  'HUMANITES NUMERIQUES': 'coeur',
  'DESIGN': 'voisin',
  'CINEMA ET AUDIOVISUEL': 'voisin',
};

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

/** Parseur CSV (séparateur ;, guillemets, retours ligne dans les champs). */
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ';') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f.replace(/\r$/, '')); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const load = (p) => parseCsv(readFileSync(join(SRC, p), 'utf8'));
/** Nombre ou null. Les valeurs vides, "ns", "nd"... deviennent null (jamais 0). */
const num = (v) => {
  if (v == null) return null;
  const s = String(v).trim().replace(',', '.');
  return s !== '' && /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
};
const pct = (a, b) => (a != null && b ? Math.round((a / b) * 1000) / 10 : null);

// ---------- Candidatures ----------
const c23 = load('Données des candidatures-20261118/fr-esr-mon_master_2023.csv');
const c2425 = load('Données des candidatures-20261118/fr-esr-mon_master_2024-2025.csv');

const K = {
  place: 'Capacité offerte limitée par la formation',
  canPP: 'Effectif de candidats ayant confirmé une candidature en phase principale',
  canPC: 'Effectif de candidats ayant confirmé une candidature en phase complémentaire',
  clas: 'Effectif de candidats classés sur une candidature formulée en phase principale ou en phase complémentaire',
  propPP: 'Effectif de candidats ayant reçu une proposition pour une candidature formulée en phase principale',
  prop: 'Effectif de candidats ayant reçu une proposition pour une candidature formulée en phase principale ou en phase complémentaire',
  acc: "Effectif de candidats ayant accepté une proposition d'admission pour une candidature formulée en phase principale ou en phase complémentaire",
  accPP: "Effectif de candidats ayant accepté une proposition d'admission pour une candidature formulée en phase principale",
  canBUT: 'Effectif de candidats en phase principale inscrits en troisième année de bachelor universitaire de technologie à la rentrée N-1',
  propBUT: 'Effectif de candidats ayant reçu une proposition pour une candidature de PP ou de PC inscrits en troisième année de bachelor universitaire de technologie  à la rentrée N-1',
  accBUT: "Effectif de candidats ayant accepté une proposition d'admission pour une candidature de PP ou de PC inscrits en troisième année de bachelor universitaire de technologie  à la rentrée N-1",
  canLG: 'Effectif de candidats en phase principale inscrits en troisième année de licence générale à la rentrée N-1',
  canLP: 'Effectif de candidats en phase principale inscrits en licence professionnelle à la rentrée N-1',
  canMA: 'Effectif de candidats en phase principale inscrits en master à la rentrée N-1',
  canAU: 'Effectif de candidats en phase principale inscrits dans une autre formation à la rentrée N-1',
  canNI: "Effectif de candidats en phase principale qui n'étaient pas inscrits dans un établissement d'enseignement supérieur en France à la rentrée N-1",
  femPP: 'Effectif de candidats ayant confirmé une candidature en phase principale - Dont effectif de femmes',
  rang: 'Rang du dernier appelé en phase principale',
};

/** Ligne 2024-2025 -> indicateurs normalisés (phase principale = référence comparable à 2023). */
function from2425(r) {
  return {
    places: num(r[K.place]),
    candidatsPP: num(r[K.canPP]), candidatsPC: num(r[K.canPC]),
    classes: num(r[K.clas]),
    propositionsPP: num(r[K.propPP]), propositions: num(r[K.prop]),
    acceptesPP: num(r[K.accPP]), acceptes: num(r[K.acc]),
    candidatsBUT: num(r[K.canBUT]), propositionsBUT: num(r[K.propBUT]), acceptesBUT: num(r[K.accBUT]),
    origines: { lg3: num(r[K.canLG]), lp3: num(r[K.canLP]), master: num(r[K.canMA]), autre: num(r[K.canAU]), nonInscrit: num(r[K.canNI]) },
    femmesPP: num(r[K.femPP]), rangDernierPP: num(r[K.rang]),
  };
}
/** Ligne 2023 (une seule phase d'admission) -> mêmes indicateurs. Pas de BUT séparé en 2023 : null. */
function from2023(r) {
  return {
    places: num(r.col),
    candidatsPP: num(r.n_can), candidatsPC: null,
    classes: num(r.n_clas),
    propositionsPP: num(r.n_prop), propositions: num(r.n_prop),
    acceptesPP: num(r.n_accept), acceptes: num(r.n_accept),
    candidatsBUT: null, propositionsBUT: null, acceptesBUT: null,
    origines: { lg3: num(r.n_can_lg3), lp3: num(r.n_can_lp3), master: num(r.n_can_master), autre: num(r.n_can_autre), nonInscrit: num(r.n_can_noninscri) },
    femmesPP: num(r.n_can_femme), rangDernierPP: num(r.rang_dernier),
  };
}
/** Indicateurs dérivés. Définitions : voir docs/INDICATEURS.md */
function derive(s) {
  return {
    ...s,
    tauxProposition: pct(s.propositionsPP, s.candidatsPP), // % des candidats PP ayant reçu une proposition PP
    tauxAcceptation: pct(s.acceptesPP, s.propositionsPP),   // % des propositions PP acceptées
    candidatsParPlace: s.places ? Math.round((s.candidatsPP / s.places) * 10) / 10 : null,
  };
}

// Toutes les lignes (pour repères nationaux) et lignes du périmètre
const all = [];
for (const r of c23) all.push({ s: 2023, ifc: r.ifc, uai: r.eta_uai, mention: r.mention, parcours: r.parcours, raw: r, v: from2023(r) });
for (const r of c2425) all.push({ s: Number(r.Session), ifc: r['Identifiant de la formation'], uai: r["Identifiant de l'établissement"], mention: r['Intitulé de la mention'], parcours: r['Intitulé du parcours'], raw: r, v: from2425(r) });

const inScope = (x) => SCOPE[norm(x.mention)];
const formations = new Map();
for (const x of all) {
  const niveau = inScope(x); if (!niveau) continue;
  const rw = x.raw, is23 = x.s === 2023;
  let f = formations.get(x.ifc);
  const base = is23
    ? { etab: rw.eta_nom, region: rw.acad_reg_lib, academie: rw.acad_lib, secteurId: Number(rw.secteur_disci), secteur: rw.secteur_disci_lib, alternance: rw.alternance === '1', modalite: rw.modalite_enseignement, lieux: rw.lieux_formation }
    : { etab: rw["Libellé de l'établissement"], region: rw['Région académique de l\'établissement'], academie: rw["Académie de l'établissement"], secteurId: Number(rw['Identifiant du secteur disciplinaire']), secteur: rw['Secteur disciplinaire'], alternance: rw.Alternance === '1', modalite: rw["Modalités d'enseignement"], lieux: rw['Lieu(x) de formation'] };
  if (!f) f = { ifc: x.ifc, uai: x.uai, mention: x.mention, parcours: x.parcours, niveau, ...base, sessions: {} };
  else Object.assign(f, base, { niveau }); // la session la plus récente (lue en dernier) fait foi pour les libellés
  f.sessions[x.s] = derive(x.v);
  formations.set(x.ifc, f);
}

// ---------- API : coordonnées + correspondance secteur -> discipline d'insertion ----------
const getJson = async (p) => { const r = await fetch(API + p); if (!r.ok) throw new Error(`${p} : HTTP ${r.status}`); return r.json(); };
const [apiFormations, apiSecteurs] = await Promise.all([getJson('/formations'), getJson('/secteurs-disciplinaires')]);
const geo = new Map(apiFormations.map((a) => [a.ifc, a]));
let sansPosition = 0;
const posParUai = new Map();
for (const f of formations.values()) {
  const a = geo.get(f.ifc);
  f.ville = a?.ville ?? null; f.dept = a?.dept ?? null; f.lat = a?.latitude ?? null; f.lon = a?.longitude ?? null;
  if (f.lat != null) posParUai.set(f.uai, { ville: f.ville, dept: f.dept, lat: f.lat, lon: f.lon });
}
for (const f of formations.values()) {
  if (f.lat == null && posParUai.has(f.uai)) { // repli : autre formation du même établissement (position approximative, signalée)
    Object.assign(f, posParUai.get(f.uai), { positionApprox: true });
  }
  if (f.lat == null) sansPosition++;
}
const insDiscBySecteur = Object.fromEntries(apiSecteurs.map((s) => [s.id, s.insDiscId]));
const secteursScope = [...new Set([...formations.values()].map((f) => f.secteurId))];
const discScope = [...new Set(secteursScope.map((id) => insDiscBySecteur[id]).filter(Boolean))].sort();
for (const f of formations.values()) f.insDisc = insDiscBySecteur[f.secteurId] ?? null;

// ---------- Repères nationaux (quantiles, formations avec >= 20 candidats PP) ----------
const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); if (!a.length) return null; const i = (a.length - 1) * p, lo = Math.floor(i); return Math.round((a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo)) * 10) / 10; };
const reperes = {};
for (const s of [2023, 2024, 2025]) {
  const rows = all.filter((x) => x.s === s).map((x) => derive(x.v)).filter((v) => v.candidatsPP >= 20);
  const dist = (key) => { const a = rows.map((v) => v[key]).filter((v) => v != null); return { n: a.length, p10: q(a, 0.1), p25: q(a, 0.25), p50: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9) }; };
  reperes[s] = { formationsTotal: all.filter((x) => x.s === s).length, tauxProposition: dist('tauxProposition'), candidatsParPlace: dist('candidatsParPlace') };
}

// ---------- Insertion professionnelle ----------
const ins = load('fr-esr-insertion_professionnelle-master_2010-2020.csv');
const insRows = ins.filter((r) => discScope.includes(r.code_de_la_discipline)).map((r) => ({
  annee: Number(r.annee), uai: r.numero_de_l_etablissement, etab: r.etablissement, disc: r.code_de_la_discipline, discipline: r.discipline,
  mois: Number(r.situation.replace(/\D/g, '')) || null, diplome: r.diplome,
  reponses: num(r.nombre_de_reponses), tauxReponse: num(r.taux_de_reponse),
  insertion: num(r.taux_dinsertion), emploi: num(r.taux_d_emploi), stables: num(r.emplois_stables),
  cadres: num(r.emplois_cadre_ou_professions_intermediaires), tempsPlein: num(r.emplois_a_temps_plein),
  salaireNet: num(r.salaire_net_median_des_emplois_a_temps_plein), salaireBrut: num(r.salaire_brut_annuel_estime),
  femmes: num(r.femmes), remarque: r.remarque || null,
}));
const uaiScope = new Set([...formations.values()].map((f) => f.uai));

// ---------- Écriture ----------
const list = [...formations.values()].sort((a, b) => a.etab.localeCompare(b.etab) || a.parcours.localeCompare(b.parcours));
const meta = {
  genere: new Date().toISOString().slice(0, 10),
  perimetre: SCOPE,
  sources: {
    candidatures: 'MESRI-SIES, Mon Master 2023 et 2024-2025 (data.gouv.fr), Licence Ouverte',
    insertion: 'MESRI-SIES, Insertion professionnelle des diplômés de master en universités, 2010-2020 (data.gouv.fr), Licence Ouverte',
    coordonnees: API,
  },
  controles: {
    formationsPerimetre: list.length,
    parSession: Object.fromEntries([2023, 2024, 2025].map((s) => [s, list.filter((f) => f.sessions[s]).length])),
    etablissements: uaiScope.size,
    sansPosition,
    disciplinesInsertion: discScope,
    lignesInsertion: insRows.length,
    etablissementsAvecInsertion: new Set(insRows.filter((r) => uaiScope.has(r.uai)).map((r) => r.uai)).size,
  },
};
mkdirSync(join(ROOT, 'data'), { recursive: true });
const out = (n, o) => writeFileSync(join(ROOT, 'data', n), JSON.stringify(o));
out('formations.json', list); out('insertion.json', insRows); out('reperes.json', reperes); out('meta.json', meta);
console.log(JSON.stringify(meta.controles, null, 1));
