/**
 * Accès aux données : chargement (fetch), mémorisation en mémoire, gestion des erreurs.
 * C'est le seul module qui appelle `fetch` pour les données du site.
 */
import { DATA, API_URL } from '../config.js';
import { titleCase } from '../core/format.js';

const cache = new Map();

async function getJson(url, retries = 1) {
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    let err;
    for (let i = 0; i <= retries; i++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} pour ${url}`);
        return await r.json();
      } catch (e) { err = e; }
    }
    throw new Error(`Données indisponibles (${url}). ${err?.message ?? ''}`.trim());
  })();
  cache.set(url, p);
  p.catch(() => cache.delete(url)); // une erreur n'est pas mémorisée : un nouvel essai reste possible
  return p;
}

let villesFormatees = false;
export async function loadFormations() {
  const fs = await getJson(DATA.formations);
  if (!villesFormatees) { fs.forEach((f) => { if (f.ville) f.ville = titleCase(f.ville); }); villesFormatees = true; } // la source donne les villes en capitales
  return fs;
}
export const loadInsertion = () => getJson(DATA.insertion);
export const loadReperes = () => getJson(DATA.reperes);
export const loadMeta = () => getJson(DATA.meta);
export const loadRegions = () => getJson(DATA.regions);

/** Charge tout ce dont une page a besoin en une fois. */
export async function loadAll() {
  const [formations, insertion, reperes, meta] = await Promise.all([loadFormations(), loadInsertion(), loadReperes(), loadMeta()]);
  return { formations, insertion, reperes, meta, byIfc: new Map(formations.map((f) => [f.ifc, f])) };
}

/** Teste la disponibilité de l'API REST publique (affichée dans la page Méthode). */
export async function pingApi() {
  try { const r = await fetch(`${API_URL}/academies`, { cache: 'no-store' }); return r.ok ? { ok: true, n: (await r.json()).length } : { ok: false }; }
  catch { return { ok: false }; }
}
