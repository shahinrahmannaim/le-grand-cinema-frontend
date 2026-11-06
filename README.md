# Le Grand Cinéma — Frontend

Angular 22, TypeScript, composants standalone, SCSS et tests Vitest.
API : https://github.com/shahinrahmannaim/le-grand-cinema-backend

Ce premier incrément affiche les films et les séances depuis l'API. La réservation,
l'authentification, le billet et les écrans de gestion restent à réaliser.
Les films du profil demo sont fictifs. Les illustrations typographiques de remplacement
ne sont pas de véritables affiches de films.

## Démarrer dans VS Code

Utiliser Node 24 (au moins 24.15.0 pour Angular 22), puis :

```bash
npm ci
npm start
```

Ouvrir `http://localhost:4200`. Démarrer l'API sur 8080 et PostgreSQL avec les instructions du
dépôt backend. Le proxy local envoie `/api` vers `http://localhost:8080` ; aucun mot de passe
de base de données ne doit se trouver dans ce dépôt. Un échec API affiche un message et un
bouton Réessayer, pas une fausse liste vide.

## Tests et construction

```bash
npm test -- --watch=false --coverage
npm run format:check
npm run build
```

Les tests vérifient notamment la distinction erreur/état vide, le changement de date et
l'annulation d'une réponse obsolète. Couverture : `coverage/cinema-frontend/index.html`.
Le lockfile est versionné pour permettre `npm ci`. Le formatage Prettier fait partie de la CI ;
il ne constitue pas à lui seul une analyse complète de qualité ou de sécurité.

## Configuration publique et déploiement

Le prébuild génère `public/config.json` à partir de `API_BASE_URL`. La valeur par défaut `/api`
fonctionne avec le proxy de développement. Pour un déploiement séparé :

```bash
API_BASE_URL=https://your-backend.onrender.com/api npm run build
```

Render Static Site : commande `npm ci && npm run build`, dossier publié
`dist/cinema-frontend/browser`. Définir `API_BASE_URL` dans les variables de build et une règle
de réécriture `/*` vers `/index.html` pour le routage Angular. L'API doit autoriser exactement
l'origine du frontend via `ALLOWED_ORIGINS`. Toute valeur frontend est publique.

Avant les fonctionnalités privées, vérifier le transport des sessions sur les véritables
domaines séparés. Ne pas contourner une restriction de cookie en désactivant CSRF.
Le projet complet doit encore être déployé et vérifié ; cette configuration ne remplace pas
une URL de démonstration fonctionnelle.

## Branches

`main` pour les livraisons validées, `develop` pour l'intégration, `feature/usXX-description`
par histoire et `fix/description` pour les corrections. Chaque fonctionnalité doit avoir sa
pull request vers `develop`, avec critères, résultats de tests et lien Trello.
