/** Filtrage et tri des formations. L'état des filtres vit dans l'adresse (#/formations?q=…) pour être partageable. */
import { norm } from '../core/format.js';
import { LAST_YEAR } from '../config.js';
import { favoris } from '../core/store.js';

export const DEFAULTS = { q: '', region: '', etab: '', mention: '', modalite: '', alt: '', perimetre: 'coeur', annee: String(LAST_YEAR), tri: 'nom', fav: '', tauxMax: '', tauxMin: '' };

const haystack = (f) => norm([f.mention, f.parcours, f.etab, f.ville, f.region, f.secteur].join(' '));
const cacheHay = new WeakMap();
const hay = (f) => cacheHay.get(f) ?? (cacheHay.set(f, haystack(f)), cacheHay.get(f));

export function applyFilters(formations, q) {
  const f = { ...DEFAULTS, ...q };
  const words = norm(f.q).split(/\s+/).filter(Boolean);
  const y = Number(f.annee);
  const fav = f.fav ? new Set(favoris()) : null;
  const out = formations.filter((x) => {
    if (f.perimetre === 'coeur' && !f.mention && x.niveau !== 'coeur') return false;
    const s = x.sessions[y]; if (!s) return false; // la formation n'existe pas sur la session choisie
    if (words.length && !words.every((w) => hay(x).includes(w))) return false;
    if (f.region && x.region !== f.region) return false;
    if (f.etab && x.uai !== f.etab) return false;
    if (f.mention && !f.mention.split('|').includes(x.mention)) return false;
    if (f.alt === '1' && !x.alternance) return false;
    if (f.alt === '0' && x.alternance) return false;
    if (f.modalite && !String(x.modalite ?? '').includes(f.modalite)) return false;
    if (f.tauxMin !== '' && !(s.tauxProposition != null && s.tauxProposition >= Number(f.tauxMin))) return false;
    if (f.tauxMax !== '' && !(s.tauxProposition != null && s.tauxProposition <= Number(f.tauxMax))) return false;
    if (fav && !fav.has(x.ifc)) return false;
    return true;
  });
  const by = {
    nom: (a, b) => a.parcours.localeCompare(b.parcours, 'fr'),
    etab: (a, b) => a.etab.localeCompare(b.etab, 'fr') || a.parcours.localeCompare(b.parcours, 'fr'),
    demande: (a, b) => (b.sessions[y].candidatsParPlace ?? -1) - (a.sessions[y].candidatsParPlace ?? -1),
    proposition: (a, b) => (b.sessions[y].tauxProposition ?? -1) - (a.sessions[y].tauxProposition ?? -1),
    places: (a, b) => (b.sessions[y].places ?? -1) - (a.sessions[y].places ?? -1),
  }[f.tri] ?? (() => 0);
  return out.sort(by);
}

/** Valeurs distinctes d'un champ, triées, pour remplir les listes déroulantes. */
export const distinct = (formations, get) => [...new Map(formations.map((f) => [get(f)[0], get(f)[1]])).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), 'fr'));
