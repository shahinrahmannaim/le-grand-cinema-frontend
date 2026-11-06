# Architecture, modèle et choix techniques

## Organisation

Deux applications / deux dépôts / deux déploiements. Angular sert le catalogue et les interfaces client, guichet et administration. Spring Boot expose l’API métier. PostgreSQL stocke les comptes, sessions, salles, sièges, films, séances et réservations. En local, Angular CLI relaie `/api`. En production, une Pages Function remplit ce rôle ; elle ne contient aucune logique de réservation.

Le navigateur utilise une session de première partie `CINEMA_SESSION`, HttpOnly, SameSite=Lax, Secure en production, portée `/api`. Les attributs de session sont stockés par Spring Session JDBC. La connexion renouvelle l’identifiant de session et le jeton CSRF ; la déconnexion invalide la session. Une durée d’inactivité de 30 minutes limite sa persistance. Aucun JWT ni mot de passe dans localStorage.

## Modèle relationnel

| Table | Rôle et contraintes |
|---|---|
| `app_user` | E-mail normalisé unique, hash BCrypt, rôle CLIENT / STAFF / ADMIN |
| `room` | Capacité et remise en état ; dix salles / 1 700 places |
| `seat` | Siège lié à une salle, unicité salle / rangée / numéro |
| `film` | Titre, synopsis, durée, genre, affiche HTTPS, publication |
| `screening` | Film + salle + début / fin / fin de remise en état / prix ; exclusion SQL des chevauchements actifs |
| `reservation` | Client / acteur / canal, référence, total en centimes, état et clé idempotente unique par acteur |
| `reservation_seat` | Attribution d’un siège à une réservation ; clés étrangères composites garantissant la même salle et la même séance ; index unique partiel des attributions actives |
| `SPRING_SESSION`, `SPRING_SESSION_ATTRIBUTES` | Sessions Spring persistantes, expiration et attributs sérialisés côté serveur |

La géométrie de dix sièges par rangée et le temps de remise en état sont des hypothèses de démonstration, à valider avec le cinéma. Les capacités reproduisent celles du projet : 2 × 300, 4 × 180, 2 × 120, 2 × 70.

## Confirmation atomique

1. Le serveur identifie l’acteur via sa session et valide la requête (1 à 10 identifiants de sièges distincts).
2. Une transaction verrouille la ligne de l’acteur, puis retrouve une éventuelle confirmation avec la même clé. Le hash SHA-256 porte sur la séance, le canal et les sièges triés ; une demande différente avec la même clé produit 409.
3. Un verrou partagé sur la séance protège contre une modification concurrente de son horaire / prix. Le serveur vérifie publication, état, date et appartenance des sièges à la salle. Le prix vient de la base.
4. Réservation et attributions sont écrites dans une transaction. L’index unique arbitre la concurrence. Toute erreur annule toutes les écritures de cette demande.
5. Après commit seulement, un événement SSE annonce de recharger le plan. Il ne contient ni identité ni référence de billet.

La sélection locale ne réserve aucune place. Les transactions ne restent jamais ouvertes pendant le choix ou le paiement. Le guichet appelle le même service et utilise le même stock.

## Programmation et historique

La fin est calculée à partir de la durée du film. `occupied_until` ajoute la remise en état de la salle. Une contrainte PostgreSQL `EXCLUDE USING gist` interdit les plages actives qui se recoupent. L’administration verrouille la séance avant vérification : une réservation confirmée interdit sa modification et son annulation. Un film déjà programmé conserve son contenu ; sa publication reste modifiable pour préserver les informations des billets. Créer une nouvelle fiche pour corriger un film déjà programmé.

## Choix des frameworks — appréciation qualitative

Aucun benchmark comparatif n’a été réalisé. Les observations ci-dessous sont des critères de choix, pas des chiffres de performance.

| Option | Performance et évolutivité | Coût / prise en main | Décision pour ce projet |
|---|---|---|---|
| Angular | Routage différé ; build optimisé ; forte structure pour plusieurs espaces | TypeScript, formulaires et HTTP intégrés ; apprentissage initial plus large | Retenu : cohérent avec le choix du développeur et les écrans métier |
| React | Découpage en composants ; performances dépendant du code et de l’écosystème retenu | Souple, mais choix complémentaires pour routage / formulaires | Possible, aucun gain mesuré justifiant un changement ici |
| Vue | Composants et routage adaptés à une SPA ; performances dépendant du cas réel | Approche progressive ; outillage supplémentaire pour le besoin complet | Possible, non retenu pour conserver un seul socle maîtrisé |
| Spring Boot + JDBC | Transactions explicites, pool borné, contraintes SQL ; mise à l’échelle possible avec sessions partagées | Plus de mémoire qu’un simple site statique ; sécurité, validation et migrations structurées | Retenu : cohérent avec le parcours Java et les invariants de réservation |
| Node.js + framework HTTP | E/S asynchrones ; transactions toujours nécessaires en base | Un seul langage possible côté application, mais règles et sécurité à concevoir aussi | Aucun avantage mesuré imposant de quitter Java |

Le coût dépend surtout de l’hébergement, des quotas et du travail de maintenance. Les licences des frameworks ne suffisent pas à démontrer un coût global inférieur. Les latences et la capacité doivent être mesurées sur l’environnement déployé avant toute promesse de charge.

## Sécurité et limites

Validation des entrées, paramètres SQL liés, rôles serveur, billets accessibles uniquement au propriétaire ou au personnel, CSRF actif, CORS à origine exacte, cookies HttpOnly, protection de fixation de session, mots de passe BCrypt (coût 12), erreurs métier sans trace SQL exposée. Une limitation locale des tentatives de connexion / inscription réduit les abus simples ; elle ne remplace pas une protection distribuée en bordure. Les en-têtes de cache des réponses privées interdisent le stockage partagé.

Une seule instance Spring Boot diffuse actuellement les notifications SSE. Avant plusieurs instances, ajouter un bus partagé ; les sessions et contraintes SQL sont déjà centralisées. Le plan peut être périmé malgré SSE : seule la confirmation serveur fait autorité. Aucune haute disponibilité, restauration de sauvegarde ou performance de festival n’est revendiquée sans preuve.

Les réservations restent confirmées jusqu’à validation de règles d’annulation / retrait / non-présentation. L’application ne prend aucun paiement en ligne et ne prétend pas garantir l’objectif métier de +30 % de fréquentation.
