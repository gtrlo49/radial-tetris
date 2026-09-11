const express = require('express');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'leaderboard.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

// Save database to disk
function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Get top 20 scores helper
function getTopScores() {
  const stmt = db.prepare('SELECT * FROM leaderboard ORDER BY score DESC LIMIT 20');
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Trim leaderboard to top 20
function trimToTop20() {
  db.run(`
    DELETE FROM leaderboard WHERE id NOT IN (
      SELECT id FROM leaderboard ORDER BY score DESC LIMIT 20
    )
  `);
}

async function main() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      badge TEXT DEFAULT '',
      date TEXT NOT NULL
    )
  `);
  saveDb();

  app.use(express.json());

  // Serve static files from the parent directory (where index.html lives)
  app.use(express.static(path.join(__dirname, '..')));

  // GET /api/leaderboard — top 20 scores
  app.get('/api/leaderboard', (req, res) => {
    const scores = getTopScores();
    res.json(scores);
  });

  // POST /api/leaderboard — insert or replace, trim to top 20
  app.post('/api/leaderboard', (req, res) => {
    const { id, name, score, badge, date } = req.body;

    if (!id || !name || score == null || !date) {
      return res.status(400).json({ error: 'Missing required fields: id, name, score, date' });
    }

    db.run(
      'INSERT OR REPLACE INTO leaderboard (id, name, score, badge, date) VALUES (?, ?, ?, ?, ?)',
      [id, name, score, badge || '', date]
    );

    trimToTop20();
    saveDb();

    const scores = getTopScores();
    res.json({ entryId: id, scores });
  });

  // PUT /api/leaderboard/:id — update existing entry, trim to top 20
  app.put('/api/leaderboard/:id', (req, res) => {
    const { id } = req.params;
    const { score, badge } = req.body;

    if (score == null) {
      return res.status(400).json({ error: 'Missing required field: score' });
    }

    const stmt = db.prepare('SELECT * FROM leaderboard WHERE id = ?');
    stmt.bind([id]);
    let existing = null;
    if (stmt.step()) {
      existing = stmt.getAsObject();
    }
    stmt.free();

    if (!existing) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    db.run(
      'UPDATE leaderboard SET score = ?, badge = ? WHERE id = ?',
      [score, badge !== undefined ? badge : existing.badge, id]
    );

    trimToTop20();
    saveDb();

    const scores = getTopScores();
    res.json(scores);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radial Tetris Defense server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
