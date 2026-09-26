# AUDIT COMPLET + TEST E2E + CORRECTIONS — PRÉPARATION AU PREMIER DÉPLOIEMENT

Tu dois effectuer un **audit complet de mon application avant sa première mise à disposition auprès des utilisateurs de mon centre de formation**.

L'application va être déployée sur **Vercel aujourd'hui**. Cette première version est extrêmement importante car elle donnera la première impression aux utilisateurs.

## OBJECTIF PRINCIPAL

Je veux que tu vérifies **l'intégralité de l'application**, de manière méthodique et exhaustive.

Ne te limite surtout pas à regarder le code.

Tu dois vérifier :

* Frontend
* Backend
* Base de données
* API
* Authentification
* Autorisation
* Communication frontend/backend
* Toutes les pages
* Toutes les fonctionnalités
* Tous les formulaires
* Tous les boutons
* Tous les liens
* Tous les états de l'interface
* Responsive design
* Design/UI/UX
* Gestion des erreurs
* Loading states
* Empty states
* Validation des données
* Permissions
* Sécurité
* Gestion des sessions
* Gestion des erreurs réseau
* Variables d'environnement
* Configuration production
* Build
* Déploiement Vercel
* Performance
* Console/browser errors
* Logs
* Edge cases
* Flux utilisateur complets

**Ne considère aucune fonctionnalité comme fonctionnelle simplement parce que le code semble correct.**

Il faut autant que possible **exécuter et tester réellement les fonctionnalités**.

---

# 1. RÈGLE ABSOLUE : NE RIEN CASSER

Avant toute modification :

1. Analyse l'architecture complète du projet.
2. Identifie le framework utilisé.
3. Identifie le frontend.
4. Identifie le backend.
5. Identifie la base de données.
6. Identifie les APIs.
7. Identifie le système d'authentification.
8. Identifie les rôles et permissions.
9. Identifie les dépendances importantes.
10. Identifie la configuration de déploiement.
11. Identifie les variables d'environnement.
12. Identifie les fonctionnalités existantes.

**Ne refactore pas inutilement.**

**Ne change pas l'architecture sans nécessité.**

**Ne remplace pas une technologie qui fonctionne simplement parce qu'une autre serait "meilleure".**

Le but est de **stabiliser l'application existante**, pas de reconstruire le projet.

Avant une modification importante, comprends précisément son impact sur le reste de l'application.

Après chaque correction importante, reteste les fonctionnalités concernées afin de vérifier qu'aucune régression n'a été introduite.

---

# 2. COMMENCE PAR COMPRENDRE TOUTE L'APPLICATION

Commence par explorer le repository dans son ensemble.

Inspecte notamment :

* package.json
* configuration du framework
* routes
* pages
* composants
* hooks
* services
* API
* middleware
* modèles
* schémas
* migrations
* seed
* configuration DB
* authentification
* autorisation
* fichiers `.env.example`
* configuration Vercel
* scripts npm
* tests existants
* README
* documentation
* composants UI
* système de design

Construis mentalement une carte complète de l'application.

Identifie également les fonctionnalités qui semblent exister mais qui pourraient être :

* incomplètes
* partiellement implémentées
* non connectées au backend
* simulées/mockées
* désactivées
* cassées
* non utilisées
* accessibles uniquement dans certains cas

---

# 3. TESTER LE LOGIN

Teste réellement le parcours complet de connexion.

Vérifie :

* affichage du formulaire
* validation email
* validation mot de passe
* champs vides
* email invalide
* mauvais mot de passe
* utilisateur inexistant
* compte valide
* messages d'erreur
* loading
* double clic sur le bouton
* gestion des erreurs réseau
* session
* persistance de session
* logout
* redirection après login
* accès aux pages protégées
* tentative d'accès sans authentification
* expiration de session si applicable
* comportement après refresh
* comportement dans un nouvel onglet
* comportement après fermeture/réouverture du navigateur

Vérifie également que les erreurs affichées à l'utilisateur sont propres et compréhensibles.

---

# 4. TESTER LE REGISTER

Teste le parcours complet d'inscription.

Vérifie :

* formulaire
* champs obligatoires
* email invalide
* email déjà utilisé
* mot de passe faible
* confirmation du mot de passe
* caractères spéciaux
* espaces
* valeurs très longues
* soumission multiple
* loading
* erreurs backend
* création réelle de l'utilisateur
* création des données associées
* connexion après inscription si prévue
* redirection
* gestion des erreurs réseau

Vérifie particulièrement qu'une inscription partiellement réussie ne laisse pas la base de données dans un état incohérent.

---

# 5. TESTER TOUTES LES FONCTIONNALITÉS

Fais une **inventaire complet de toutes les fonctionnalités présentes dans l'application**.

Pour chacune, vérifie :

### Affichage

* page accessible
* layout correct
* responsive
* textes
* icônes
* boutons
* images
* espacements
* alignements
* couleurs
* typographie
* états actifs/inactifs
* éléments coupés
* overflow
* scroll

### Fonctionnement

Chaque :

* bouton
* lien
* dropdown
* modal
* tab
* filtre
* recherche
* formulaire
* checkbox
* radio
* switch
* pagination
* upload
* téléchargement
* action CRUD
* notification
* interaction

doit réellement fonctionner.

**Ne laisse aucun bouton "mort".**

---

# 6. TESTER TOUS LES CRUD

Pour chaque ressource de l'application :

### CREATE

Tester :

* création valide
* champs manquants
* données invalides
* doublons
* données extrêmement longues
* caractères spéciaux
* erreurs backend
* refresh après création

### READ

Tester :

* liste
* détail
* données inexistantes
* état vide
* chargement
* erreur API
* pagination si présente

### UPDATE

Tester :

* modification valide
* modification invalide
* annulation
* sauvegarde
* erreurs
* refresh
* persistance réelle en base

### DELETE

Tester :

* suppression
* confirmation
* annulation
* élément inexistant
* erreurs
* refresh
* vérification réelle en base

---

# 7. TESTER TOUS LES RÔLES ET PERMISSIONS

S'il existe plusieurs types d'utilisateurs, teste chacun d'eux.

Par exemple :

* administrateur
* formateur
* étudiant
* utilisateur standard
* etc.

Pour chaque rôle, vérifie :

* pages accessibles
* pages interdites
* boutons visibles
* actions autorisées
* actions interdites
* API protégées
* accès direct à une URL interdite
* manipulation des requêtes
* données visibles

Il ne faut surtout pas se contenter de cacher un bouton côté frontend.

Les permissions doivent également être correctement appliquées côté backend.

---

# 8. TESTER LA COMMUNICATION FRONTEND ↔ BACKEND

Inspecte toutes les communications.

Pour chaque API :

* endpoint
* méthode HTTP
* payload
* headers
* authentification
* autorisation
* réponse
* erreurs
* status codes
* gestion frontend

Teste également :

* API lente
* API qui échoue
* timeout
* données invalides
* réponse vide
* réponse inattendue
* utilisateur non authentifié
* utilisateur non autorisé

Vérifie qu'aucune erreur API ne provoque un état incohérent dans l'interface.

---

# 9. BASE DE DONNÉES

Vérifie :

* schémas
* relations
* contraintes
* valeurs nulles
* unicité
* clés étrangères
* suppressions
* données orphelines
* migrations
* seed
* requêtes
* erreurs DB
* concurrence
* cohérence des données

Vérifie que les opérations importantes sont réellement persistées.

Ne te contente jamais de vérifier uniquement l'état visuel du frontend.

---

# 10. UI / UX / DESIGN

Je veux une première impression professionnelle.

Inspecte toutes les pages.

Cherche notamment :

* éléments mal alignés
* marges incohérentes
* paddings incohérents
* tailles de boutons différentes sans raison
* typographie incohérente
* couleurs incohérentes
* icônes incorrectes
* textes coupés
* éléments qui débordent
* cartes trop grandes/petites
* tables qui cassent le layout
* modales incorrectes
* menus qui débordent
* sidebar problématique
* navbar problématique
* états hover
* états focus
* états disabled
* loading states
* empty states
* error states
* success states

Vérifie également l'expérience d'un nouvel utilisateur qui découvre l'application pour la première fois.

---

# 11. RESPONSIVE DESIGN

Teste au minimum :

* desktop
* laptop
* tablette
* mobile

Vérifie particulièrement :

* navbar
* sidebar
* tableaux
* formulaires
* cartes
* modales
* menus
* boutons
* pagination
* textes
* images
* overflow horizontal

Aucune fonctionnalité importante ne doit devenir inutilisable sur mobile.

---

# 12. ACCESSIBILITÉ

Vérifie notamment :

* labels des inputs
* navigation clavier
* focus visible
* boutons accessibles
* contrastes
* alt des images
* aria si nécessaire
* messages d'erreur associés aux champs
* éléments interactifs correctement identifiables

---

# 13. GESTION DES ERREURS

Cherche toutes les situations pouvant provoquer :

* écran blanc
* crash React
* exception JavaScript
* erreur serveur
* erreur API
* boucle infinie
* loading infini
* bouton bloqué
* données incohérentes

Vérifie également la console navigateur.

Je ne veux pas de :

* erreurs rouges inutiles
* warnings importants
* erreurs réseau inexpliquées
* requêtes qui échouent silencieusement

---

# 14. EDGE CASES

Teste volontairement les cas inhabituels :

* champs vides
* champs très longs
* caractères spéciaux
* emojis
* accents
* espaces
* double clic
* clic rapide répété
* refresh pendant une opération
* retour navigateur
* navigation rapide
* mauvaise connexion
* API indisponible
* données inexistantes
* utilisateur supprimé
* session expirée
* accès direct aux routes
* plusieurs onglets

Cherche activement les bugs que l'utilisateur normal pourrait rencontrer.

---

# 15. SÉCURITÉ

Effectue une vérification de sécurité adaptée à l'application.

Cherche notamment :

* secrets exposés côté frontend
* clés API publiques/privées mal utilisées
* variables d'environnement incorrectes
* routes backend non protégées
* permissions uniquement côté frontend
* données sensibles exposées
* IDOR
* injection
* XSS
* validation uniquement côté client
* absence de validation backend
* informations sensibles dans les logs
* endpoints accessibles sans authentification

**Ne fais aucune action destructive ou offensive sur des systèmes externes.**

Le test doit rester limité à mon application et à mon environnement autorisé.

---

# 16. PERFORMANCE

Vérifie :

* temps de chargement
* bundle
* images
* requêtes inutiles
* appels API répétés
* composants qui rerender inutilement
* loading
* pagination
* gros datasets
* requêtes DB coûteuses
* N+1 queries si applicable

Ne fais cependant pas d'optimisation prématurée qui pourrait augmenter le risque de régression.

---

# 17. PRODUCTION / VERCEL

Prépare l'application pour le déploiement réel.

Vérifie :

* build production
* variables d'environnement
* URLs
* API URLs
* CORS
* cookies
* auth
* redirects
* rewrites
* routes
* assets
* fichiers statiques
* configuration Vercel
* différences dev/prod
* erreurs uniquement présentes en production

Lance le build de production localement si possible.

Corrige toutes les erreurs bloquantes avant de considérer l'application prête.

---

# 18. TESTER LES FLUX UTILISATEUR COMPLETS

Ne teste pas uniquement les pages individuellement.

Teste des parcours complets comme un véritable utilisateur.

Par exemple :

### Parcours utilisateur

Register → Login → Dashboard → fonctionnalité A → fonctionnalité B → Logout

### Parcours administrateur

Login → Dashboard → gestion utilisateurs → création → modification → suppression → vérification

### Parcours formateur

Login → consultation → création/modification de contenu → sauvegarde → vérification

### Parcours étudiant

Login → consultation → interaction → progression → refresh → vérification de la persistance

Adapte évidemment ces parcours aux fonctionnalités réellement présentes dans mon application.

---

# 19. TEST DE RÉGRESSION

À chaque correction importante :

1. Reproduire le problème.
2. Identifier la cause.
3. Corriger la cause réelle.
4. Retester le scénario.
5. Tester les fonctionnalités liées.
6. Vérifier qu'aucune régression n'a été introduite.

**Ne corrige jamais uniquement le symptôme si la cause peut être identifiée.**

---

# 20. NE SUPPRIME AUCUNE FONCTIONNALITÉ EXISTANTE

Ne supprime pas une fonctionnalité simplement parce qu'elle est compliquée.

Ne désactive pas une fonctionnalité pour faire disparaître une erreur.

Ne remplace pas une vraie fonctionnalité par un mock.

Ne contourne pas un problème avec des données hardcodées.

Ne cache pas une erreur.

Le but est que **la fonctionnalité fonctionne réellement**.

---

# 21. QUALITÉ DU CODE

Pendant l'audit, identifie les problèmes importants :

* erreurs TypeScript
* erreurs ESLint importantes
* imports inutilisés
* code mort
* mauvais types
* null/undefined non gérés
* race conditions
* problèmes async/await
* memory leaks
* erreurs React
* problèmes de state management
* mauvais cleanup
* erreurs de dépendances de hooks
* problèmes de concurrence

Corrige uniquement ce qui est pertinent pour la stabilité, la sécurité, la fiabilité ou la qualité de la release.

---

# 22. SI TU TROUVES UN BUG

Pour chaque bug :

1. Donne-lui une priorité :

   * CRITICAL
   * HIGH
   * MEDIUM
   * LOW

2. Explique :

   * où il se trouve
   * comment le reproduire
   * pourquoi il se produit
   * son impact

3. Corrige-le.

4. Reteste.

5. Vérifie les régressions.

Ne te contente pas de me signaler les bugs : **corrige-les lorsque c'est possible et sûr.**

---

# 23. IMPORTANT : SOIS EXHAUSTIF

Je préfère que tu passes beaucoup de temps à tester plutôt que de déclarer l'application prête trop rapidement.

Ne dis pas :

> "Tout semble fonctionner."

si tu n'as pas réellement vérifié.

Ne considère pas une fonctionnalité comme validée simplement parce que :

* le composant existe
* le bouton existe
* l'API existe
* le code compile

Une fonctionnalité est validée uniquement lorsqu'elle fonctionne réellement dans son parcours utilisateur.

---

# 24. RAPPORT FINAL OBLIGATOIRE

À la fin, donne-moi un rapport structuré.

## Résumé

* état général
* nombre de fonctionnalités testées
* nombre de bugs trouvés
* nombre de bugs corrigés
* problèmes restants
* risques éventuels

## Fonctionnalités

| Fonctionnalité | Testée | Résultat | Problèmes |
| -------------- | ------ | -------- | --------- |

## Bugs corrigés

| Bug | Priorité | Cause | Correction | Retest |
| --- | -------- | ----- | ---------- | ------ |

## Bugs restants

| Bug | Priorité | Impact | Pourquoi non corrigé |
| --- | -------- | ------ | -------------------- |

## Production

Vérifie explicitement :

* `npm run build` ou équivalent
* tests
* lint
* TypeScript
* variables d'environnement
* configuration Vercel
* erreurs console
* erreurs serveur
* routes
* authentification
* base de données

## Verdict technique

À la fin, indique clairement l'un des trois états :

### READY

Aucun problème bloquant identifié après les tests réalisés.

### READY WITH WARNINGS

L'application peut être utilisée, mais certains problèmes non bloquants restent présents.

### NOT READY

Un ou plusieurs problèmes importants doivent être corrigés avant le déploiement.

**Ne donne pas "READY" uniquement parce que le build fonctionne.**

---

# 25. DERNIÈRE VÉRIFICATION AVANT DE TERMINER

Avant de conclure, refais un dernier passage global.

Pose-toi cette question :

> "Si 20 à 100 utilisateurs de mon centre de formation utilisent cette application demain matin pour la première fois, quelles sont les choses qui pourraient leur donner l'impression que l'application n'est pas professionnelle ou qui pourraient les empêcher de l'utiliser ?"

Cherche activement ces problèmes et corrige-les.

Puis vérifie une dernière fois :

**Login → navigation → fonctionnalités → sauvegarde → refresh → logout → reconnexion.**

---

# RÈGLE FINALE

Tu as l'autorisation de modifier le code pour corriger les problèmes nécessaires.

Mais :

**STABILITÉ > REFACTORING**

**FIABILITÉ > NOUVELLES FONCTIONNALITÉS**

**CORRECTION RÉELLE > WORKAROUND**

**TEST RÉEL > SIMPLE INSPECTION DU CODE**

**AUCUNE RÉGRESSION**

Prends le temps nécessaire pour faire un audit réellement complet.

Je veux une application prête pour une **première release utilisateur**, pas simplement une application qui compile.
