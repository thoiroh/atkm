-- database/init/01-init.sql
-- 🗄️ Script d'initialisation MySQL pour Tom
-- Ce fichier est exécuté automatiquement au premier démarrage
-- 📋 Création de la base de données (au cas où)
CREATE DATABASE IF NOT EXISTS atkmtb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE atkmtb;
-- 👤 Table des utilisateurs (exemple)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
-- 📝 Table des articles/posts (exemple)
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  user_id INT,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE
  SET NULL
);
-- 🏷️ Table des catégories (exemple)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 🔗 Table de liaison posts-catégories (exemple)
CREATE TABLE IF NOT EXISTS post_categories (
  post_id INT,
  category_id INT,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
-- 📊 Données d'exemple pour tester
INSERT IGNORE INTO users (username, email, password, first_name, last_name)
VALUES (
    'tom',
    'tom@atkmtb.com',
    '$2y$10$example_hash_password',
    'Tom',
    'Barth'
  ),
  (
    'cesar',
    'cesar@atkmtb.com',
    '$2y$10$example_hash_password',
    'César',
    'Renta'
  ),
  (
    'claudia',
    'claudia@atkmtb.com',
    '$2y$10$example_hash_password',
    'Claudia',
    'Muaddib'
  );
INSERT IGNORE INTO categories (name, slug, description)
VALUES (
    'Technologie',
    'technologie',
    'Articles sur les nouvelles technologies'
  ),
  (
    'Business',
    'business',
    'Articles sur le business et entrepreneuriat'
  ),
  (
    'Développement',
    'developpement',
    'Articles sur le développement web'
  );
INSERT IGNORE INTO posts (
    title,
    slug,
    content,
    excerpt,
    user_id,
    status,
    published_at
  )
VALUES (
    'Projet ATK.AI.TB avec Docker',
    'projet-atkmtb-docker',
    'Ceci est le contenu de notre premier article créé automatiquement avec Docker pour le projet ATK.AI.TB !',
    'Un article d''exemple créé automatiquement pour ATK.AI.TB...',
    1,
    'published',
    NOW()
  ),
  (
    'Angular 20.1.3 et PHP 8.2.12 ensemble',
    'angular-php-version-exacte',
    'Comment bien intégrer Angular 20.1.3 avec un backend PHP 8.2.12 dans Docker...',
    'Guide d''intégration Angular 20.1.3 + PHP 8.2.12',
    1,
    'published',
    NOW()
  );
-- 🔗 Liaison des articles aux catégories
INSERT IGNORE INTO post_categories (post_id, category_id)
VALUES (1, 1),
  (1, 3),
  -- Premier article: Technologie + Développement
  (2, 3);
-- Deuxième article: Développement
-- ✅ Message de confirmation
SELECT '🎉 Base de données ATK.AI.TB initialisée avec succès pour Tom !' as message;
