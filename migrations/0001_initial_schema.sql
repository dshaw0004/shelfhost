-- Migration: 0001_initial_schema
-- Creates the initial tables for the Shelfhost app

-- PDF file metadata
CREATE TABLE IF NOT EXISTS pdfs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  r2_key      TEXT NOT NULL UNIQUE,
  size        INTEGER NOT NULL,
  page_count  INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id          TEXT PRIMARY KEY,
  pdf_id      TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL,
  label       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(pdf_id, page)
);

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
  id          TEXT PRIMARY KEY,
  pdf_id      TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL,
  text        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#FFFF00',
  rects       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reading progress
CREATE TABLE IF NOT EXISTS reading_progress (
  pdf_id      TEXT PRIMARY KEY REFERENCES pdfs(id) ON DELETE CASCADE,
  page        INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
