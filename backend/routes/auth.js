const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, getUserStatus, STATUS_LABELS } = require('../database/db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

function normalizeInstagram(raw) {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

router.post('/register', (req, res) => {
  const { instagram, password } = req.body;
  if (!instagram || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

  const handle = normalizeInstagram(instagram);
  if (handle.length < 2) return res.status(400).json({ error: 'Instagram inválido' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE instagram=?').get(handle)) {
    return res.status(409).json({ error: 'Instagram já cadastrado' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (instagram, password) VALUES (?, ?)").run(handle, hash);

  const statusLevel = 0;
  const token = jwt.sign(
    { id: result.lastInsertRowid, instagram: handle, role: 'user', statusLevel },
    JWT_SECRET, { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, instagram: handle, role: 'user', statusLevel, ...STATUS_LABELS[statusLevel] }
  });
});

router.post('/login', (req, res) => {
  const { instagram, password } = req.body;
  if (!instagram || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

  const handle = normalizeInstagram(instagram);
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE instagram=?').get(handle);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Instagram ou senha incorretos' });
  }

  const statusLevel = getUserStatus(user.id);
  const token = jwt.sign(
    { id: user.id, instagram: user.instagram, role: user.role, statusLevel },
    JWT_SECRET, { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, instagram: user.instagram, role: user.role, statusLevel, ...STATUS_LABELS[statusLevel] }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const statusLevel = getUserStatus(req.user.id);
  res.json({ user: { ...req.user, statusLevel, ...STATUS_LABELS[statusLevel] } });
});

module.exports = router;
