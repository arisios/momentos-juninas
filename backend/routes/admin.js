const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../database/db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../uploads');

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cover-${Date.now()}${ext}`);
  },
});
const coverUpload = multer({
  storage: coverStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas para capa'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Albums ────────────────────────────────────────────────────
router.get('/albums', adminMiddleware, (req, res) => {
  const db = getDb();
  const albums = db.prepare('SELECT * FROM albums ORDER BY created_at DESC').all();
  const enriched = albums.map(a => {
    const uploadCount = db.prepare('SELECT COUNT(*) as c FROM uploads WHERE album_id=?').get(a.id).c;
    const userCount = db.prepare('SELECT COUNT(DISTINCT user_id) as c FROM uploads WHERE album_id=?').get(a.id).c;
    const completionCount = db.prepare('SELECT COUNT(*) as c FROM album_completions WHERE album_id=?').get(a.id).c;
    return { ...a, uploadCount, userCount, completionCount };
  });
  res.json({ albums: enriched });
});

router.post('/albums', adminMiddleware, coverUpload.single('cover'), (req, res) => {
  const { name, status = 'locked', reward_name, reward_description, reward_min_missions = 9, reward_available = 1 } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome do álbum é obrigatório' });

  const db = getDb();
  const cover_path = req.file ? req.file.filename : null;

  const result = db.prepare(`
    INSERT INTO albums (name, cover_path, status, reward_name, reward_description, reward_min_missions, reward_available)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name.trim(), cover_path, status, reward_name || null, reward_description || null, parseInt(reward_min_missions), reward_available ? 1 : 0);

  const album = db.prepare('SELECT * FROM albums WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json({ album });
});

router.patch('/albums/:id', adminMiddleware, coverUpload.single('cover'), (req, res) => {
  const db = getDb();
  const album = db.prepare('SELECT * FROM albums WHERE id=?').get(parseInt(req.params.id));
  if (!album) return res.status(404).json({ error: 'Álbum não encontrado' });

  const { name, status, reward_name, reward_description, reward_min_missions, reward_available } = req.body;

  let cover_path = album.cover_path;
  if (req.file) {
    if (cover_path) {
      const old = path.join(UPLOADS_DIR, cover_path);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    cover_path = req.file.filename;
  }

  db.prepare(`
    UPDATE albums SET
      name=?, cover_path=?, status=?,
      reward_name=?, reward_description=?, reward_min_missions=?, reward_available=?,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    name?.trim() || album.name,
    cover_path,
    status || album.status,
    reward_name ?? album.reward_name,
    reward_description ?? album.reward_description,
    reward_min_missions ? parseInt(reward_min_missions) : album.reward_min_missions,
    reward_available !== undefined ? (reward_available ? 1 : 0) : album.reward_available,
    album.id
  );

  res.json({ album: db.prepare('SELECT * FROM albums WHERE id=?').get(album.id) });
});

router.delete('/albums/:id', adminMiddleware, (req, res) => {
  const db = getDb();
  const album = db.prepare('SELECT * FROM albums WHERE id=?').get(parseInt(req.params.id));
  if (!album) return res.status(404).json({ error: 'Álbum não encontrado' });

  const uploads = db.prepare('SELECT file_path FROM uploads WHERE album_id=?').all(album.id);
  for (const u of uploads) {
    const p = path.join(UPLOADS_DIR, u.file_path);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (album.cover_path) {
    const p = path.join(UPLOADS_DIR, album.cover_path);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  db.prepare('DELETE FROM uploads WHERE album_id=?').run(album.id);
  db.prepare('DELETE FROM album_completions WHERE album_id=?').run(album.id);
  db.prepare('DELETE FROM albums WHERE id=?').run(album.id);

  res.json({ success: true });
});

// ── Users ─────────────────────────────────────────────────────
router.get('/users', adminMiddleware, (req, res) => {
  const db = getDb();
  const users = db.prepare("SELECT id, instagram, role, created_at FROM users ORDER BY created_at DESC").all();
  const enriched = users.map(u => {
    const uploadCount = db.prepare('SELECT COUNT(*) as c FROM uploads WHERE user_id=?').get(u.id).c;
    const completionCount = db.prepare('SELECT COUNT(*) as c FROM album_completions WHERE user_id=?').get(u.id).c;
    return { ...u, uploadCount, completionCount };
  });
  res.json({ users: enriched });
});

// ── Uploads ───────────────────────────────────────────────────
router.get('/uploads', adminMiddleware, (req, res) => {
  const db = getDb();
  const { album_id } = req.query;
  let query = `
    SELECT up.*, u.instagram, a.name as album_name, m.title as mission_title, m.emoji
    FROM uploads up
    JOIN users u ON up.user_id = u.id
    JOIN albums a ON up.album_id = a.id
    JOIN missions m ON up.mission_id = m.id
  `;
  const params = [];
  if (album_id) { query += ' WHERE up.album_id=?'; params.push(parseInt(album_id)); }
  query += ' ORDER BY up.created_at DESC';
  res.json({ uploads: db.prepare(query).all(...params) });
});

// ── Stats ─────────────────────────────────────────────────────
router.get('/stats', adminMiddleware, (req, res) => {
  const db = getDb();
  res.json({
    stats: {
      totalUsers: db.prepare("SELECT COUNT(*) as c FROM users WHERE role='user'").get().c,
      totalAlbums: db.prepare('SELECT COUNT(*) as c FROM albums').get().c,
      totalUploads: db.prepare('SELECT COUNT(*) as c FROM uploads').get().c,
      totalCompletions: db.prepare('SELECT COUNT(*) as c FROM album_completions').get().c,
    }
  });
});

module.exports = router;
