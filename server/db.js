import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'cricket.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'live',
    league_name TEXT,
    venue TEXT,
    match_overs INTEGER DEFAULT 20,
    innings INTEGER DEFAULT 1,
    target INTEGER,
    batting_team TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    short_name TEXT,
    full_name TEXT,
    color1 TEXT,
    color2 TEXT,
    logo TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT,
    team_id TEXT,
    name TEXT,
    is_batsman INTEGER DEFAULT 1,
    is_bowler INTEGER DEFAULT 1,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS batting_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT,
    player_id INTEGER,
    runs INTEGER DEFAULT 0,
    balls INTEGER DEFAULT 0,
    fours INTEGER DEFAULT 0,
    sixes INTEGER DEFAULT 0,
    is_out INTEGER DEFAULT 0,
    dismissal TEXT,
    has_batted INTEGER DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS bowling_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id TEXT,
    player_id INTEGER,
    balls_bowled INTEGER DEFAULT 0,
    runs_conceded INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    maidens INTEGER DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches(id)
  );

  CREATE TABLE IF NOT EXISTS match_state (
    match_id TEXT PRIMARY KEY,
    runs INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    overs INTEGER DEFAULT 0,
    balls INTEGER DEFAULT 0,
    extras_wd INTEGER DEFAULT 0,
    extras_nb INTEGER DEFAULT 0,
    extras_b INTEGER DEFAULT 0,
    extras_lb INTEGER DEFAULT 0,
    recent_balls TEXT DEFAULT '[]',
    partnership_runs INTEGER DEFAULT 0,
    partnership_balls INTEGER DEFAULT 0,
    current_over_runs INTEGER DEFAULT 0,
    current_over_balls INTEGER DEFAULT 0,
    active_bat1_idx INTEGER DEFAULT 0,
    active_bat2_idx INTEGER DEFAULT 1,
    active_bowler_idx INTEGER DEFAULT 7,
    theme_style TEXT DEFAULT 'icc',
    overlays TEXT DEFAULT '{"lowerThird":true,"fullFrameVs":false,"fullFrameSummary":false,"fullFrameTarget":false}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;