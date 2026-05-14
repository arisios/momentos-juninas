const express = require('express');
const { getDb, getUserStatus, STATUS_LABELS } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  const albums = db.prepare("SELECT * FROM albums ORDER BY created_at DESC").all();
  const missions = db.prepare('SELECT * FROM missions ORDER BY order_num').all();

  const result = albums.map(album => {
    const uploads = db.prepare(
      'SELECT mission_id FROM uploads WHERE user_id=? AND album_id=?'
    ).all(userId, album.id);
    const completedMissions = uploads.map(u => u.mission_id);
    const completion = db.prepare(
      'SELECT * FROM album_completions WHERE user_id=? AND album_id=?'
    ).get(userId, album.id);

    return {
      ...album,
      completedMissions,
      missionCount: missions.length,
      isCompleted: !!completion,
      progress: Math.round((completedMissions.length / missions.length) * 100),
    };
  });

  const statusLevel = getUserStatus(userId);
  res.json({ albums: result, missions, statusLevel, ...STATUS_LABELS[statusLevel] });
});

router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const albumId = parseInt(req.params.id);

  const album = db.prepare('SELECT * FROM albums WHERE id=?').get(albumId);
  if (!album) return res.status(404).json({ error: 'Álbum não encontrado' });

  const missions = db.prepare('SELECT * FROM missions ORDER BY order_num').all();
  const uploads = db.prepare(
    'SELECT u.*, m.emoji, m.title FROM uploads u JOIN missions m ON u.mission_id=m.id WHERE u.user_id=? AND u.album_id=?'
  ).all(userId, albumId);

  const completion = db.prepare(
    'SELECT * FROM album_completions WHERE user_id=? AND album_id=?'
  ).get(userId, albumId);

  const uploadsByMission = {};
  for (const u of uploads) uploadsByMission[u.mission_id] = u;

  res.json({ album, missions, uploadsByMission, isCompleted: !!completion, completion });
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const albumId = parseInt(req.params.id);
  const { auth_repost = 0, auth_mention = 0, auth_collab = 0, auth_image_use = 0 } = req.body;

  const album = db.prepare("SELECT * FROM albums WHERE id=? AND status IN ('active','ended')").get(albumId);
  if (!album) return res.status(404).json({ error: 'Álbum não encontrado' });

  const missions = db.prepare('SELECT COUNT(*) as c FROM missions').get().c;
  const completed = db.prepare('SELECT COUNT(*) as c FROM uploads WHERE user_id=? AND album_id=?').get(userId, albumId).c;
  if (completed < missions) return res.status(400).json({ error: 'Álbum ainda não completado' });

  db.prepare(`
    INSERT INTO album_completions (user_id, album_id, auth_repost, auth_mention, auth_collab, auth_image_use)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, album_id) DO UPDATE SET
      auth_repost=excluded.auth_repost,
      auth_mention=excluded.auth_mention,
      auth_collab=excluded.auth_collab,
      auth_image_use=excluded.auth_image_use
  `).run(userId, albumId, auth_repost ? 1 : 0, auth_mention ? 1 : 0, auth_collab ? 1 : 0, auth_image_use ? 1 : 0);

  const statusLevel = getUserStatus(userId);
  res.json({ success: true, statusLevel, ...STATUS_LABELS[statusLevel] });
});

module.exports = router;
