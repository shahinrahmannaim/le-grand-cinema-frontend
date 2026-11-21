# Tests et analyse de qualité

## Couverture reproductible

La CI lance les tests Angular avec couverture puis les tests du proxy avec le
rapport LCOV natif de Node.js. Les rapports importés par SonarQube sont :

- `coverage/cinema-frontend/lcov.info` : application Angular ;
- `coverage/proxy-lcov.info` : fonction de proxy Cloudflare.

Les artefacts `frontend-coverage` conservent les résultats de l’exécution. Les
fichiers de tests sont identifiés comme tests dans `sonar-project.properties`.
Le code applicatif n'est pas exclu de la couverture pour améliorer le score.

## Configuration distante

Dans les paramètres Actions du dépôt, définir le secret `SONAR_TOKEN` et les
variables `SONAR_ORGANIZATION` et `SONAR_PROJECT_KEY` avec les valeurs exactes du
projet frontend importé dans SonarQube Cloud. Ne pas réutiliser la clé du backend.
Désactiver l’analyse automatique dans SonarQube lors du passage à l’analyse CI,
car elle n’importe pas la couverture produite par ces tests.

Sur `main`, les PR internes ciblant `main` et une exécution manuelle sur `main`,
les paramètres et rapports sont obligatoires. Le scanner attend le Quality Gate
et fait échouer le workflow si celui-ci échoue. Les autres branches gardent les
tests et le build. Les PR provenant de forks ne reçoivent aucun jeton.

Les règles de protection GitHub doivent exiger le contrôle CI pour bloquer la
fusion. Le fichier YAML ne configure pas ces règles de protection.

Un workflow préparé n’est pas une analyse réussie : conserver l’URL de
l’exécution, le SHA analysé, le résultat du Quality Gate et les rapports générés.
Les résultats peuvent différer de l’ancienne capture selon les nouveaux tests,
les sources analysées et le commit concerné.

Référence : https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage
