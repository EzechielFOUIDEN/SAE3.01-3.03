# Master Lab : notes pour continuer le développement

Site statique (JS ES modules, ECharts, pas de build). Voir [ADMIN.md](ADMIN.md) pour l'architecture et [README.md](README.md) pour le lancement.

## Règles du projet
- **Ne jamais inventer de donnée.** Absent = `null` dans les JSON, « n.d. » à l'écran. Jamais 0.
- **Définir avant d'afficher.** Tout indicateur passe par `js/domain/indicators.js` (définition + limites). Le « taux de proposition » n'est pas un taux d'accès.
- **Candidats comptés par formation** : ne pas les additionner entre formations. Parler de « candidatures » pour une somme.
- **Insertion = établissement × discipline, promotions ≤ 2020.** Ne jamais l'attribuer à une formation précise sans le dire.
- **2023 ≠ 2024-2025** (phases d'admission, colonnes). Les graphiques multi-années utilisent la phase principale et affichent `NOTE_ANNEES`.
- Chaque graphique : titre explicite, explication, unité, source, période, et version tableau (`chartPanel`).
- `fetch` uniquement dans `js/services/data.js`. Pas d'accès DOM dans `js/domain/`.
- Pas de données fictives, pas de dégradés décoratifs, pas de glassmorphism. Charte : bleu #0055cb, jaune #f4c430, anthracite #545454 ; League Spartan (titres), Open Sans (texte).

## Commandes
- `npm start` : serveur local sur le port 5500
- `node scripts/build-data.mjs "<dossier CSV>"` puis `node scripts/check-data.mjs`
- `node scripts/build-topo.mjs` : régénère le fond topographique de l'accueil

## Pièges connus
- Les libellés de mention contiennent des virgules : le filtre multi-mentions utilise `|` comme séparateur.
- Les formations d'outre-mer ne sont pas placées sur la carte (coordonnées réelles hors encart) : elles sont listées sous la carte.
- `echarts` est un global (script classique dans `index.html`), pas un import.
