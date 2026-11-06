# Validation exécutée — 6 novembre 2026

## Résultats locaux observés

| Contrôle | Résultat |
|---|---|
| Maven `-Pdatabase-tests clean verify` | Build réussi |
| JUnit unitaires | 6 tests réussis, 0 échec / erreur / ignoré |
| Intégration PostgreSQL et HTTP | 23 tests réussis, 0 échec / erreur / ignoré |
| Checkstyle | 0 violation des règles configurées |
| Couverture JaCoCo globale des lignes | 92.1 % (478 couvertes / 519) |
| Couverture JaCoCo des branches | 73.39 % |
| Angular / Vitest | 27 tests réussis dans 8 fichiers |
| Couverture frontend globale des lignes TypeScript | 83.15 % (553 / 665) |
| Couverture frontend des branches | 64.36 % |
| Proxy de déploiement (Node test) | 3 tests réussis |
| Prettier | Contrôle réussi |
| Build Angular production | Réussi ; routes chargées à la demande, budget initial respecté |
| Contrat OpenAPI 3.0.3 | 26 opérations, validation de structure réussie |

Les chiffres frontend incluent explicitement `src/app/**/*.ts` et les fichiers non couverts. Ils ne doivent pas être confondus avec une couverture de toutes les branches métier, du CSS ou de tous les navigateurs. JaCoCo couvre le code Java compilé et exercé par les deux suites. Les pourcentages ne sont pas une preuve d’absence de défaut.

## Invariants vérifiés

- 20 acteurs concurrents demandent le même siège : **1 réussite, 19 conflits**, une réservation et une attribution en base.
- Une demande de plusieurs places dont une déjà prise est annulée en entier : aucune attribution partielle de la demande perdante.
- Une répétition avec la même clé et les mêmes sièges, même réordonnés, retrouve le même billet ; un contenu différent est refusé.
- Session persistante JDBC, CSRF obligatoire, renouvellement à la connexion, déconnexion, restriction CLIENT / STAFF / ADMIN.
- Billet lisible par le propriétaire / personnel, refus 404 pour un autre client.
- Guichet et Web utilisent le même stock.
- Flux SSE HTTP réel : événement initial puis notification après confirmation validée ; fermeture des flux dans la recette automatisée.
- Chevauchements de créneaux et modifications / annulations d’une séance réservée refusés.
- Occupation avec zéro place puis deux places sur dix ; filtre au seuil exact ; aucune modification automatique du programme.
- Périodes cohérentes, jour Paris conservé, week-end identifié ; journées de changement d’heure de 23 / 25 heures.
- Réponse perdue simulée côté frontend : clé et contenu conservés pour la nouvelle tentative. La reproduction contrôlée du défaut est décrite dans BUG-001.

## Conditions de ces tests

Java 21.0.13, Spring Boot 4.1.2, PostgreSQL natif 17.6, Node 24.22.1, Angular 22.2.6. Les commandes Maven de ce runtime utilisent un JDK et des réglages réseau temporaires ; la dernière répétition a utilisé le cache Maven hors ligne. Le PostgreSQL de test est réellement lancé ; il ne s’agit pas d’une base H2 ni d’un mock de transaction. La CI fournie utilise le service PostgreSQL 17 de GitHub Actions.

## Non exécuté ou à confirmer

- Docker et Docker Compose ne sont pas disponibles dans ce runtime : Dockerfile / Compose préparés, mais démarrage conteneur à confirmer sur le poste et l’hébergeur.
- Le lancement de Chromium est bloqué par la restriction des sockets Unix de l’environnement. Les tests DOM utilisent jsdom ; ils ne constituent pas une recette visuelle. Vérifier 360 px, clavier, impression PDF et navigateurs réels selon ACCEPTANCE.
- Aucune connexion authentifiée à GitHub / aux hébergeurs n’est disponible ici. Aucun push, numéro de PR, CI distante réussie ni URL publique n’est inventé.
- Le scénario k6 est fourni mais non exécuté. Les seuils sont des cibles proposées. Aucune disponibilité de festival, audit de sécurité complet ou restauration de sauvegarde n’est démontrée.
- Les règles métier encore ouvertes et la recette du cinéma nécessitent une validation humaine.

Le fichier `docs/validation/results.json` conserve les compteurs extraits des rapports. Pour reproduire les rapports détaillés, suivre les README. Après publication, compléter ce document avec les liens réels et la recette sur l’environnement public.
