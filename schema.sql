-- =============================================================
--  LiceoVisiTrack — Database Schema
--  Generated: 2026-04-20
--  Run this file on a fresh MySQL instance to recreate the DB.
-- =============================================================

CREATE DATABASE IF NOT EXISTS liceo_visitrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE liceo_visitrack;

-- -------------------------------------------------------------
-- Table: campus
-- Stores the different campuses visitors can be assigned to.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campus (
  campus_id   INT          NOT NULL AUTO_INCREMENT,
  campus_name VARCHAR(100) NOT NULL,
  PRIMARY KEY (campus_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: users
-- Stores admin/staff accounts. Passwords are bcrypt-hashed.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id      INT          NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(100) NOT NULL,
  position     VARCHAR(100) NOT NULL DEFAULT '',
  password     VARCHAR(255) NOT NULL,
  created_date DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: visitor
-- Logs every visitor entry/exit.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitor (
  visitor_id    INT          NOT NULL AUTO_INCREMENT,
  visitor_name  VARCHAR(150) NOT NULL,
  date_time_in  DATETIME     NOT NULL,
  date_time_out DATETIME     NULL DEFAULT NULL,
  photo         TEXT         NULL DEFAULT NULL,
  purpose       VARCHAR(255) NULL DEFAULT NULL,
  campus_id     INT          NOT NULL,
  userID        INT          NOT NULL,
  PRIMARY KEY (visitor_id),
  CONSTRAINT fk_visitor_campus FOREIGN KEY (campus_id) REFERENCES campus (campus_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_visitor_user   FOREIGN KEY (userID)    REFERENCES users   (user_id)  ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
--  Seed Data
-- =============================================================

-- Default campuses (add or adjust to match your school setup)
INSERT IGNORE INTO campus (campus_id, campus_name) VALUES
  (1, 'Main Campus'),
  (2, 'Campus 2'),
  (3, 'Campus 3');

-- Default admin account
-- Email    : admin@liceo.edu.ph
-- Password : admin123  (bcrypt hash below — change after first login!)
INSERT IGNORE INTO users (name, email, position, password) VALUES (
  'Admin',
  'admin@liceo.edu.ph',
  'Administrator',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVoxOiC3Oy'
);
