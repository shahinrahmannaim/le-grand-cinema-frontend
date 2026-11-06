# Le Grand Cinéma — Frontend

Angular 22.2.6, TypeScript 6, Node 24 (minimum 24.15). Projet autonome, composants standalone, signaux, routes chargées à la demande, formulaires et API HTTP. Backend séparé : https://github.com/shahinrahmannaim/le-grand-cinema-backend.

## VS Code / démarrage local

Ouvrir ce dossier dans VS Code. Avec le backend démarré sur le port 8080 :

```bash
npm ci
npm start
```

Ouvrir http://localhost:4200. Le proxy Angular relaie `/api` vers `http://localhost:8080`. Aucune URL de base de données ni aucun mot de passe dans ce projet. Le frontend lit `/config.json`, généré avant `start` et `build` ; la valeur par défaut `/api` est correcte en local et en production avec le proxy fourni.

Parcours : catalogue → film → date → séance → sièges → connexion ou inscription → confirmation → billet imprimable. Après une connexion, revenir à la séance si la sélection a été perdue pendant le changement de page. Les places ne sont bloquées qu’à la confirmation ; une sélection n’est pas un verrou. Maximum 10 places. Paiement au cinéma.

Comptes de démonstration initialisés par le backend : `client@demo.cinema.test`, `staff@demo.cinema.test`, `admin@demo.cinema.test`. Utiliser la valeur de `DEMO_PASSWORD` choisie dans la configuration backend. Le menu affiche les fonctions autorisées ; le serveur contrôle chaque accès indépendamment.

## Fonctions

- Programme, dates en heure de Paris, état vide et relance après erreur.
- Plan par rangée : libre, sélectionné et occupé distingués par symboles et libellés ; boutons utilisables au clavier.
- Disponibilité SSE : rafraîchissement à la reconnexion et avertissement hors ligne.
- Confirmation conservant la même clé et le même contenu après une réponse perdue ; conflit explicite si une place est prise.
- Compte client, session HttpOnly côté serveur, jeton CSRF obtenu avant chaque modification.
- Billet privé, version mobile et feuille de style d’impression (PDF via le navigateur).
- Guichet, recherche paginée, occupation, comparaison de périodes et seuil d’alerte consultatif.
- Administration des films, publication et programmation avec protection des séances réservées.

## Vérification

```bash
npm run format:check
npm test -- --watch=false --coverage
npm run test:proxy
npm run build
```

Les tests unitaires portent notamment sur la gestion des erreurs, les droits de navigation, le contrat CSRF, les conflits et la répétition d’une confirmation après coupure. Le rapport global inclut `src/app/**/*.ts`, y compris les fichiers non couverts. Rapports dans `coverage/`. La compilation de production produit `dist/cinema-frontend/browser`.

Les tests DOM en jsdom ne prouvent pas le rendu réel à 360 px, l’impression ou le bon fonctionnement sur Safari. La recette navigateur doit être exécutée et conservée après installation / publication. Voir les limites et résultats dans [VALIDATION](docs/VALIDATION.md).

## Déploiement indépendant

Cloudflare Pages construit ce dépôt ; `functions/api/[[path]].js` relaie uniquement vers l’origine HTTPS fixe configurée dans `BACKEND_ORIGIN`. Les fichiers Java du backend ne sont pas présents sur le serveur frontend. Le proxy permet au navigateur d’utiliser une session de même origine tout en gardant deux déploiements. [Guide complet](docs/DEPLOYMENT.md).

Les workflows GitHub vérifient le code à chaque push / PR. Leur présence ne constitue pas une exécution distante. [Flux Git](docs/GIT-WORKFLOW.md). Après la première installation, les changements se récupèrent avec Git, sans recopier les fichiers.
