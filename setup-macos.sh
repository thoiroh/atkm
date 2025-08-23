#!/bin/bash

echo "🍎 Configuration ATKM pour macOS"
echo "================================="

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ [ERREUR] Docker n'est pas installé. Veuillez installer Docker Desktop for Mac."
    exit 1
else
    echo "✅ [OK] Docker est installé"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "🟡 [INFO] Installation de Node.js via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install node@20
        brew link node@20 --force
        echo "✅ [OK] Node.js installé"
    else
        echo "❌ [ERREUR] Homebrew n'est pas installé. Installez Node.js manuellement."
        exit 1
    fi
else
    echo "✅ [OK] Node.js est installé"
fi

# Copier le fichier d'environnement macOS
echo "⚙️ Configuration de l'environnement macOS..."
if [ ! -f .env ]; then
    if [ -f .env.macos ]; then
        cp .env.macos .env
        echo "✅ [OK] Fichier .env créé avec optimisations macOS"
    else
        echo "🟡 [ATTENTION] Fichier .env.macos introuvable"
    fi
else
    echo "ℹ️ [INFO] Fichier .env existe déjà"
fi

# Créer les dossiers nécessaires si manquants
echo "📁 Vérification de la structure des dossiers..."
folders=(
    "atkm_back/public"
    "atkm_back/src/app"
    "atkm/src/app"
    "database"
    "docker/php"
    "docker/nginx"
)

for folder in "${folders[@]}"; do
    if [ ! -d "$folder" ]; then
        mkdir -p "$folder"
        echo "📁 [CRÉÉ] Dossier: $folder"
    fi
done

# Vérifier que docker-compose.yml existe
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ [ERREUR] Fichier docker-compose.yml introuvable"
    exit 1
fi

# Ajuster les permissions
echo "🔐 Ajustement des permissions..."
chmod -R 755 atkm_back/public 2>/dev/null || echo "🟡 [ATTENTION] Impossible de modifier les permissions de atkm_back/public"
chmod -R 755 atkm 2>/dev/null || echo "🟡 [ATTENTION] Impossible de modifier les permissions de atkm"
chmod -R 755 docker 2>/dev/null || echo "🟡 [ATTENTION] Impossible de modifier les permissions de docker"

# Construire et démarrer
echo "🚀 Construction et démarrage des containers..."
if docker-compose up --build -d; then
    echo "✅ [OK] Containers démarrés"
else
    echo "❌ [ERREUR] Échec du démarrage des containers"
    echo "💡 Vérifiez les logs avec: docker-compose logs"
    exit 1
fi

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 15

# Vérifier l'état des containers
echo "🔍 Vérification de l'état des containers..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ [OK] Au moins un container est démarré"
else
    echo "🟡 [ATTENTION] Aucun container n'est en cours d'exécution"
    echo "💡 Vérifiez avec: docker-compose ps"
fi

# Installer les dépendances PHP (si le container PHP existe)
echo "📦 Installation des dépendances PHP..."
if docker-compose exec -T php composer --version &> /dev/null; then
    if docker-compose exec -T php composer install --no-interaction; then
        echo "✅ [OK] Dépendances PHP installées"
    else
        echo "🟡 [ATTENTION] Impossible d'installer les dépendances PHP"
        echo "💡 Vous pouvez essayer manuellement: docker-compose exec php composer install"
    fi
else
    echo "🟡 [ATTENTION] Container PHP non disponible ou Composer non installé"
fi

# Vérifier les services
echo ""
echo "=== 🌐 Services disponibles ==="
echo "📱 Angular:     http://localhost:4200"
echo "🌐 API PHP:     http://localhost:8000"
echo "🐬 PhpMyAdmin:  http://localhost:8080"

# Tester la connectivité des services
echo ""
echo "🔍 Test de connectivité..."
if curl -s http://localhost:8000 &> /dev/null; then
    echo "✅ [OK] API PHP accessible"
else
    echo "🟡 [ATTENTION] API PHP non accessible"
fi

if curl -s http://localhost:8080 &> /dev/null; then
    echo "✅ [OK] PhpMyAdmin accessible"
else
    echo "🟡 [ATTENTION] PhpMyAdmin non accessible"
fi

if curl -s http://localhost:4200 &> /dev/null; then
    echo "✅ [OK] Angular accessible"
else
    echo "🟡 [ATTENTION] Angular non accessible (normal si pas encore compilé)"
fi

echo ""
echo "🎉 Installation terminée !"
echo "Votre environnement ATKM est prêt sur macOS."
echo ""
echo "📋 Commandes utiles:"
echo "   Arrêter:     docker-compose down"
echo "   Redémarrer:  docker-compose up -d"
echo "   Logs:        docker-compose logs -f"
echo "   État:        docker-compose ps"
