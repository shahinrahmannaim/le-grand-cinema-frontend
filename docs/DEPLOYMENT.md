# Déploiements indépendants, session de même origine

Le frontend et le backend restent dans deux dépôts, avec deux builds et deux déploiements. En production, le navigateur appelle `/api` sur le domaine du frontend. Une petite Pages Function relaie cette API vers Spring Boot. Le serveur Angular n’embarque aucun fichier Java. Le proxy permet de conserver les cookies de session comme cookies de première partie et évite de dépendre des cookies tiers.

## 1. PostgreSQL : Neon

Créer un projet PostgreSQL 17. Conserver les identifiants dans le gestionnaire de variables de Render, jamais dans Git. Pour ce projet avec sessions JDBC et petit pool Hikari, utiliser l’URL **directe** du serveur (pas le suffixe `-pooler`). Convertir l’URL en JDBC : `jdbc:postgresql://HOTE/neondb?sslmode=require`. Mettre le nom et le mot de passe dans `DB_USERNAME` et `DB_PASSWORD`. Flyway installe les tables, index, `btree_gist` et les salles au premier démarrage. Vérifier que le compte de migration est autorisé à créer cette extension.

## 2. Backend : Render Web Service Docker

Relier le dépôt backend. Le fichier `render.yaml` décrit le service ; son application effective nécessite le compte Render. Branche de production `main`, Dockerfile racine, health check `/actuator/health`.

Variables :

| Variable | Valeur |
|---|---|
| `DB_URL` | URL JDBC directe Neon avec `sslmode=require` |
| `DB_USERNAME`, `DB_PASSWORD` | Identifiants Neon |
| `SPRING_PROFILES_ACTIVE` | `demo` pour la démonstration seulement |
| `DEMO_PASSWORD` | Mot de passe de démo distinct, 12 caractères minimum, 72 octets maximum |
| `SECURE_COOKIES` | `true` |
| `ALLOWED_ORIGINS` | URL exacte du frontend, par exemple `https://le-grand-cinema.pages.dev` |

`PORT` est fourni par Render. Vérifier `/actuator/health`, puis l’API publique catalogue. Les sessions résident en PostgreSQL ; un redémarrage applicatif ne les efface pas. Elles expirent après 30 minutes d’inactivité. Le mot de passe de démonstration initialise les comptes au premier démarrage ; changer uniquement la variable ne modifie pas un compte déjà existant. Pour renouveler ces comptes de démo, réinitialiser leur hash BCrypt par une procédure d’administration contrôlée, ou recréer une base **exclusivement de démonstration**.

## 3. Frontend : Cloudflare Pages + Functions

Relier le dépôt frontend à Pages. Commande `npm ci && npm run build`, répertoire de sortie `dist/cinema-frontend/browser`, `NODE_VERSION=24`, `API_BASE_URL=/api`. Le dossier `functions/` à la racine du dépôt est déployé avec Pages ; il n’est pas copié manuellement dans `dist`.

Ajouter `BACKEND_ORIGIN=https://NOM-DU-BACKEND.onrender.com` aux variables **serveur** de Pages Functions, sans `/api`. Le proxy ne peut contacter que cet hôte HTTPS fixe, conserve les cookies, le jeton CSRF et le flux SSE, interdit la mise en cache et ne suit pas les redirections. Aucun mot de passe DB ne doit se trouver dans Pages ni dans `config.json`.

Sans fichier `404.html`, Pages traite l’application comme une SPA. `_routes.json` limite l’exécution des Functions à `/api/*`. `_headers` protège les fichiers statiques. Désactiver les preview deployments publics sur les branches de travail, ou les traiter comme une configuration isolée avec base de démo distincte ; ne pas élargir CORS à `*`.

## 4. Recette après publication

Créer un compte client, se connecter, choisir un film / une séance / deux sièges, confirmer, retrouver le billet après actualisation, imprimer. Ouvrir un second navigateur : la même place doit être occupée, et le billet de l’autre client inaccessible. Tester le mode guichet, l’ajout d’un film / d’une séance, le conflit d’horaires et le blocage d’une séance déjà réservée. Fermer puis rouvrir le flux : le plan est rechargé. Se déconnecter : `/api/auth/me` doit retourner 401.

Comptes de démo : `admin@demo.cinema.test`, `staff@demo.cinema.test`, `client@demo.cinema.test`. Mot de passe choisi dans `DEMO_PASSWORD`, à transmettre au correcteur par le canal prévu par Studi. Il n’est pas fixé dans le code. Aucun paiement réel.

## Limites explicites des offres gratuites

Render Free peut se mettre en veille et impose des quotas ; Neon peut suspendre le calcul ; Pages Functions relève des limites Workers. Le premier accès peut donc prendre du temps. Les conditions des offres doivent être revérifiées lors de la création des comptes. Les sessions JDBC et le heartbeat SSE peuvent conserver la base active ; surveiller les quotas. Ce montage convient à une démonstration, pas à une garantie de haute disponibilité pendant un festival.

Références officielles consultées le 6 novembre 2026 :
- https://render.com/docs/free
- https://neon.com/docs/introduction/scale-to-zero
- https://developers.cloudflare.com/pages/functions/get-started/
- https://developers.cloudflare.com/pages/functions/api-reference/
- https://developers.cloudflare.com/pages/configuration/serving-pages/

Le proxy SSE diffuse les notifications de l’unique instance Spring Boot. Avant de multiplier les instances, ajouter un bus partagé (par exemple PostgreSQL LISTEN/NOTIFY avec gestion de reconnexion) et une limitation de débit distribuée. Les contraintes SQL conservent l’autorité sur les places même si une notification est perdue.

Une base initialisée avec le profil `demo` conserve sa migration de données V1001 : continuer à utiliser ce profil pour cette base. Pour un environnement réel sans données fictives, créer une base séparée et démarrer sans ce profil ; ne pas transformer une base de démonstration en production par simple changement de variable.
