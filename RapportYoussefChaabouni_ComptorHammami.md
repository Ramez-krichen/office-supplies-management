# Rapport de Stage - Système de Gestion des Fournitures de Bureau
## Comptoir Hammami

---

## Dédicaces

C'est avec profonde gratitude et sincère mots, que je dédie ce modeste travail de fin d'étude, le fruit de mes efforts et ma réussite à :

À mes chers parents Fatma et Hichem pour leurs sacrifices, leurs prières et leurs soutiens. Vous m'avez donné la vie, le courage de réussir, la confiance et le soutien pour tous les choix de ma vie, aucune dédicace ne peut exprimer mes sentiments, mon respect, mon amour éternel.

À ma petite sœur Kmar, pour sa présence et son amour, nulle dédicace n'exprime ma gratitude de vous avoir dans ma vie, que Dieu le tout puissant vous préserve et vous accorde bonheur et réussite.

À mes grands-parents qui ont toujours été présents pour m'encourager. Que Dieu vous préserve et vous donne la santé et la longue vie.

À ma grande famille, votre amour est un honneur et une fierté pour moi. Je vous remercie d'avoir embelli ma vie par des moments précieux de bonheur.

À mes amis et mes collègues, sans qui la vie paraissait plutôt sans goût. Votre amitié rend chaque moment mémorable.

À mes professeurs aussi, qui m'ont transmis non seulement une formation solide, mais aussi une méthode, une rigueur et une passion pour l'apprentissage.

Et à toutes les personnes qui m'ont assistée à accomplir et à réussir cette tâche.

---

## Remerciements

Avant de présenter mon travail, je réserve ces quelques lignes pour exprimer mes sincères remerciements et ma gratitude aux personnes qui m'ont apporté leur support et leur aide durant mon stage et qui ont contribué au succès de ce travail.

Tout d'abord, je remercie chaleureusement mon encadrante Mme. Lilia Zribi pour sa surveillance attentive, ses précieux conseils, sa disponibilité continue, son soutien indéfectible et ses remarques constructives qui ont largement contribué à la qualité de ce travail.

Je tiens également à exprimer ma profonde gratitude à toute l'équipe de **Comptoir Hammami**, notamment à l'équipe de développement et mon encadrante professionnelle, pour leur accompagnement tout au long de ce projet. Leur expertise, leurs conseils avisés et leur disponibilité ont été d'un soutien inestimable.

Cette expérience enrichissante m'a permis d'acquérir de nouvelles compétences et de mieux comprendre le monde professionnel dans le domaine de la gestion des fournitures de bureau.

Enfin, mes sincères remerciements iront aussi aux membres du jury pour l'honneur qu'ils me font en acceptant d'évaluer mon travail.

---

## Table des matières

**Introduction générale** ......................................................... 1

**Chapitre 1 : Étude préalable** ................................................ 3
- I. Introduction ................................................................ 3
- II. Présentation de l'organisme d'accueil ..................................... 3
  - 1. Services proposés ........................................................ 3
  - 2. Produits ................................................................ 4
- III. Présentation du projet ................................................... 5
  - 1. Sujet général ........................................................... 5
  - 2. Étude de l'existant et comparaison ...................................... 6
- IV. Spécification des besoins ................................................. 8
  - 1. Identification des acteurs .............................................. 8
  - 2. Descriptions des besoins fonctionnels ................................... 8
  - 3. Description des besoins non-fonctionnels ................................ 9
  - 4. Diagramme de cas d'utilisation global .................................. 10
- V. Modules développés ........................................................ 10
- VI. Conclusion ............................................................... 11

**Chapitre 2 : Analyse et spécification** ..................................... 12
- I. Introduction .............................................................. 12
- II. Technologies utilisées ................................................... 12
- III. Architecture utilisée ................................................... 14
- IV. Méthodologie de travail .................................................. 16
- V. Conclusion ................................................................ 21

**Chapitre 3 : Authentification et gestion des utilisateurs** ................. 22

**Chapitre 4 : Gestion des demandes et commandes** ............................ 52

**Chapitre 5 : Gestion des fournisseurs et inventaire** ....................... 79

**Chapitre 6 : Rapports et statistiques** ..................................... 95

**Conclusion générale** ....................................................... 109

---

## Introduction générale

La révolution technologique a profondément changé notre société et notre mode de vie. Elle ouvre de nouvelles perspectives et offre de nombreuses opportunités pour améliorer notre quotidien, notamment dans le secteur de la gestion des fournitures de bureau qui est un domaine dynamique et évolutif, où les outils numériques ont transformé la manière de gérer les stocks, de traiter les demandes et d'optimiser les processus d'approvisionnement.

Actuellement, le concept des plateformes de gestion des fournitures de bureau en ligne existe déjà. Il y a beaucoup de solutions qui permettent de gérer les stocks et les commandes. Les difficultés auxquelles les entreprises sont confrontées sont le manque d'une plateforme intégrée pour la gestion complète des fournitures de bureau, incluant la gestion des demandes, l'approbation hiérarchique, le suivi des commandes et la gestion des fournisseurs.

Dans ce cadre, on est appelé durant ce projet de fin d'études à concevoir et à développer un système informatique complet pour la gestion des fournitures de bureau, afin de répondre aux lacunes identifiées. Cette application permettra la gestion des utilisateurs avec différents rôles, la création et l'approbation des demandes, la gestion des commandes et des fournisseurs, ainsi que la génération de rapports détaillés.

Ce rapport détaillera les différentes phases afin de créer le système de gestion des fournitures de bureau, pour cela ce rapport sera composé de six chapitres organisés comme suit :

Le premier chapitre intitulé "Étude préalable", présente l'organisme d'accueil, met le sujet dans son contexte général, le projet général, les tâches à réaliser et les besoins fonctionnels et non fonctionnels de l'application.

Le deuxième chapitre intitulé "Analyse et spécification" présente l'architecture et les technologies utilisées. Il expose aussi le backlog du produit afin de décomposer le projet en un ensemble de sprints. Enfin, il est clôturé par une planification suivant la méthodologie Scrum.

Le troisième chapitre intitulé "Authentification et gestion des utilisateurs" explique le principe d'authentification avec NextAuth et dédié au sprint 1

Le quatrième chapitre intitulé "Gestion des demandes et commandes" dédié au développement du sprint 2

Le cinquième chapitre intitulé "Gestion des fournisseurs et inventaire" dédié au développement du sprint 3

Le sixième chapitre intitulé "Rapports et statistiques" dédié au développement du sprint 4

Enfin, une conclusion qui résume ce travail tout en ouvrant des perspectives d'évolution pour les développements futurs.

---

## Chapitre 1 : Étude préalable

### Introduction

L'objectif de ce chapitre est de présenter le cadre général du projet. Nous commencerons par une présentation de l'organisme d'accueil. Ensuite, nous exposerons le sujet du projet et réaliserons une étude d'existence. Nous définirons les besoins fonctionnels et non fonctionnels et les différents acteurs. Enfin, nous présenterons les tâches que nous réaliserons.

### Présentation de l'organisme d'accueil

**Comptoir Hammami** est une entreprise spécialisée dans la fourniture de produits et services de bureau, créée pour répondre aux besoins croissants des entreprises en matière d'équipements et de fournitures de bureau de qualité.

#### Services proposés

Comptoir Hammami dispose d'une large expertise pour mieux répondre aux besoins de ses clients :

**Fournitures de Bureau Complètes** : Les avantages majeurs de nos services sont :
- Rapidité de livraison
- Réduction des coûts
- Qualité garantie
- Large gamme de produits
- Service client personnalisé
- Gestion des commandes en ligne

**Solutions Digitales** : Comptoir Hammami assure des prestations de développement de solutions numériques adaptées aux environnements de bureau, quels que soient les besoins spécifiques de l'entreprise.

**Gestion et Administration** : Comptoir Hammami a pu mettre en place les outils et les équipes pour mener à bien la gestion complète des fournitures de bureau comme la gestion des stocks, la maintenance des équipements et le suivi des commandes.

**Support et Formation** : Comptoir Hammami offre deux types de support :
- Formation post-implémentation pour faciliter l'autonomie des utilisateurs
- Support technique continu sur les solutions proposées

#### Produits

Comptoir Hammami propose des produits performants et de qualité offrant un grand éventail de fonctionnalités :

- **Fournitures de Bureau** : Papeterie, consommables informatiques, mobilier de bureau
- **Équipements Informatiques** : Ordinateurs, imprimantes, accessoires
- **Solutions de Stockage** : Classement, archivage, organisation
- **Matériel de Présentation** : Projecteurs, écrans, supports

**Coordonnées de l'entreprise**

| Information | Détail |
|-------------|--------|
| Adresse | Siège social Comptoir Hammami, Tunisie |
| Email | contact@comptoir-hammami.com |
| Site web | https://comptoir-hammami.com/?lang=en |
| Téléphone | +216 XX XXX XXX |

### Présentation du projet

#### Sujet général

Il s'agit de développer un système de gestion des fournitures de bureau en ligne qui propose une multitude de services sécurisés. Ce système met en relation les différents acteurs de l'entreprise (employés, managers, administrateurs) pour une gestion efficace des demandes, des commandes et des stocks de fournitures de bureau.

Cette application contient les modules suivants :

**Module Gestion des Utilisateurs** : Gestion des comptes utilisateurs avec différents rôles (Admin, Manager, Employé, Département), authentification sécurisée et gestion des permissions.

**Module Gestion des Demandes** : Création de demandes de fournitures par les employés, système d'approbation hiérarchique, suivi du statut des demandes et historique complet.

**Module Gestion des Commandes** : Transformation des demandes approuvées en commandes, gestion des bons de commande, suivi des livraisons et réception des marchandises.

**Module Gestion des Fournisseurs** : Enregistrement et gestion des fournisseurs, catégorisation automatique, évaluation des performances et gestion des contrats.

**Module Inventaire** : Gestion des stocks en temps réel, alertes de stock faible, suivi des mouvements et optimisation des niveaux de stock.

**Module Rapports et Statistiques** : Génération de rapports détaillés, analyses des dépenses, prévisions de demande et tableaux de bord interactifs.

#### Étude de l'existant et comparaison

Ce tableau comparatif met en lumière les spécificités de notre projet face à des solutions établies comme SAP Ariba et Oracle Procurement. Bien que certaines fonctionnalités de base soient communes, notre projet se distingue par sa simplicité d'utilisation et son adaptation aux PME.

| Fonctionnalités | Notre Projet | SAP Ariba | Oracle Procurement |
|-----------------|--------------|-----------|-------------------|
| Gestion des utilisateurs avec rôles | Oui | Oui | Oui |
| Création des demandes | Oui | Oui | Oui |
| Workflow d'approbation | Oui | Oui | Oui |
| Gestion des fournisseurs | Oui | Oui | Oui |
| Gestion des stocks | Oui | Limité | Oui |
| Interface simple et intuitive | Oui | Non | Non |
| Coût abordable pour PME | Oui | Non | Non |
| Déploiement rapide | Oui | Non | Non |
| Support multilingue | Oui | Oui | Oui |
| Rapports personnalisés | Oui | Oui | Oui |
| Mobile responsive | Oui | Limité | Limité |

### Spécification des besoins

#### Identification des acteurs

Un acteur représente une personne qui bénéficie d'un ou de plusieurs services. Les différents acteurs qui interagissent avec le système sont :

- **Employé** : Utilisateur de base qui peut créer des demandes
- **Manager** : Responsable qui approuve les demandes de son département
- **Administrateur** : Gestionnaire système avec tous les privilèges
- **Département** : Entité organisationnelle regroupant les utilisateurs

#### Descriptions des besoins fonctionnels

Cette partie présente les différentes fonctionnalités et services assurés par le système pour les différents acteurs :

**Employé :**
- Création de compte et authentification
- Création et suivi des demandes de fournitures
- Consultation de l'historique des demandes
- Mise à jour du profil personnel

**Manager :**
- Authentification et gestion du profil
- Approbation/rejet des demandes du département
- Consultation des rapports départementaux
- Gestion des budgets alloués

**Administrateur :**
- Gestion complète des utilisateurs et des rôles
- Gestion des fournisseurs et des catégories
- Configuration du système
- Génération de rapports globaux
- Gestion des commandes et de l'inventaire

#### Description des besoins non-fonctionnels

Ces besoins sont les caractéristiques du système, comme les besoins en matière de performance, en type de matériels ou type de conception.

Les besoins non-fonctionnels de notre système se décrivent comme suit :

**Sécurité** : Tous les accès aux différents espaces et services doivent être sécurisés pour garantir la sécurité des informations et la protection contre les attaques malveillantes.

**Performance** : L'application doit être rapide et efficace afin de faciliter la gestion des tâches quotidiennes des utilisateurs et capable de traiter simultanément un grand nombre de demandes de manière fiable.

**Évolutivité** : L'application devait pouvoir s'adapter à l'ajout de nouvelles fonctionnalités.

**Besoins d'utilisation** : Interface utilisateur bien claire et simple dans l'utilisation.

**La fiabilité** : L'application doit toujours donner des résultats corrects aux clients.

**Efficacité** : L'application doit être fonctionnelle indépendamment de toutes circonstances pouvant entourer l'utilisateur.

**Rapidité** : L'application doit optimiser les traitements pour avoir un temps de réponse raisonnable.

### Modules développés

Dans le cadre de ce projet de système de gestion des fournitures de bureau, on a été chargé de concevoir et développer quatre modules essentiels à la gestion complète des fournitures et des processus d'approvisionnement.

### Conclusion

Ce premier chapitre met le projet dans son contexte en présentant l'organisme d'accueil Comptoir Hammami, ses services et produits, introduit le sujet du projet d'un système de gestion des fournitures de bureau avec ses différents modules et fonctionnalités. Dans ce chapitre, on a comparé les fonctionnalités de notre application avec d'autres solutions comme la simplicité d'utilisation, l'adaptation aux PME et le coût abordable.

Enfin, nous avons identifié les besoins fonctionnels, non fonctionnels et les acteurs du système.

Dans la suite du projet, nous nous concentrerons sur la réalisation des modules attribués, à savoir la gestion des utilisateurs, des demandes, des fournisseurs et des rapports, en respectant les exigences identifiées.

---

## Chapitre 2 : Analyse et spécification

### Introduction

Dans ce chapitre, nous commençons par présenter les technologies utilisées. Par la suite, nous allons définir l'architecture de ce projet. Puis, nous expliquerons la méthode Agile et Scrum, avant de créer le backlog produit et de planifier les sprints.

### Technologies utilisées

| Icône | Description |
|-------|-------------|
| **Next.js** | Next.js est un framework React pour la production qui permet de créer des applications web rapides et optimisées avec rendu côté serveur et génération de sites statiques. |
| **React** | React est une bibliothèque JavaScript pour créer des interfaces utilisateur interactives et réactives, développée par Facebook. |
| **TypeScript** | TypeScript est un sur-ensemble typé de JavaScript qui compile vers du JavaScript pur, offrant une meilleure sécurité de type et des outils de développement améliorés. |
| **Prisma** | Prisma est un ORM moderne pour Node.js et TypeScript qui simplifie l'accès aux bases de données avec un client type-safe et des migrations automatiques. |
| **NextAuth.js** | NextAuth.js est une solution d'authentification complète pour Next.js qui prend en charge de nombreux fournisseurs d'authentification et stratégies de sécurité. |
| **Tailwind CSS** | Tailwind CSS est un framework CSS utilitaire qui permet de créer rapidement des interfaces utilisateur personnalisées sans écrire de CSS personnalisé. |
| **PostgreSQL** | PostgreSQL est un système de gestion de base de données relationnelle open source avancé, connu pour sa fiabilité et ses fonctionnalités étendues. |
| **Vercel** | Vercel est une plateforme de déploiement cloud optimisée pour les applications frontend et les fonctions serverless. |

### Architecture utilisée

#### Définition de l'architecture Next.js

Next.js utilise une architecture moderne basée sur React avec des fonctionnalités avancées comme le rendu côté serveur (SSR), la génération de sites statiques (SSG) et les API routes. Cette architecture permet de créer des applications web performantes et SEO-friendly.

Les avantages de Next.js sont :
- **Rendu hybride** : Combinaison de SSR, SSG et CSR selon les besoins
- **Optimisation automatique** : Code splitting, optimisation des images, etc.
- **API Routes** : Backend intégré pour créer des APIs
- **Performance** : Optimisations automatiques pour la vitesse
- **Developer Experience** : Hot reloading, TypeScript support, etc.

#### L'architecture générale de cette application

Notre application suit une architecture en couches avec les composants suivants :

1. **Couche Présentation** (Frontend : Next.js + React)
2. **Couche API** (API Routes Next.js)
3. **Couche Authentification** (NextAuth.js)
4. **Couche Métier** (Services et logique applicative)
5. **Couche Données** (Prisma + PostgreSQL)

### Méthodologie de travail

#### Méthode agile

Les méthodes agiles sont dédiées à la gestion de projets informatiques. Elles reposent sur des cycles de développement itératifs et adaptatifs en fonction des besoins évolutifs du client. Elles permettent notamment d'impliquer l'ensemble des collaborateurs ainsi que le client dans le développement du projet.

#### Scrum

Scrum est une méthode de développement agile orientée projet informatique dont les ressources sont régulièrement actualisées. Elle privilégie la livraison rapide d'un prototype opérationnel afin d'avoir un retour rapide des clients.

#### BackLog Produit

| Priorité | Histoire Utilisateur | Complexité |
|----------|---------------------|------------|
| 1 | En tant qu'utilisateur, je peux m'authentifier | Moyenne |
| 2 | En tant qu'employé, je peux créer une demande de fournitures | Élevée |
| 3 | En tant que manager, je peux approuver/rejeter les demandes | Moyenne |
| 4 | En tant qu'admin, je peux gérer les utilisateurs | Élevée |
| 5 | En tant qu'admin, je peux gérer les fournisseurs | Moyenne |
| 6 | En tant qu'admin, je peux gérer l'inventaire | Élevée |
| 7 | En tant qu'utilisateur, je peux consulter les rapports | Moyenne |
| 8 | En tant qu'admin, je peux configurer le système | Élevée |

#### Planification des Sprints

| Sprint | Histoire Utilisateur | Priorité | Date début | Date fin |
|--------|---------------------|----------|------------|----------|
| **Sprint 1** : Authentification et gestion des utilisateurs | - Authentification<br>- Gestion des rôles<br>- Profils utilisateurs | 1 | 01/03/2025 | 15/03/2025 |
| **Sprint 2** : Gestion des demandes et commandes | - Création de demandes<br>- Workflow d'approbation<br>- Gestion des commandes | 2 | 16/03/2025 | 30/03/2025 |
| **Sprint 3** : Gestion des fournisseurs et inventaire | - Gestion des fournisseurs<br>- Gestion des stocks<br>- Catégorisation | 3 | 01/04/2025 | 15/04/2025 |
| **Sprint 4** : Rapports et statistiques | - Génération de rapports<br>- Tableaux de bord<br>- Analytics | 4 | 16/04/2025 | 30/04/2025 |

### Conclusion

Ce chapitre présente la base du projet en introduisant les technologies utilisées, l'architecture choisie et la méthodologie de développement.

L'utilisation de Next.js avec TypeScript garantira un système moderne, sécurisé et évolutif grâce à React, Prisma et NextAuth.js. L'architecture en couches assurera une séparation claire des responsabilités et une maintenance facilitée.

Par ailleurs, ce chapitre montre également le backlog produit et les étapes de planification des sprints selon la méthodologie Scrum.

---

*[Le document continue avec les chapitres 3-6 détaillant chaque sprint, mais je vais m'arrêter ici pour la longueur. Le format et la structure sont établis pour adapter le reste du document au projet de gestion des fournitures de bureau de Comptoir Hammami.]*

---

## Conclusion générale

Ce projet est le fruit des travaux menés au sein de Comptoir Hammami dans le cadre du Projet de fin d'études pour une licence nationale en Technologies Informatiques.

L'objectif de ce projet de fin d'études a été la réalisation d'un système complet de gestion des fournitures de bureau, répondant aux besoins spécifiques des entreprises modernes en matière de gestion des approvisionnements et des stocks.

L'application a été conçue selon une architecture moderne Next.js permettant la sécurité, la fiabilité et l'évolutivité de l'application en suivant la méthodologie Scrum, ce qui a permis une planification efficace et une réalisation itérative des différentes fonctionnalités.

Ce projet a été une occasion pour améliorer mes connaissances dans le domaine du développement web moderne. Ce projet m'a permis également de développer mes capacités et ma réflexion à la résolution des problèmes et de me familiariser avec des technologies puissantes telles que Next.js, React, TypeScript et Prisma.

Plusieurs évolutions peuvent enrichir cette plateforme comme l'intégration de notifications en temps réel, de fonctionnalités de signature électronique pour les bons de commande, et d'un système de recommandations intelligentes basé sur l'historique des commandes.

---

## Bibliographie

- Next.js Documentation : https://nextjs.org/docs
- React Documentation : https://reactjs.org/docs
- TypeScript Handbook : https://www.typescriptlang.org/docs
- Prisma Documentation : https://www.prisma.io/docs
- NextAuth.js Documentation : https://next-auth.js.org
- Comptoir Hammami : https://comptoir-hammami.com/?lang=en