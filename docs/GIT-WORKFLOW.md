# Git : état et publication

Les dépôts contiennent l’historique initial existant, les branches `main` et `develop`, puis des branches de fonctionnalité. Les branches de travail se suivent ; leur dernier état intègre le projet complet. Certains services partagés ont été introduits avec plusieurs méthodes avant le raccordement de chaque interface : une branche n’est donc pas la preuve d’une PR isolée déjà revue.

Les noms `feature/usXX-description` relient le code et les validations aux histoires. Les commits de cette préparation utilisent l’identité Codex, sans attribuer au candidat une revue indépendante. Les fichiers de CI sont prêts ; aucune exécution GitHub n’est inventée.

## Première publication depuis les archives

Les archives comprennent `.git` pour conserver les branches. Dans chaque dossier décompressé, vérifier :

```bash
git status
git remote -v
git branch
```

L’origin doit être le dépôt GitHub de ce projet. Après authentification GitHub sur votre ordinateur (par exemple avec GitHub CLI ou le gestionnaire d’identifiants), publier `develop` puis la branche finale :

```bash
git push origin develop
git push -u origin feature/us15-occupancy-alerts
```

Ouvrir une **vraie pull request** de `feature/us15-occupancy-alerts` vers `develop`, dans chacun des deux dépôts. Rédiger la description à partir du résultat réel : fonctionnalités livrées, liens Trello, tests, limites de recette. Laisser exécuter les checks et les examiner. Après validation, merger vers `develop`, puis créer / valider une PR `develop` → `main`. Configurer Render et Cloudflare pour déployer `main` uniquement. Les autres branches locales peuvent être publiées pour la traçabilité ; ne pas utiliser de force push sur un historique partagé.

Ne pas prétendre qu’une auto-revue est une revue indépendante. Le correcteur doit pouvoir consulter le véritable numéro de PR, la CI et les commits publics. Protéger `main` et `develop` avec les checks requis avant fusion.

## Mises à jour ultérieures

Après une fusion distante, revenir sur la branche souhaitée et récupérer les changements avec `git pull --ff-only`. Installer les nouvelles dépendances seulement si `pom.xml` / `package-lock.json` changent ; Flyway applique les nouvelles migrations au démarrage. Les changements suivants peuvent être proposés par branches et PR : aucune recopie régulière des fichiers n’est nécessaire.

## État externe à compléter

Cette préparation locale n’authentifie ni GitHub, ni Render, ni Cloudflare, ni Neon. Un fichier de configuration n’est pas une application déployée. L’URL publique, les identifiants de démo réellement initialisés, une recette navigateur et les liens de PR / CI doivent être ajoutés au dossier Studi après ces opérations.
