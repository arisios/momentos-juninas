const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'momentos-juninas-secret-2026';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito ao administrador' });
    next();
  });
}

module.exports = { JWT_SECRET, authMiddleware, adminMiddleware };
