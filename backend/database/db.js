const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database/momentos.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

const MISSIONS_SEED = [
  { order_num: 1, emoji: '🎪', title: 'Foto no Pórtico',         description: 'Cheguei nas Juninas.',      map_x: 50, map_y: 8  },
  { order_num: 2, emoji: '🌽', title: 'Comendo comida típica',    description: 'Missão gastronômica.',       map_x: 22, map_y: 42 },
  { order_num: 3, emoji: '🍻', title: 'Bebendo algo gostoso',     description: 'Brinde na vila.',            map_x: 78, map_y: 28 },
  { order_num: 4, emoji: '💃', title: 'Dançando forró',           description: 'Entrou no arrasta-pé.',     map_x: 48, map_y: 58 },
  { order_num: 5, emoji: '🎶', title: 'Assistindo a banda',       description: 'No clima do show.',         map_x: 35, map_y: 80 },
  { order_num: 6, emoji: '👒', title: 'Assistindo a quadrilha',   description: 'Vivendo a tradição.',       map_x: 72, map_y: 65 },
  { order_num: 7, emoji: '🎡', title: 'Foto nos brinquedos',      description: 'Diversão garantida.',       map_x: 20, map_y: 62 },
  { order_num: 8, emoji: '❤️', title: 'Foto em uma casinha',      description: 'Explorando a vila.',        map_x: 76, map_y: 46 },
  { order_num: 9, emoji: '🎲', title: 'Participou do bingo',      description: 'Tentando a sorte.',         map_x: 18, map_y: 26 },
];

function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instagram TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cover_path TEXT,
      status TEXT NOT NULL DEFAULT 'locked',
      reward_name TEXT,
      reward_image TEXT,
      reward_description TEXT,
      reward_min_missions INTEGER DEFAULT 9,
      reward_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS missions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_num INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      map_x REAL NOT NULL,
      map_y REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      album_id INTEGER NOT NULL,
      mission_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (album_id) REFERENCES albums(id),
      FOREIGN KEY (mission_id) REFERENCES missions(id),
      UNIQUE(user_id, album_id, mission_id)
    );

    CREATE TABLE IF NOT EXISTS album_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      album_id INTEGER NOT NULL,
      auth_repost INTEGER DEFAULT 0,
      auth_mention INTEGER DEFAULT 0,
      auth_collab INTEGER DEFAULT 0,
      auth_image_use INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, album_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (album_id) REFERENCES albums(id)
    );
  `);

  const missionCount = db.prepare('SELECT COUNT(*) as c FROM missions').get().c;
  if (missionCount === 0) {
    const ins = db.prepare('INSERT INTO missions (order_num,emoji,title,description,map_x,map_y) VALUES (?,?,?,?,?,?)');
    for (const m of MISSIONS_SEED) ins.run(m.order_num, m.emoji, m.title, m.description, m.map_x, m.map_y);
    console.log('✅ 9 missões criadas');
  }

  const adminExists = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare("INSERT INTO users (instagram, password, role) VALUES (?, ?, 'admin')").run('admin', hash);
    console.log('✅ Admin criado: instagram=admin, senha=admin123');
  }

  console.log('✅ Banco de dados Momentos Juninas inicializado');
  return db;
}

function getUserStatus(userId) {
  const db = getDb();
  const completions = db.prepare('SELECT COUNT(*) as c FROM album_completions WHERE user_id=?').get(userId).c;
  const totalSeason = db.prepare("SELECT COUNT(*) as c FROM albums WHERE status IN ('active','ended')").get().c;

  if (totalSeason > 0 && completions >= totalSeason) return 3;
  if (completions >= 3) return 2;
  if (completions >= 1) return 1;
  return 0;
}

const STATUS_LABELS = [
  { emoji: '🌽', label: 'Visitante da Vila' },
  { emoji: '🪗', label: 'Forrozeiro Oficial' },
  { emoji: '❤️', label: 'Embaixador do Arrasta-pé' },
  { emoji: '🔥', label: 'Lenda das Juninas' },
];

module.exports = { getDb, initDb, getUserStatus, STATUS_LABELS };
