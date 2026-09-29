#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
export const defaultMigrationsDir = resolve(here, "../../data/clavis/migrations");

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ALTER_ADD = /^alter\s+table\s+([A-Za-z_][A-Za-z0-9_]*)\s+add\s+column\s+([A-Za-z_][A-Za-z0-9_]*)\b/i;

export function columnExists(db, table, column) {
  if (!IDENT.test(table) || !IDENT.test(column)) throw new Error("bad identifier");
  const rows = db.prepare("PRAGMA table_info(" + table + ")").all();
  return rows.some((row) => String(row.name) === column);
}

function sqlStatements(sql) {
  const stripped = sql.replace(/--[^\n]*/g, "");
  return stripped
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function applyMigrations(db, migrationsDir = defaultMigrationsDir) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
  if (!existsSync(migrationsDir)) return [];
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const applied = new Set(
    db.prepare("SELECT id FROM schema_migrations").all().map((row) => String(row.id))
  );
  const ran = [];
  for (const name of files) {
    const id = name.slice(0, -".sql".length);
    if (applied.has(id)) continue;
    const statements = sqlStatements(readFileSync(join(migrationsDir, name), "utf8"));
    db.exec("BEGIN");
    try {
      for (const statement of statements) {
        const add = statement.match(ALTER_ADD);
        if (add && columnExists(db, add[1], add[2])) continue;
        db.exec(statement);
      }
      db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run(
        id,
        new Date().toISOString()
      );
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
    applied.add(id);
    ran.push(id);
  }
  return ran;
}
