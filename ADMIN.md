# Documentation Administrateur

## 1. Objectif
Passation à une équipe de dev et tierce maintenance (TMA) de l'application web de visualisation de données "Master Lab" (Masters en Création numérique).

## 2. Présentation technique
- **Front-end** : HTML5, CSS3, JS.
- **Réseau** : Fetch API (requêtes REST).
- **Data** : API REST OpenData Mon Master (formations, capacités, candidatures).
- **Visualisation** : ECharts (taux d'accès) + carte interactive `[À COMPLÉTER : librairie]`.
- **Arborescence** :
  - `/docs/` : documentations projet.
  - `/src/api/network.js` : composant réseau (Data Loader).
  - `/src/main.js` : point d'entrée.

## 3. Guide de déploiement
1. Cloner le dépôt : `git clone [https://github.com/EzechielFOUIDEN/SAE3.01-3.03.git]`
2. Lancer un serveur HTTP à la racine du projet (ex: *Live Server* VSCode, `npx http-server`).
   > ⚠️ **Important** : Ne pas ouvrir `index.html` en double-cliquant (protocole `file://` interdit par les ESModules, risque d'erreur CORS).
3. Ouvrir l'URL locale fournie par le serveur (ex: `http://localhost:5500`).
4. Production : site statique, copier le dépôt sur un serveur HTTP (aucune base de données, aucun service).

## 4. Configuration possible
Les paramètres globaux sont hardcodés dans les modules :
- **URL API** : variable `BASE_URL` au début de `src/api/network.js`.
- **Ciblage Création numérique** : secteur disciplinaire passé en paramètre dans `main.js` lors des appels API (valeur : `[À COMPLÉTER]`).

## 5. Conception (Composants)
- **`network.js`** : responsabilité unique = faire les requêtes HTTP (GET) et parser le JSON.
- **Cache local + filtrage** : le filtrage met à jour la liste, la carte, les graphiques et le comparateur à partir des données en cache.
- **`main.js`** : coordonne les appels API et l'envoi des données aux composants (carte, graphique ECharts, comparateur, quiz).

## 6. Roadmap (Sprint 2 & 3)
`[À COMPLÉTER]` Carte interactive, fiche formation et infographies, comparateur, quiz de matching, tests utilisateurs.

## 7. Bugs tracking
- **Statut actuel** : `[À COMPLÉTER : ex. Aucun bug réseau connu.]`
