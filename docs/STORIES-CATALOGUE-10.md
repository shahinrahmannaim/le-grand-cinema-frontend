# US01 / US02 / US10 / US11 — Catalogue de dix films et programmation

Branche prévue dans chaque dépôt : `feature/catalogue-ten-films`.
Statut : implémenté dans les correctifs livrés ; publication GitHub et déploiement de ces correctifs non confirmés.

## US01 / US02 — Dix titres distincts dans le catalogue de démonstration

En tant que visiteur, je veux consulter dix films distincts avec des séances futures afin de disposer d’un choix plus large de réservations.

Critères d’acceptation :

- La migration de démonstration V1003 ajoute sept titres fictifs publiés aux trois titres initiaux.
- Chaque nouveau film reçoit des séances à 10 h, 14 h et 18 h, en heure de Paris, sur les 30 jours suivant le début de la migration ; les créneaux déjà passés sont ignorés.
- Les nouvelles séances utilisent les salles 4 à 10 selon le même ordre que V1001 ; les créneaux occupés sont ignorés, sans annuler ni déplacer une séance existante.
- Les films, comptes, réservations et billets existants sont conservés. Aucune ancienne migration n’est modifiée.
- Le catalogue public conserve sa règle : film publié avec au moins une séance future non annulée. Il n’impose pas une limite de trois films.
- La cible de dix films est vérifiée après déploiement sur la base de démonstration ; des salles saturées ou l’expiration du programme initial peuvent nécessiter une programmation complémentaire.

Implémentation : backend `db/demo/V1003__expand_synthetic_catalog.sql`, activée uniquement avec le profil `demo`.
Preuve préparée : test d’intégration `DatabaseIT.demoCatalogueContainsTenDistinctPublishedFilmsAndSevenNewScheduledTitles` (base de test initialisée avec les migrations).
Limite : PostgreSQL indisponible dans l’environnement de préparation ; ce nouveau test et la migration n’y ont pas été exécutés. Exécuter la CI backend avant fusion.

## US10 / US11 — Programmer depuis la liste des films

En tant qu’administrateur, je veux démarrer la programmation d’une séance depuis un film afin de retrouver facilement le bon formulaire.

Critères d’acceptation implémentés :

- Chaque film possède un bouton « Programmer ».
- Le bouton ouvre la saisie d’une nouvelle séance avec ce film déjà sélectionné.
- Les valeurs d’une séance précédemment modifiée sont réinitialisées.
- Le titre du formulaire reçoit le focus et devient visible ; aucune séance n’est créée avant l’enregistrement explicite.
- Une notice explique la publication et la présence d’une séance future nécessaires à l’affichage public.
- Les contrôles backend existants sur les horaires et les séances réservées restent applicables.

Implémentation frontend : `admin-page.ts`.
Preuve exécutée : test ajouté dans `management-pages.spec.ts` ; 30 tests Angular réussis et build de production réussi lors de la préparation du correctif.
La recette de cette nouvelle commande dans le navigateur de production reste à effectuer.

## Recette après déploiement

1. Backend : profil `demo`, CI verte, migration V1003 appliquée sans erreur dans Render.
2. Catalogue : vérifier dix titres distincts et ouvrir les séances de chacun des sept nouveaux films.
3. Administration : démarrer une modification de séance, puis cliquer sur « Programmer » d’un autre film ; vérifier le film sélectionné, les champs de salle/date réinitialisés et le titre du formulaire focalisé.
4. Programmer une séance valide et vérifier sa présence dans le catalogue. Vérifier qu’un chevauchement dans la même salle est refusé.
5. Vérifier que les billets antérieurs sont toujours accessibles à leur propriétaire.

## Livraison

Créer une PR `feature/catalogue-ten-films` vers `develop` dans chacun des deux dépôts.
Après validation CI, fusionner puis créer les PR `develop` vers `main`.
Le backend et le frontend se déploient séparément. L’ajout des films dépend du backend ; le bouton dépend du frontend.
Ne pas appliquer V1003 manuellement dans Neon si la migration est livrée par Flyway.
