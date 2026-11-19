# Traçabilité du code — US01 à US15

Les quinze histoires sont raccordées dans le code livré. « Implémenté » ne signifie pas « validé par le cinéma » ni « publié ». La recette navigateur, la validation métier et les preuves cloud restent distinctes. Les comptes, films et séances de démonstration sont fictifs.

Les services partagés sont parfois introduits avant le raccordement d’une histoire dépendante. Les branches ci-dessous tracent soit le raccordement, soit sa validation dédiée ; elles ne prétendent pas représenter quinze PR indépendantes déjà acceptées. Les branches se trouvent dans le dépôt concerné par leur changement, pas nécessairement dans les deux dépôts.

| Histoire | Comportement livré | Code principal (backend ; frontend) | Preuve automatisée / limite | Branche locale |
|---|---|---|---|---|
| US01 | Films publiés, détails, états vide / erreur | catalog/Catalog* ; catalog/catalog-page.* | CatalogServiceTest, CatalogHttpIT, catalogue Vitest | feature/us01-film-catalog |
| US02 | Séances futures, date Paris, prix annoncé | catalog/DateWindow ; CatalogRepository | DateWindowTest, CatalogHttpIT, catalogue Vitest | feature/us02-screenings |
| US03 | Plan, occupation, SSE et reconnexion | booking/SeatEvents ; BookingService.plan ; reservation-page | SecurityHttpIT (flux réel), réservation Vitest | feature/us03-seat-plan |
| US04 | Sélection multiple, clavier, résumé, total | reservation-page ; raccordement catalogue | réservation Vitest, recette mobile à réaliser | feature/us04-seat-selection |
| US05 | Inscription, connexion, session, rôles, CSRF | auth/* ; config/SecurityConfig ; core/auth ; login-page | LoginThrottleTest, SecurityHttpIT, auth / API Vitest | feature/us05-authentication |
| US06 | Confirmation atomique et idempotente | BookingService.confirm ; BookingController ; reservation-page | BookingIT (20 clients, rollback, retry), SecurityHttpIT, réservation Vitest | feature/us06-atomic-confirmation |
| US07 | Guichet avec le même stock | BookingController.counter ; staff-page | BookingIT, SecurityHttpIT (CLIENT refusé), management Vitest | feature/us07-box-office |
| US08 | Billets privés et références | BookingService.ticket / mine ; tickets-page | BookingIT, SecurityHttpIT (404 autre client), tickets Vitest | feature/us08-private-tickets |
| US09 | Billet mobile et imprimable | tickets-page ; styles.scss @media print | DOM ticket Vitest ; recette 360 px / PDF à réaliser | feature/us09-printable-tickets |
| US10 | Gestion films, publication et historique | admin/AdminController ; admin-page | SecurityHttpIT, management Vitest | feature/us10-film-administration |
| US11 | Programmation et conflits de salles | AdminController ; V1 contrainte exclusion ; admin-page | DatabaseIT, SecurityHttpIT, management Vitest | feature/us11-programming-validation |
| US12 | Recherche paginée, référence / séance | StaffController.search ; staff-page | SecurityHttpIT, management Vitest | feature/us12-reservation-tracking |
| US13 | Occupation : places / capacité | StaffController.occupancy ; staff-page | StatisticsIT (zéro et réservation multiple) | feature/us13-occupancy |
| US14 | Jours / heures / week-end et comparaison | StaffController.analytics ; staff-page | StatisticsIT, SecurityHttpIT (date civile), management Vitest | feature/us14-period-analysis |
| US15 | Seuil d’occupation consultatif | occupancy threshold ; staff-page | StatisticsIT (borne exacte, aucun changement programme), management Vitest | feature/us15-occupancy-alerts |

## Règles à valider

Retrait, non-présentation et annulation client ne sont pas inventés dans l’application. Paiement en ligne hors MVP. La géométrie des rangées et les délais de remise en état restent des hypothèses. Les analyses comptent les sièges réservés, jamais des entrées réelles. Le seuil de 80 % peut être changé dans Pilotage ; il ne déclenche aucune modification automatique du programme.

L’objectif métier de +30 % sur douze mois exige une mesure après exploitation. Il n’est pas acquis par la livraison du code.
