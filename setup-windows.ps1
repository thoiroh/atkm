# Configuration ATKM pour Windows 11
Write-Host "Configuration ATKM pour Windows 11" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Vérifier les prérequis
Write-Host "Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier Docker
try {
    docker --version | Out-Null
    Write-Host "[OK] Docker est installé" -ForegroundColor Green
}
catch {
    Write-Host "[ERREUR] Docker n'est pas installé. Veuillez installer Docker Desktop." -ForegroundColor Red
    exit 1
}

# Vérifier Node.js
try {
    node --version | Out-Null
    Write-Host "[OK] Node.js est installé" -ForegroundColor Green
}
catch {
    Write-Host "[ERREUR] Node.js n'est pas installé. Veuillez installer Node.js 20.x" -ForegroundColor Red
    exit 1
}

# Copier le fichier d'environnement Windows
Write-Host "Configuration de l'environnement Windows..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    if (Test-Path ".env.windows") {
        Copy-Item ".env.windows" ".env"
        Write-Host "[OK] Fichier .env créé pour Windows" -ForegroundColor Green
    }
    else {
        Write-Host "[ATTENTION] Fichier .env.windows introuvable" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[INFO] Fichier .env existe déjà" -ForegroundColor Blue
}

# Créer les dossiers nécessaires si manquants
Write-Host "Vérification de la structure des dossiers..." -ForegroundColor Yellow
$folders = @(
    "atkm_back/public",
    "atkm_back/src/app",
    "atkm/src/app",
    "database",
    "docker/php",
    "docker/nginx"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "[CRÉÉ] Dossier: $folder" -ForegroundColor Yellow
    }
}

# Vérifier que docker-compose.yml existe
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "[ERREUR] Fichier docker-compose.yml introuvable" -ForegroundColor Red
    exit 1
}

# Construire et démarrer
Write-Host "Construction et démarrage des containers..." -ForegroundColor Yellow
try {
    docker-compose up --build -d
    Write-Host "[OK] Containers démarrés" -ForegroundColor Green
}
catch {
    Write-Host "[ERREUR] Échec du démarrage des containers" -ForegroundColor Red
    exit 1
}

# Attendre que les services soient prêts
Write-Host "Attente du démarrage des services..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Installer les dépendances PHP (si le container PHP existe)
Write-Host "Installation des dépendances PHP..." -ForegroundColor Yellow
try {
    docker-compose exec -T php composer install --no-interaction
    Write-Host "[OK] Dépendances PHP installées" -ForegroundColor Green
}
catch {
    Write-Host "[ATTENTION] Impossible d'installer les dépendances PHP" -ForegroundColor Yellow
    Write-Host "Vous pouvez essayer manuellement: docker-compose exec php composer install" -ForegroundColor Yellow
}

# Vérifier les services
Write-Host ""
Write-Host "=== Services disponibles ===" -ForegroundColor Green
Write-Host "Angular:     http://localhost:4200" -ForegroundColor Cyan
Write-Host "API PHP:     http://localhost:8000" -ForegroundColor Cyan
Write-Host "PhpMyAdmin:  http://localhost:8080" -ForegroundColor Cyan

Write-Host ""
Write-Host "Installation terminée !" -ForegroundColor Green
Write-Host "Votre environnement ATKM est prêt sur Windows 11." -ForegroundColor Green
Write-Host ""
Write-Host "Pour arrêter: docker-compose down" -ForegroundColor Yellow
Write-Host "Pour redémarrer: docker-compose up -d" -ForegroundColor Yellow
