/** Configuration centrale : chemins, périmètre, libellés. Aucune donnée métier ici. */
export const DATA = { formations: 'data/formations.json', insertion: 'data/insertion.json', reperes: 'data/reperes.json', meta: 'data/meta.json', regions: 'assets/geo/franceRegions.json' };
export const API_URL = 'https://la-lab4ce.univ-lemans.fr/masters-stats/api/rest';
export const YEARS = [2023, 2024, 2025];
export const LAST_YEAR = 2025;

/** Mentions du périmètre (clé = libellé du fichier source) avec libellé accentué pour l'affichage. */
export const MENTIONS = {
  'CREATION NUMERIQUE': { label: 'Création numérique', niveau: 'coeur' },
  'ARTS, TECHNOLOGIES, CREATION': { label: 'Arts, technologies, création', niveau: 'coeur' },
  'AUDIOVISUEL, MEDIAS INTERACTIFS NUMERIQUES, JEUX': { label: 'Audiovisuel, médias interactifs numériques, jeux', niveau: 'coeur' },
  'HUMANITES NUMERIQUES': { label: 'Humanités numériques', niveau: 'coeur' },
  'DESIGN': { label: 'Design', niveau: 'voisin' },
  'CINEMA ET AUDIOVISUEL': { label: 'Cinéma et audiovisuel', niveau: 'voisin' },
};
export const mentionLabel = (m) => MENTIONS[m]?.label ?? m;

/** Disciplines d'insertion (fichier insertion 2010-2020) liées aux secteurs du périmètre. */
export const INS_DISC = {
  disc06: 'Lettres, langues, arts',
  disc10: 'Information et communication',
  disc16: 'Informatique',
};
export const INS_INDICATORS = {
  insertion: { label: "Taux d'insertion", unit: '%', def: "Part des diplômés en emploi, parmi ceux qui sont sur le marché du travail (hors poursuite d'études), à 18 ou 30 mois après le diplôme." },
  emploi: { label: "Taux d'emploi", unit: '%', def: "Part des diplômés en emploi, parmi l'ensemble des diplômés interrogés." },
  stables: { label: 'Emplois stables', unit: '%', def: "Part des emplois en CDI, fonctionnaire ou indépendant parmi les diplômés en emploi." },
  cadres: { label: 'Emplois cadres ou intermédiaires', unit: '%', def: 'Part des emplois de cadre ou de profession intermédiaire.' },
  salaireNet: { label: 'Salaire net médian (temps plein)', unit: '€', def: 'Salaire mensuel net médian des diplômés en emploi à temps plein, primes comprises.' },
};
