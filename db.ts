import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
const dbPath = path.resolve(process.cwd(), 'quiz_app.sqlite');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for maximum performance and reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initDatabase() {
  // 1. Admins
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 2. Quizzes
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 15,
      total_marks REAL NOT NULL DEFAULT 20,
      pass_mark REAL NOT NULL DEFAULT 10,
      questions_per_attempt INTEGER NOT NULL DEFAULT 10,
      negative_marking REAL NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      show_results_immediately INTEGER NOT NULL DEFAULT 1,
      shuffle_options INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 3. Questions
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      question_text TEXT NOT NULL,
      marks REAL NOT NULL DEFAULT 1,
      explanation TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 4. Question Options
  db.exec(`
    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      option_key TEXT NOT NULL CHECK(option_key IN ('A', 'B', 'C', 'D')),
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 5. Quiz Question Bank
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_question_bank (
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (quiz_id, question_id)
    );
  `);

  // 6. Participants
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      normalized_phone TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);

  // 7. Quiz Attempts
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      normalized_phone TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('in-progress', 'submitted', 'timed-out')),
      started_at INTEGER NOT NULL,
      deadline_at INTEGER NOT NULL,
      submitted_at INTEGER,
      score REAL DEFAULT 0,
      total_possible_score REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      passed INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      UNIQUE(quiz_id, normalized_phone)
    );
  `);

  // 8. Attempt Questions
  db.exec(`
    CREATE TABLE IF NOT EXISTS attempt_questions (
      attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      display_order INTEGER NOT NULL,
      shuffled_options_json TEXT,
      PRIMARY KEY (attempt_id, question_id)
    );
  `);

  // 9. Attempt Answers
  db.exec(`
    CREATE TABLE IF NOT EXISTS attempt_answers (
      attempt_id TEXT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_option_id TEXT,
      is_correct INTEGER,
      score_awarded REAL,
      answered_at INTEGER,
      PRIMARY KEY (attempt_id, question_id)
    );
  `);

  // Create indexes for high-speed queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_phone ON quiz_attempts(normalized_phone);
    CREATE INDEX IF NOT EXISTS idx_quiz_bank_quiz ON quiz_question_bank(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id);
  `);

}
