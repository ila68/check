-- ============================================
-- BLOG CMS - MySQL Database Schema
-- phpMyAdmin me import karo
-- ============================================

CREATE DATABASE IF NOT EXISTS `blog_cms` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `blog_cms`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin','admin','editor','author') NOT NULL DEFAULT 'author',
  `avatar` VARCHAR(500),
  `bio` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `blog_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `description` TEXT,
  `image` VARCHAR(500),
  `meta_title` VARCHAR(255),
  `meta_description` TEXT,
  `canonical_url` VARCHAR(500),
  `og_title` VARCHAR(255),
  `og_description` TEXT,
  `og_image` VARCHAR(500),
  `blog_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `blogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(500) NOT NULL,
  `slug` VARCHAR(500) UNIQUE NOT NULL,
  `excerpt` TEXT,
  `content` LONGTEXT,
  `featured_image` VARCHAR(500),
  `featured_image_alt` VARCHAR(255),
  `category_id` INT,
  `author_id` INT,
  `tags` TEXT DEFAULT '[]',
  `status` ENUM('published','draft','scheduled','trashed') NOT NULL DEFAULT 'draft',
  `scheduled_at` DATETIME,
  `published_at` DATETIME,
  `views` INT DEFAULT 0,
  `meta_title` VARCHAR(255),
  `meta_description` TEXT,
  `focus_keyword` VARCHAR(255),
  `canonical_url` VARCHAR(500),
  `og_title` VARCHAR(255),
  `og_description` TEXT,
  `og_image` VARCHAR(500),
  `article_schema` LONGTEXT,
  `breadcrumb_schema` LONGTEXT,
  `deleted_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `blog_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `blog_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `blog_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `comment` TEXT NOT NULL,
  `status` ENUM('approved','pending','rejected') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `blog_ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `blog_id` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `rating` TINYINT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_rating` (`blog_id`,`email`),
  FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `seo_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(255) UNIQUE NOT NULL,
  `value` TEXT,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `page_seo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `page_identifier` VARCHAR(255) UNIQUE NOT NULL,
  `page_name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255),
  `meta_title` VARCHAR(255),
  `meta_description` TEXT,
  `canonical_url` VARCHAR(500),
  `og_title` VARCHAR(255),
  `og_description` TEXT,
  `og_image` VARCHAR(500),
  `schema_enabled` TINYINT(1) DEFAULT 1,
  `schemas` LONGTEXT,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `faq_schema` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `page_id` INT,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`page_id`) REFERENCES `page_seo`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `media_library` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `size` INT NOT NULL,
  `width` INT,
  `height` INT,
  `alt_text` VARCHAR(255),
  `url` VARCHAR(500) NOT NULL,
  `thumbnail_url` VARCHAR(500),
  `uploaded_by` INT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `action` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(100),
  `entity_id` INT,
  `details` TEXT,
  `ip_address` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX `idx_blogs_status` ON `blogs`(`status`);
CREATE INDEX `idx_blogs_slug` ON `blogs`(`slug`);
CREATE INDEX `idx_blogs_category` ON `blogs`(`category_id`);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Super Admin (password: admin123)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Super Admin', 'superadmin@blogcms.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');

-- Regular Admin (password: admin123)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Admin', 'admin@blogcms.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- SEO Settings
INSERT INTO `seo_settings` (`setting_key`, `value`) VALUES
('site_name', 'Blog CMS'),
('default_meta_title', 'Blog CMS - Your Premier Blog Platform'),
('default_meta_description', 'Discover insightful articles on our blog.'),
('default_og_title', 'Blog CMS'),
('default_og_description', 'Discover insightful articles.'),
('robots_txt', 'User-agent: *\nAllow: /\nDisallow: /admin/');

-- Default Uncategorized category
INSERT INTO `blog_categories` (`name`, `slug`, `description`) VALUES
('Uncategorized', 'uncategorized', 'Default category for blogs without a specific category');

-- Default Page SEO
INSERT INTO `page_seo` (`page_identifier`, `page_name`, `slug`, `meta_title`) VALUES
('home', 'Homepage', '/', 'Welcome to Blog CMS');
