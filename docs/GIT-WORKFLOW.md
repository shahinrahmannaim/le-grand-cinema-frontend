# Workflow Git

## Branches et intégration

`main` porte la version de production et `develop` sert à intégrer les changements.
Les développements utilisent `feature/<sujet>`, les corrections `fix/<sujet>` et
les changements documentaires `docs/<sujet>`.

Un changement est proposé par pull request vers `develop`, puis promu vers `main`
par une autre pull request. Les tests doivent passer avant fusion. La CI exécute
les tests sur ces PR ; SonarQube analyse `main` et les PR internes ciblant `main`.
Le déploiement de production suit `main`.

## Historique publié

Les fonctionnalités US01 à US15 ont été intégrées dans un historique initial
regroupé. Il ne comporte pas quinze pull requests indépendantes. Les noms de
branches locales de préparation ne constituent pas une preuve de branches
publiées ou de revues séparées pour chacune des histoires.

Les branches de livraison publiées comprennent `feature/us15-occupancy-alerts`, `fix/production-css` et `feature/catalogue-ten-films`.
Les PR et commits GitHub constituent la référence pour les intégrations réelles.
`docs/STORIES.md` relie les histoires aux fichiers et aux tests, sans présenter
une branche locale comme une preuve de développement distant.

L'historique contient des commits réalisés avec l'assistance de Codex et portant
cet auteur. Cette attribution est conservée. Une correction assistée reste à
comprendre, à vérifier et à présenter comme telle ; elle ne constitue pas une
revue indépendante ni une preuve de développement entièrement personnel.

## Vérifications

Avant une correction, vérifier `git status` et partir d'une base à jour. Ne pas
écraser de modifications locales. Après une fusion, utiliser
`git pull --ff-only` sur la branche concernée.

La protection de `main` et `develop` se configure dans GitHub. Le YAML de CI ne
crée pas ces règles. Vérifier que les contrôles requis sont effectivement
bloquants et conserver les liens des exécutions correspondant au commit livré.
