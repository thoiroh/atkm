#!/bin/bash

echo "🍎 Configuration ATKM pour macOS"
echo "================================"

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop for Mac."
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "🟢 Installation de Node.js via Homebrew..."
    brew install node@20
    brew link node@20 --force
fi

# Copier le fichier d'environnement macOS
echo "⚙️ Configuration de l'environnement macOS..."
if [ ! -f .env ]; then
    cp .env.macos .env
    echo "✅ Fichier .env créé avec optimisations macOS"
else
    echo "ℹ️ Fichier .env existe déjà"
fi

# Créer les dossiers nécessaires si manquants
echo "📁 Vérification de la structure des dossiers..."
mkdir -p atkm_back/public
mkdir -p atkm_back/src/app
mkdir -p atkm/src/app
mkdir -p database
mkdir -p docker/php
mkdir -p docker/nginx

# Ajuster les permissions
echo "🔐 Ajustement des permissions..."
chmod -R 755 atkm_back/public
chmod -R 755 atkm
chmod -R 755 docker

# Construire et démarrer
echo "🚀 Construction et démarrage des containers..."
docker-compose up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Installer les dépendances PHP
echo "📦 Installation des dépendances PHP..."
docker-compose exec php composer install

# Vérifier les services
echo "✅ Vérification des services..."
echo "📱 Angular: http://localhost:4200"
echo "🌐 API PHP: http://localhost:8000"
echo "🐬 PhpMyAdmin: http://localhost:8080"

echo ""
echo "🎉 Installation terminée !"
echo "Votre environnement ATKM est prêt sur macOS."
