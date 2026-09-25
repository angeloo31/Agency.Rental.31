# 📋 DZ Location — Guide & Modèle de Saisie Manuelle des Données

Ce document sert de **guide pratique et modèle complet** pour remplir manuellement toutes les données de votre plateforme **DZ Location** depuis votre **Dashboard Administration (`/admin`)**.

---

## 📑 Sommaire des Éléments à Saisir

1. [Configuration Générale & Image de Marque (SettingsTab)](#1-configuration-générale--image-de-marque)
2. [Agences & Emplacements de Prise en Charge (Agencies)](#2-agences--emplacements-de-prise-en-charge)
3. [Catégories & Sous-catégories (CategoriesTab)](#3-catégories--sous-catégories)
4. [Flotte de Véhicules (Fleet Management)](#4-flotte-de-véhicules)
5. [Options & Équipements Supplémentaires (ExtraOptionsTab)](#5-options--équipements-supplémentaires)

---

## 1. Configuration Générale & Image de Marque

Dans l'onglet **Paramètres du site** de l'administration, renseignez les informations fondamentales de votre entreprise :

### 🏢 Informations de la Société
| Champ | Exemple / Valeur Recommandée | Description |
|---|---|---|
| **Nom de l'Agence** | `DZ Location Prestige` | Le nom affiché sur le header, footer et reçus |
| **Téléphone Principal** | `+213 (0) 550 12 34 56` | Numéro de téléphone joignable 24/7 |
| **Email Principal** | `contact@dzlocation.dz` | Email de réception des notifications et demandes |
| **Adresse Principale** | `Boulevard Zirout Youcef, Alger Centre` | Adresse du siège social |
| **Logo de l'Agence** | *(Téléverser une image PNG/SVG avec fond transparent)* | Affiché dans l'en-tête du site |

### 🎨 Charte Graphique (Couleurs)
| Champ | Valeur Hexadécimale | Effet |
|---|---|---|
| **Couleur Principale** | `#2563EB` *(Bleu Roi)* | Boutons principaux, accents et surbrillances |
| **Couleur Secondaire** | `#0F172A` *(Ardoise Sombre)* | En-têtes, éléments sombres et pieds de page |

### 🖼️ Section Héro (Page d'Accueil)
| Champ | Contenu Exemple |
|---|---|
| **Titre Principal Héro** | `Le frisson de la location premium en Algérie` |
| **Sous-titre Héro** | `Découvrez notre flotte exclusive de voitures, motos et jet-skis. Payez 100% sur place lors de la récupération.` |
| **Image de Fond Héro** | *(Téléverser une photo grand angle de véhicule de luxe)* |

### 📖 Section À Propos (Page /about)
| Champ | Contenu Exemple |
|---|---|
| **Titre de la Vision** | `La Vision DZ Location` |
| **Texte Histoire (Paragraphe 1)** | `Né d'une passion pour les véhicules d'exception, DZ Location vous offre une expérience de réservation fluide sans contrainte de paiement en ligne.` |
| **Texte Histoire (Paragraphe 2)** | `Nos engagements : zéro caution en ligne, véhicules soigneusement révisés, et assistance personnalisée 24h/24.` |
| **Image d'Illustration** | *(Téléverser une photo d'agence ou d'alignement de flotte)* |

---

## 2. Agences & Emplacements de Prise en Charge

Ajoutez vos points de retrait dans l'onglet **Agences**. Les utilisateurs pourront choisir ces lieux lors de leur réservation.

### Modèle de Saisie des Agences :

```json
[
  {
    "name": "Aéroport International d'Alger - Houari Boumédiène",
    "type": "Airport",
    "categories": ["Car", "Motorcycle"]
  },
  {
    "name": "Aéroport International d'Oran - Ahmed Ben Bella",
    "type": "Airport",
    "categories": ["Car", "Motorcycle"]
  },
  {
    "name": "Agence Centrale - Alger Centre",
    "type": "City",
    "categories": ["Car", "Motorcycle"]
  },
  {
    "name": "Base Nautique Marina Sidi Fredj (Alger)",
    "type": "Marina",
    "categories": ["JetSki"]
  },
  {
    "name": "Base Nautique Les Andalouses (Oran)",
    "type": "Marina",
    "categories": ["JetSki"]
  }
]
```

*Note : Les types d'emplacements disponibles sont `Airport` (Aéroport), `City` (Centre-ville), et `Marina` (Base Nautique).*

---

## 3. Catégories & Sous-catégories

Dans l'onglet **Catégories**, créez les familles de véhicules disponibles à la location.

### Modèle des Catégories Principales :

#### 🚗 Catégorie 1 : Voitures
- **Nom Identifiant (Code)** : `Car`
- **Nom Affiché (Français)** : `Voiture`
- **Visibilité** : `Visible`
- **Sous-catégories** :
  - `Berline de Luxe`
  - `SUV & 4x4`
  - `Sport & Supercar`
  - `Économique / Compacte`
  - `Véhicules de Mariage`
  - `Cabriolet`

#### 🏍️ Catégorie 2 : Motos
- **Nom Identifiant (Code)** : `Motorcycle`
- **Nom Affiché (Français)** : `Moto`
- **Visibilité** : `Visible`
- **Sous-catégories** :
  - `Sportive`
  - `Routière / Cruiser`
  - `Scooter`
  - `Aventure`

#### 🌊 Catégorie 3 : Jet Skis
- **Nom Identifiant (Code)** : `JetSki`
- **Nom Affiché (Français)** : `Jet Ski`
- **Visibilité** : `Visible`
- **Sous-catégories** :
  - `Sport & Performance`
  - `Loisir`
  - `Grand Tourisme`

---

## 4. Flotte de Véhicules

Pour chaque véhicule de votre parc automobile ou maritime, créez une fiche complète depuis le bouton **Ajouter un véhicule** dans l'onglet **Flotte**.

### 📋 Formulaire de Saisie des Véhicules :

#### 🔹 1. Informations de base
- **Marque** : *(ex: `Mercedes-Benz`, `Porsche`, `Yamaha`)*
- **Modèle** : *(ex: `G 63 AMG`, `911 Carrera`, `WaveRunner EX`)*
- **Année** : *(ex: `2024`)*
- **Catégorie** : *(Sélectionner `Car`, `Motorcycle` ou `JetSki`)*
- **Sous-catégorie** : *(Sélectionner la sous-catégorie appropriée)*

#### 🔹 2. Tarification & Conditions (en Dinar Algérien - DA)
- **Prix par Jour (DA)** : *(Pour Voitures & Motos — ex: `35 000`)*
- **Prix par Heure (DA)** : *(Pour Jet Skis — ex: `8 000`)*
- **Caution / Dépôt de Garantie (DA)** : *(ex: `150 000`)*
- **Caution Optionnelle** : *(Cocher Oui/Non)*
- **Statut** : *(Sélectionner `Available`, `Rented` ou `Maintenance`)*

#### 🔹 3. Photos
- **Images du véhicule** : *(Téléverser 1 à 5 photos HD haute résolution)*

#### 🔹 4. Spécifications Techniques
- **Voitures** :
  - Nombre de portes : *(ex: `4`)*
  - Transmission : `Automatique` ou `Manuelle`
  - Carburant : `Essence`, `Diesel`, `Électrique` ou `Hybride`
- **Motos** :
  - Cylindrée (CC) : *(ex: `1000`)*
  - Casque inclus : `Oui` / `Non`
- **Jet Skis** :
  - Puissance (CV) : *(ex: `300`)*
  - Gilets de sauvetage inclus : `Oui` / `Non`

---

## 5. Options & Équipements Supplémentaires

Dans l'onglet **Options & Équipements**, créez les extras payants ou gratuits proposés au client lors du checkout.

### Modèles d'Options :

| Nom de l'Option | Prix (DA) | Type de Tarif | Catégorie Cible | Statut |
|---|---|---|---|---|
| **Siège Enfant de Sécurité** | `1 500 DA` | `par_jour` | Voitures (`Car`) | Active |
| **Conducteur Supplémentaire** | `2 000 DA` | `forfait_fixe` | Toutes (`All`) | Active |
| **Système de Navigation GPS** | `1 000 DA` | `par_jour` | Voitures (`Car`) | Active |
| **Assurance Tous Risques (Zéro Franchise)** | `3 000 DA` | `par_jour` | Toutes (`All`) | Active |
| **Routeur Wi-Fi 4G Haut Débit** | `800 DA` | `par_jour` | Voitures (`Car`) | Active |
| **Casque Homologué & Gants** | `1 000 DA` | `forfait_fixe` | Motos (`Motorcycle`) | Active |
| **Combinaison & Gilet de Sauvetage** | `1 500 DA` | `forfait_fixe` | Jet Skis (`JetSki`) | Active |

---

## 💡 Procédure Recommandée de Saisie

1. **Étape 1** : Allez dans `/admin` et connectez-vous.
2. **Étape 2** : Configurez le **Nom de l'agence, Coordonnées et Logo** dans `Paramètres`.
3. **Étape 3** : Ajoutez les **Catégories et Sous-catégories** dans `Catégories`.
4. **Étape 4** : Ajoutez vos **Points de Retrait / Agences** dans `Paramètres > Agences`.
5. **Étape 5** : Créez vos **Options Supplémentaires** dans `Options`.
6. **Étape 6** : Publiez vos **Véhicules** dans `Flotte`.

*Toutes les modifications prennent effet instantanément sur le site web public.*
