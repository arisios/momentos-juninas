const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByLogin, createUser, normalizeInstagram } = require('../../../../shared/users-db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');
const { getUserStatus, STATUS_LABELS } = require('../database/db');

const router = express.Router();

router.post('/register', (req, res) => {
  const { instagram, phone, password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  if (!instagram && !phone) return res.status(400).json({ error: 'Informe @instagram ou telefone' });

  try {
    const user = createUser({ instagram, phone, password });
    const statusLevel = 0;
    const token = jwt.sign({ id: user.id, instagram: user.instagram, phone: user.phone, name: user.name, role: user.role, statusLevel }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { ...user, statusLevel, ...STATUS_LABELS[statusLevel] } });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

router.post('/login', (req, res) => {
  const { identifier, instagram, phone, password } = req.body;
  const login = identifier || instagram || phone;
  if (!login || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

  const user = findUserByLogin(login);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Instagram, telefone ou senha incorretos' });
  }

  const statusLevel = getUserStatus(user.id);
  const token = jwt.sign({ id: user.id, instagram: user.instagram, phone: user.phone, name: user.name, role: user.role, statusLevel }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, instagram: user.instagram, phone: user.phone, name: user.name, role: user.role, statusLevel, ...STATUS_LABELS[statusLevel] } });
});

router.get('/me', authMiddleware, (req, res) => {
  const statusLevel = getUserStatus(req.user.id);
  res.json({ user: { ...req.user, statusLevel, ...STATUS_LABELS[statusLevel] } });
});

module.exports = router;
