import os
import json
import sqlite3
from pathlib import Path
from typing import Optional, List, Dict, Any

# Try importing PostgreSQL library
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

try:
    import asyncpg
    HAS_ASYNCPG = True
except ImportError:
    HAS_ASYNCPG = False

# ============================================================
# Environment Configuration
# ============================================================

def load_env(env_path=".env"):
    """Load environment variables from .env file"""
    env_vars = {}
    paths_to_check = [Path(env_path), Path("../.env"), Path("../.env.local")]
    for p in paths_to_check:
        if p.exists():
            with open(p) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        v_val = v.strip().strip("'").strip('"')
                        env_vars[k.strip()] = v_val
    return env_vars

ENV = load_env()

# Supabase connection string from environment
SUPABASE_CONN_STRING = (
    ENV.get("SUPABASE_CONN_STRING") or
    os.environ.get("SUPABASE_CONN_STRING")
)

# Validate connection string
if SUPABASE_CONN_STRING and "[YOUR-DB-PASSWORD]" in SUPABASE_CONN_STRING:
    print("[database] WARNING: SUPABASE_CONN_STRING contains placeholder password")
    print("[database] Please update backend/.env with your real Supabase DB password")
    print("[database] Using SQLite fallback for now")
    SUPABASE_CONN_STRING = None

# Database state
is_postgres = False
conn_str = None
db_pool = None

# Setup db connection parameters
if SUPABASE_CONN_STRING and HAS_PSYCOPG2:
    is_postgres = True
    conn_str = SUPABASE_CONN_STRING
    print("[database] [OK] Supabase PostgreSQL connection configured")
else:
    if not HAS_PSYCOPG2:
        print("[database] NOTE: psycopg2 not installed - run: pip install psycopg2-binary")
    is_postgres = False
    conn_str = "data/dealpulse.db"
    Path("data").mkdir(parents=True, exist_ok=True)
    print(f"[database] [LOCAL] Using local SQLite database: {conn_str}")


def get_connection():
    """Get a synchronous database connection"""
    if is_postgres:
        return psycopg2.connect(conn_str)
    else:
        conn = sqlite3.connect(conn_str)
        conn.row_factory = sqlite3.Row
        return conn


def dict_from_row(row):
    """Convert database row to dictionary"""
    if isinstance(row, dict):
        return row
    if hasattr(row, 'keys'):
        return dict(row)
    return row


def init_db():
    """Initialize database tables and seed initial data"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        if is_postgres:
            # PostgreSQL tables with proper types
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                role VARCHAR(20) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
                deal_id VARCHAR(50) NOT NULL,
                client_name VARCHAR(100),
                deal_value DOUBLE PRECISION DEFAULT 0,
                industry VARCHAR(50),
                predicted_stage VARCHAR(50) NOT NULL,
                confidence DOUBLE PRECISION NOT NULL,
                all_scores TEXT NOT NULL,
                top_words TEXT NOT NULL,
                created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY,
                prediction_id INTEGER REFERENCES predictions(id) ON DELETE CASCADE,
                type VARCHAR(20) NOT NULL,
                date VARCHAR(20) NOT NULL,
                subject VARCHAR(200) NOT NULL,
                notes TEXT,
                duration INTEGER,
                participant VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Create indexes
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_predictions_user_id
            ON predictions(created_by_user_id);
            """)

            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_predictions_timestamp
            ON predictions(timestamp DESC);
            """)

        else:
            # SQLite tables
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                full_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deal_id TEXT NOT NULL,
                client_name TEXT,
                deal_value REAL DEFAULT 0,
                industry TEXT,
                predicted_stage TEXT NOT NULL,
                confidence REAL NOT NULL,
                all_scores TEXT NOT NULL,
                top_words TEXT NOT NULL,
                created_by_user_id INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by_user_id) REFERENCES users(id)
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id INTEGER,
                type TEXT NOT NULL,
                date TEXT NOT NULL,
                subject TEXT NOT NULL,
                notes TEXT,
                duration INTEGER,
                participant TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
            );
            """)

        conn.commit()
        print("[database] Tables initialized successfully")

        # Seed users if empty
        cursor.execute("SELECT COUNT(*) FROM users;")
        count = cursor.fetchone()[0]
        if count == 0:
            print("[database] Seeding initial users...")
            users = [
                ("sarah_rep", "representative", "Sarah Johnson"),
                ("david_mgr", "manager", "David Manager"),
                ("alex_rep", "representative", "Alex Chen")
            ]
            for username, role, full_name in users:
                if is_postgres:
                    cursor.execute(
                        "INSERT INTO users (username, role, full_name) VALUES (%s, %s, %s) ON CONFLICT (username) DO NOTHING;",
                        (username, role, full_name)
                    )
                else:
                    cursor.execute(
                        "INSERT OR IGNORE INTO users (username, role, full_name) VALUES (?, ?, ?);",
                        (username, role, full_name)
                    )
            conn.commit()
            print("[database] Users seeded")

        # Seed predictions if empty
        cursor.execute("SELECT COUNT(*) FROM predictions;")
        pred_count = cursor.fetchone()[0]
        if pred_count == 0:
            print("[database] Seeding sample predictions...")
            cursor.execute("SELECT id, username FROM users;")
            rows = cursor.fetchall()
            if is_postgres:
                user_map = {r[1]: r[0] for r in rows}
            else:
                user_map = {r["username"]: r["id"] for r in rows}

            sarah_id = user_map.get("sarah_rep", 1)
            alex_id = user_map.get("alex_rep", 3)

            mock_preds = [
                ("DEAL-1001", "Tesla Corp", 95000.0, "Automotive", "Prospecting", 0.85,
                 {"Prospecting": 0.85, "Engaging": 0.10, "Won": 0.03, "Lost": 0.02},
                 [{"word": "initial contact", "score": 0.85}, {"word": "meeting scheduled", "score": 0.72}], sarah_id),
                ("DEAL-1002", "Microsoft", 150000.0, "Technology", "Engaging", 0.92,
                 {"Prospecting": 0.05, "Engaging": 0.92, "Won": 0.02, "Lost": 0.01},
                 [{"word": "demo", "score": 0.92}, {"word": "pricing discussion", "score": 0.80}], sarah_id),
                ("DEAL-2001", "Apple Inc", 220000.0, "Technology", "Won", 0.99,
                 {"Prospecting": 0.01, "Engaging": 0.00, "Won": 0.99, "Lost": 0.00},
                 [{"word": "contract signed", "score": 0.99}, {"word": "deployment", "score": 0.98}], alex_id),
                ("DEAL-2002", "Uber", 45000.0, "Transportation", "Lost", 0.95,
                 {"Prospecting": 0.01, "Engaging": 0.02, "Won": 0.02, "Lost": 0.95},
                 [{"word": "competitor selected", "score": 0.95}, {"word": "budget cut", "score": 0.88}], alex_id)
            ]

            for d_id, client, val, ind, stage, conf, scores, words, u_id in mock_preds:
                if is_postgres:
                    cursor.execute(
                        """INSERT INTO predictions (deal_id, client_name, deal_value, industry,
                           predicted_stage, confidence, all_scores, top_words, created_by_user_id)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);""",
                        (d_id, client, val, ind, stage, conf, json.dumps(scores), json.dumps(words), u_id)
                    )
                else:
                    cursor.execute(
                        """INSERT INTO predictions (deal_id, client_name, deal_value, industry,
                           predicted_stage, confidence, all_scores, top_words, created_by_user_id)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);""",
                        (d_id, client, val, ind, stage, conf, json.dumps(scores), json.dumps(words), u_id)
                    )

            conn.commit()
            print("[database] Sample predictions seeded")

    except Exception as e:
        conn.rollback()
        print(f"[database] Error initializing database: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    init_db()
