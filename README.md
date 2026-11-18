# Master Lab

Explorer les **Masters publics en création numérique** : formations, candidatures Mon Master, insertion professionnelle. Projet de la SAÉ 3.01/3.03 (BUT MMI Laval).

Tout ce qui est affiché vient de données ouvertes officielles (MESRI-SIES, Licence Ouverte). Une valeur absente s'affiche « n.d. » : rien n'est inventé.

## Lancer le site
```bash
npm start
```
Puis ouvrir <http://localhost:5500>. Aucune installation de dépendance n'est nécessaire (ECharts est dans `vendor/`). Ne pas ouvrir `index.html` directement (`file://` bloque les modules ES).

## Pages
| Page | Rôle |
|---|---|
| Accueil | promesse, chiffres du périmètre, entrées |
| Formations | liste filtrable (région, établissement, mention, alternance, session) |
| Fiche formation | admission, évolution 2023-2025, origine des candidats, position nationale, insertion de la discipline |
| Carte | bulles par ville, régions teintées, panneau de détail |
| Candidatures | demande × sélectivité, classement, évolution, origine |
| Insertion | indicateurs à 18 et 30 mois par discipline, disponibilité des données, classement |
| Comparateur | jusqu'à 3 formations côte à côte |
| Guide | 4 questions traduites en filtres visibles (aucun score caché) |
| Méthode | sources, définitions, limites |

## Données
Les JSON de `data/` sont générés par `scripts/build-data.mjs` à partir des CSV officiels et de l'API Masters-stats.
```bash
node scripts/build-data.mjs "<dossier des CSV>"   # régénérer
node scripts/check-data.mjs                        # contrôler l'intégrité
```
Détail des sources, des définitions et des limites : [ADMIN.md](ADMIN.md) et la page « Méthode » du site.

## Structure
`js/core` (routeur, store) · `js/services` (accès aux données) · `js/domain` (logique métier) · `js/viz` (graphiques ECharts) · `js/components` · `js/pages` · `css/` (tokens de la charte, base, composants, pages).

## Équipe
Loïs Hesnault, Anton Kergourlay, Ezechiel Fouiden Oster, William Beslon, Nathan Vacher.
