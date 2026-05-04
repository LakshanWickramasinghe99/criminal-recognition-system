# criminal_db.py
import sqlite3
import numpy as np
import json
import hashlib
import os
from datetime import datetime

DB_PATH = "criminal_registry.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()

    # Core criminals table
    c.execute("""
        CREATE TABLE IF NOT EXISTS criminals (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            criminal_id     TEXT UNIQUE NOT NULL,
            name            TEXT NOT NULL,
            age             INTEGER,
            crime_history   TEXT,
            embedding       TEXT NOT NULL,
            registered_at   TEXT NOT NULL,
            -- Personal
            dob             TEXT,
            nic_number      TEXT,
            gender          TEXT,
            nationality     TEXT DEFAULT 'Sri Lankan',
            address         TEXT,
            phone           TEXT,
            occupation      TEXT,
            height_cm       INTEGER,
            weight_kg       INTEGER,
            eye_color       TEXT,
            distinguishing_marks TEXT,
            -- Officer
            officer_id      TEXT,
            officer_name    TEXT,
            badge_number    TEXT,
            station         TEXT,
            rank            TEXT
        )
    """)

    # Crimes table
    c.execute("""
        CREATE TABLE IF NOT EXISTS crimes (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            criminal_id     TEXT NOT NULL,
            case_id         TEXT NOT NULL,
            crime_type      TEXT NOT NULL,
            crime_description TEXT,
            crime_date      TEXT,
            crime_location  TEXT,
            crime_status    TEXT DEFAULT 'Wanted',
            weapons_used    TEXT,
            victims_count   INTEGER,
            damage_value    TEXT,
            created_at      TEXT NOT NULL,
            FOREIGN KEY (criminal_id) REFERENCES criminals(criminal_id)
        )
    """)

    # Evidence table
    c.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            criminal_id     TEXT NOT NULL,
            evidence_id     TEXT NOT NULL,
            evidence_type   TEXT NOT NULL,
            description     TEXT,
            file_hash       TEXT,
            file_path       TEXT,
            collected_by    TEXT,
            collected_date  TEXT,
            storage_location TEXT,
            blockchain_tx   TEXT,
            created_at      TEXT NOT NULL,
            FOREIGN KEY (criminal_id) REFERENCES criminals(criminal_id)
        )
    """)

    # Court decisions table
    c.execute("""
        CREATE TABLE IF NOT EXISTS court_decisions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            criminal_id     TEXT NOT NULL,
            decision_id     TEXT NOT NULL,
            court_name      TEXT NOT NULL,
            judge_name      TEXT,
            case_number     TEXT,
            hearing_date    TEXT,
            verdict         TEXT,
            sentence        TEXT,
            sentence_start  TEXT,
            sentence_end    TEXT,
            appeal_status   TEXT,
            notes           TEXT,
            blockchain_tx   TEXT,
            created_at      TEXT NOT NULL,
            FOREIGN KEY (criminal_id) REFERENCES criminals(criminal_id)
        )
    """)

    # Identifications table
    c.execute("""
        CREATE TABLE IF NOT EXISTS identifications (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            criminal_id     TEXT NOT NULL,
            video_file      TEXT,
            timestamp       REAL,
            confidence      REAL,
            frame_count     INTEGER,
            detected_at     TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized!")

# ── Criminal ──────────────────────────────────────────────
def register_criminal(criminal_id, name, age, crime_history,
                      embedding, extra=None):
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    try:
        extra = extra or {}
        c.execute("""
            INSERT INTO criminals
            (criminal_id, name, age, crime_history, embedding,
             registered_at, dob, nic_number, gender, nationality,
             address, phone, occupation, height_cm, weight_kg,
             eye_color, distinguishing_marks,
             officer_id, officer_name, badge_number, station, rank)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            criminal_id, name, age, crime_history,
            json.dumps(embedding.tolist()),
            datetime.now().isoformat(),
            extra.get('dob'), extra.get('nic_number'),
            extra.get('gender'), extra.get('nationality','Sri Lankan'),
            extra.get('address'), extra.get('phone'),
            extra.get('occupation'), extra.get('height_cm'),
            extra.get('weight_kg'), extra.get('eye_color'),
            extra.get('distinguishing_marks'),
            extra.get('officer_id'), extra.get('officer_name'),
            extra.get('badge_number'), extra.get('station'),
            extra.get('rank'),
        ))
        conn.commit()
        print(f"Registered: {name} (ID: {criminal_id})")
        return True
    except sqlite3.IntegrityError:
        print(f"Criminal ID {criminal_id} already exists!")
        return False
    finally:
        conn.close()

def get_all_criminals():
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("SELECT criminal_id, name, embedding FROM criminals")
    rows = c.fetchall()
    conn.close()
    return [{
        "criminal_id": r[0],
        "name":        r[1],
        "embedding":   np.array(json.loads(r[2]))
    } for r in rows]

def get_criminal_full(criminal_id):
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("SELECT * FROM criminals WHERE criminal_id=?",
              (criminal_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return None
    cols = [d[0] for d in c.description]
    data = dict(zip(cols, row))
    # Get crimes
    c.execute("SELECT * FROM crimes WHERE criminal_id=?",
              (criminal_id,))
    data['crimes'] = [dict(zip([d[0] for d in c.description], r))
                      for r in c.fetchall()]
    # Get evidence
    c.execute("SELECT * FROM evidence WHERE criminal_id=?",
              (criminal_id,))
    data['evidences'] = [dict(zip([d[0] for d in c.description], r))
                         for r in c.fetchall()]
    # Get court decisions
    c.execute("SELECT * FROM court_decisions WHERE criminal_id=?",
              (criminal_id,))
    data['court_decisions'] = [
        dict(zip([d[0] for d in c.description], r))
        for r in c.fetchall()
    ]
    conn.close()
    return data

# ── Crime ─────────────────────────────────────────────────
def add_crime(criminal_id, case_id, crime_type,
              crime_description=None, crime_date=None,
              crime_location=None, crime_status='Wanted',
              weapons_used=None, victims_count=None,
              damage_value=None):
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("""
        INSERT INTO crimes
        (criminal_id, case_id, crime_type, crime_description,
         crime_date, crime_location, crime_status, weapons_used,
         victims_count, damage_value, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (criminal_id, case_id, crime_type, crime_description,
          crime_date, crime_location, crime_status, weapons_used,
          victims_count, damage_value, datetime.now().isoformat()))
    conn.commit()
    conn.close()

# ── Evidence ──────────────────────────────────────────────
def add_evidence(criminal_id, evidence_id, evidence_type,
                 description=None, file_path=None,
                 collected_by=None, collected_date=None,
                 storage_location=None, blockchain_tx=None):
    # Compute file hash if file exists
    file_hash = None
    if file_path and os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()

    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("""
        INSERT INTO evidence
        (criminal_id, evidence_id, evidence_type, description,
         file_hash, file_path, collected_by, collected_date,
         storage_location, blockchain_tx, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (criminal_id, evidence_id, evidence_type, description,
          file_hash, file_path, collected_by, collected_date,
          storage_location, blockchain_tx, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return file_hash

# ── Court Decision ────────────────────────────────────────
def add_court_decision(criminal_id, decision_id, court_name,
                       judge_name=None, case_number=None,
                       hearing_date=None, verdict=None,
                       sentence=None, sentence_start=None,
                       sentence_end=None, appeal_status=None,
                       notes=None, blockchain_tx=None):
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("""
        INSERT INTO court_decisions
        (criminal_id, decision_id, court_name, judge_name,
         case_number, hearing_date, verdict, sentence,
         sentence_start, sentence_end, appeal_status, notes,
         blockchain_tx, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (criminal_id, decision_id, court_name, judge_name,
          case_number, hearing_date, verdict, sentence,
          sentence_start, sentence_end, appeal_status, notes,
          blockchain_tx, datetime.now().isoformat()))
    conn.commit()
    conn.close()

# ── Identification ────────────────────────────────────────
def log_identification(criminal_id, video_file,
                       timestamp, confidence, frame_count):
    conn = sqlite3.connect(DB_PATH)
    c    = conn.cursor()
    c.execute("""
        INSERT INTO identifications
        (criminal_id, video_file, timestamp,
         confidence, frame_count, detected_at)
        VALUES (?,?,?,?,?,?)
    """, (criminal_id, video_file, timestamp,
          confidence, frame_count, datetime.now().isoformat()))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database ready at:", DB_PATH)