# Recette à exécuter dans le navigateur

Cette liste décrit les vérifications attendues. Elle ne prétend pas que la recette cloud ou la validation métier a déjà été effectuée. Consigner date, navigateur, environnement, résultat et capture / rapport après chaque passage.

1. Anonyme : catalogue publié, détails, changement de date Paris, journée vide, erreur réseau et relance.
2. Plan : salle correcte, rangées / sièges, libellés clavier, symboles distincts, sélection de 1 à 10 places, total calculé.
3. Deux fenêtres : confirmer une place dans A ; voir son occupation dans B. Couper le flux réseau de B, constater l’avertissement, reconnecter puis vérifier le rechargement.
4. Compte : inscription valide / invalide / dupliquée, mauvais identifiants, connexion, déconnexion, accès privé après déconnexion refusé.
5. Confirmation : deux clients sur le même siège ; un seul succès. Sélection de deux sièges dont un déjà pris : aucun siège de la demande perdante ne doit être attribué.
6. Réponse perdue : conserver une demande et sa clé, renvoyer exactement le même contenu ; retrouver le même billet. Changer le contenu avec cette clé : 409.
7. Billet : référence, film, séance Paris, salle, toutes les places et prix ; accès refusé pour un autre client même avec UUID connu.
8. Mobile : largeur 360 px, navigation au clavier, plan défilable avec son libellé, aucun élément essentiel du billet perdu. Imprimer en PDF ; navigation et boutons absents, billet lisible sur une page si le navigateur le permet.
9. Guichet : compte STAFF, créer une réservation depuis Pilotage / Guichet et constater le même stock côté client. Un CLIENT ne doit pouvoir ni ouvrir le suivi ni appeler les routes staff.
10. Administration : film non programmé créé puis modifié, publication / dépublication, film réservé toujours lisible dans son billet. Programme masqué côté catalogue après dépublication.
11. Programmation : créer une séance future, vérifier durée + remise en état, rejeter une plage qui chevauche, permettre une plage qui commence à la fin de remise en état. Réserver puis refuser modification / annulation.
12. Recherche : référence complète / partielle, séance, aucune ligne, pagination au-delà de 25 ; aucune donnée d’authentification affichée.
13. Occupation : zéro siège, réservation multi-siège, numérateur / capacité, changement de dates. Distinguer réservation et entrée réelle.
14. Analyses : semaine / week-end, heures Paris, festival et période distincte de même durée, manque de données expliqué. Périodes invalides refusées.
15. Alerte : seuil 80 %, puis une autre valeur ; seuls les indicateurs changent. Aucune séance n’est automatiquement modifiée.

Contrôles externes à conserver pour le dossier : PR réelle vers develop, CI réelle, URL publique, identifiants de démonstration transmis selon la notice, captures après publication. Les cibles de charge du Bloc 2 restent des hypothèses jusqu’à un test k6 sur un hébergement représentatif. Ne jamais lancer un test de charge sur un service sans autorisation.
