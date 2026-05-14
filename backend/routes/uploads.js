const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb, getUserStatus, STATUS_LABELS } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de arquivo não permitido'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

  const { album_id, mission_id } = req.body;
  if (!album_id || !mission_id) return res.status(400).json({ error: 'album_id e mission_id são obrigatórios' });

  const db = getDb();
  const userId = req.user.id;

  const album = db.prepare("SELECT * FROM albums WHERE id=? AND status='active'").get(parseInt(album_id));
  if (!album) return res.status(403).json({ error: 'Álbum não disponível para uploads' });

  const mission = db.prepare('SELECT id FROM missions WHERE id=?').get(parseInt(mission_id));
  if (!mission) return res.status(404).json({ error: 'Missão não encontrada' });

  const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

  const existing = db.prepare('SELECT file_path FROM uploads WHERE user_id=? AND album_id=? AND mission_id=?')
    .get(userId, parseInt(album_id), parseInt(mission_id));
  if (existing) {
    const oldPath = path.join(UPLOADS_DIR, existing.file_path);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  db.prepare(`
    INSERT INTO uploads (user_id, album_id, mission_id, file_path, file_type, file_size)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, album_id, mission_id) DO UPDATE SET
      file_path=excluded.file_path,
      file_type=excluded.file_type,
      file_size=excluded.file_size,
      created_at=CURRENT_TIMESTAMP
  `).run(userId, parseInt(album_id), parseInt(mission_id), req.file.filename, fileType, req.file.size);

  const missionTotal = db.prepare('SELECT COUNT(*) as c FROM missions').get().c;
  const missionCount = db.prepare('SELECT COUNT(*) as c FROM uploads WHERE user_id=? AND album_id=?').get(userId, parseInt(album_id)).c;
  const justCompleted = missionCount === missionTotal;

  const statusLevel = getUserStatus(userId);

  res.status(201).json({
    upload: { file_path: req.file.filename, file_type: fileType, mission_id: parseInt(mission_id) },
    missionCount,
    missionTotal,
    justCompleted,
    statusLevel,
    ...STATUS_LABELS[statusLevel],
  });
});

module.exports = router;
