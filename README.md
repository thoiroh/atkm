# 🚀 ATK AI

> Application Angular 20 + PHP 8.3 + Docker
> Compatible Windows 11 & macOS Sequoia

## 📋 Prérequis

### Windows 11

- Docker Desktop avec WSL2
- Node.js 20.x LTS
- Git
- PowerShell

### macOS Sequoia

- Docker Desktop for Mac
- Node.js 20.x LTS (via Homebrew)
- Git (Xcode Command Line Tools)
- Terminal

## ⚡ Installation rapide

### 🍎 macOS

```bash
# Cloner le projet
git clone [votre-repo] atkm
cd atkm

# Lancer le script d'installation
chmod +x setup-macos.sh
./setup-macos.sh
```

### 🖥️ Windows 11

```powershell
# Cloner le projet
git clone [votre-repo] atkm
cd atkm

# Lancer le script d'installation (PowerShell en tant qu'admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-windows.ps1
```

## 🎯 URLs de développement

- **Angular** : <http://localhost:4200>
- **API PHP** : <http://localhost:8000>
- **PhpMyAdmin** : <http://localhost:8080>

## 🔧 Installation manuelle

### 1. Configuration de l'environnement

```bash
# macOS - Optimisations de performance
cp .env.macos .env

# Windows - Configuration standard
cp .env.windows .env
```

### 2. Démarrage des containers

```bash
# Construction et démarrage
docker-compose up --build -d

# Vérification des services
docker-compose ps

# Installation des dépendances PHP
docker-compose exec php composer install
```

## 📁 Structure du projet

```ts
atkm/
├── .env.macos              # Config optimisée macOS
├── .env.windows            # Config standard Windows
├── docker-compose.yml      # Configuration unifiée
├── setup-macos.sh          # Script d'installation macOS
├── setup-windows.ps1       # Script d'installation Windows
├── atkm/                  # Frontend Angular 20
│   ├── src/
│   ├── package.json
│   ├── angular.json
│   └── Dockerfile
├── atkm_back/             # Backend PHP 8.3
│   ├── public/
│   ├── src/
│   ├── composer.json
│   └── .env
├── docker/                 # Configuration containers
│   ├── php/
│   └── nginx/
└── docs/                   # Documentation complète
```

## 🚀 Fonctionnalités

- ✅ Angular 20 avec Hot Reload
- ✅ PHP 8.3 avec Composer
- ✅ MySQL 8.0 avec PhpMyAdmin
- ✅ Redis pour le cache
- ✅ Nginx comme reverse proxy
- ✅ Configuration unifiée Windows/macOS
- ✅ Scripts d'installation automatiques
- ✅ Optimisations de performance par OS

## 📄 Licence

Projet propriétaire ATK - 2025
