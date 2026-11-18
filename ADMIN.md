# Documentation Administrateur

## 1. Objectif
Passation à une équipe de développement et de tierce maintenance applicative (TMA) de l'application web « Master Lab » : exploration des Masters publics en création numérique, de leurs candidatures (Mon Master) et de l'insertion professionnelle de leurs diplômés.

## 2. Présentation technique
- **Front-end** : HTML5, CSS3, JavaScript (modules ES natifs, sans framework, sans étape de build). Site statique : aucune base de données, aucun serveur applicatif.
- **Visualisation** : ECharts 5.5.1, fourni dans `vendor/echarts.min.js` (aucun CDN pour les scripts). Carte de France : `geo` + `registerMap` avec `assets/geo/franceRegions.json`. D3 n'est pas utilisé.
- **Polices** : League Spartan et Open Sans (Google Fonts). Sans connexion, les polices système prennent le relais.
- **Données** : fichiers JSON générés dans `data/` par un script Node à partir des sources officielles (voir section 3). Le navigateur ne lit que ces JSON.
- **Routage** : par hash (`#/formations`, `#/formation/<ifc>`), donc compatible avec n'importe quel hébergement statique.

### Arborescence
```
index.html            coquille : en-tête, <main id="app">, pied de page
css/                  tokens.css (charte), base.css, components.css, pages.css
js/main.js            point d'entrée : routes, en-tête, favoris/comparateur globaux
js/config.js          chemins, mentions du périmètre, disciplines d'insertion
js/core/              router, store (localStorage), dom, format
js/services/data.js   seul module qui appelle fetch (JSON locaux, test de l'API)
js/domain/            indicators (définitions), filters, insertion (logique métier)
js/viz/               charts (thème ECharts), candidatures, insertion, map
js/components/        filterBar, formationRow
js/pages/             une page = un module (home, formations, formation, carte, stats,
                      insertion, comparer, guide, methode)
scripts/              build-data.mjs, check-data.mjs, build-topo.mjs
data/                 JSON générés (versionnés)
assets/               favicon, fond topographique, GeoJSON des régions
vendor/               echarts.min.js
```

## 3. Données
| Source | Fichier / URL | Usage |
|---|---|---|
| Mon Master 2023 | `fr-esr-mon_master_2023.csv` (data.gouv.fr) | candidatures 2023 |
| Mon Master 2024-2025 | `fr-esr-mon_master_2024-2025.csv` (data.gouv.fr) | candidatures 2024 et 2025 |
| Insertion professionnelle | `fr-esr-insertion_professionnelle-master_2010-2020.csv` | insertion 18 et 30 mois |
| API Masters-stats | `https://la-lab4ce.univ-lemans.fr/masters-stats/api/rest` | coordonnées des formations, secteur → discipline d'insertion |

**Régénérer les données** (une fois par nouvelle campagne) :
```
node scripts/build-data.mjs "<dossier contenant les CSV>"
node scripts/check-data.mjs
```
Le dossier doit contenir `Données des candidatures-20261118/fr-esr-mon_master_2023.csv`, `Données des candidatures-20261118/fr-esr-mon_master_2024-2025.csv` et `fr-esr-insertion_professionnelle-master_2010-2020.csv`. Le script interroge l'API (accès internet requis) ; Node 18+ suffit (testé avec Node 24).

### Limites à connaître
- Les candidats sont comptés **par formation** ; ne jamais additionner des candidats de formations différentes. Les parts d'origine portent sur des candidatures.
- 2023 : une seule phase d'admission, pas de BUT séparé. 2024-2025 : phases principale et complémentaire. Les graphiques multi-années utilisent la phase principale et l'indiquent.
- Le **taux de proposition** est calculé par le site (propositions ÷ candidats de la phase principale). Ce n'est pas un taux d'accès officiel. Pour l'alternance, les propositions dépendent des contrats d'apprentissage : taux naturellement bas.
- L'**insertion** est publiée par établissement × discipline (jamais par formation), pour des promotions jusqu'en 2020. Les valeurs « ns » sont stockées en `null` et affichées « n.d. » ou omises, jamais à zéro.
- Non disponibles dans les données ouvertes : programmes, frais, dates limites, débouchés par formation.
- Le périmètre ne contient aucune formation en Pays de la Loire : aucune mention retenue n'y est ouverte à la candidature dans les fichiers sources.

## 4. Déploiement
1. Cloner le dépôt : `git clone https://github.com/EzechielFOUIDEN/SAE3.01-3.03.git`
2. Lancer un serveur HTTP à la racine : `npm start` (équivaut à `npx http-server -c-1 -p 5500 .`) ou l'extension *Live Server* de VSCode.
   > Ne pas ouvrir `index.html` en double-cliquant : le protocole `file://` bloque les modules ES et `fetch`.
3. Ouvrir `http://localhost:5500`.
4. Production : copier le dépôt (sans `node_modules/` ni `scripts/`) sur un hébergement statique. Aucun `npm install` n'est nécessaire pour faire tourner le site ; `npm install` ne sert qu'à récupérer ECharts si l'on veut le mettre à jour (`vendor/echarts.min.js` provient de `node_modules/echarts/dist/`).

## 5. Configuration
Tout est dans `js/config.js` et `scripts/build-data.mjs` :
- **Périmètre « création numérique »** : constante `SCOPE` de `build-data.mjs` (liste de mentions nationales, « coeur » ou « voisin ») et `MENTIONS` de `config.js` (libellés affichés). Il n'existe pas de secteur disciplinaire unique : le périmètre est une liste de mentions. Mentions du cœur : Création numérique ; Arts, technologies, création ; Audiovisuel, médias interactifs numériques, jeux ; Humanités numériques. Voisines (optionnelles) : Design ; Cinéma et audiovisuel.
- **Disciplines d'insertion** : `INS_DISC` (disc06 Lettres-langues-arts, disc10 Information-communication, disc16 Informatique), déduites des secteurs du périmètre via `insDiscId` de l'API.
- **URL de l'API** : `API_URL` dans `config.js` (utilisée par le test de disponibilité de la page Méthode et par `build-data.mjs`).
- **Session de référence** : `LAST_YEAR` dans `config.js`.

## 6. Conception (composants)
- **Data Loader (`services/data.js`)** : seul module qui appelle `fetch`. Mise en cache en mémoire, une nouvelle tentative, message d'erreur explicite. Les erreurs ne sont pas mémorisées.
- **Store (`core/store.js`)** : favoris et comparateur dans `localStorage`, avec repli en mémoire si le stockage est indisponible.
- **Domain** : définitions d'indicateurs, filtres et calculs d'insertion, sans accès DOM.
- **Viz** : chaque fichier expose des fonctions qui prennent un élément et des données. `charts.js` porte le thème, le redimensionnement et la destruction des graphiques.
- **Pages** : chaque module exporte une fonction qui retourne `{ title, html, mount, destroy }`. Le routeur injecte le HTML, appelle `mount`, puis `destroy` au changement de page.
- **Accessibilité** : navigation clavier, focus visible, lien d'évitement, `aria-live` sur les résultats, version tableau de chaque graphique (« Voir les données du graphique »).

## 7. Roadmap
- **Sprint 2 (09/11 - 20/11)** : prototype v1 fonctionnel sur données réelles, documentation administrateur v1, spécification des visualisations v1.
- **Sprint 3 (07/12 - 18/12)** : version 2 (tests utilisateurs, affinage des visualisations, retours).
- **Sprint 4 (11/01 - 15/01)** : version finale et archive du code sur Umtice. Soutenances la semaine du 18/01.
- Pistes : élargir le périmètre (autres mentions), carte régionale au choix de l'indicateur, export des comparaisons.

## 8. Suivi des bugs
- **Statut actuel** : aucun bug bloquant connu à la date de cette version. Contrôle des données : `node scripts/check-data.mjs`.
- Les bugs sont suivis dans les *issues* du dépôt GitHub.
