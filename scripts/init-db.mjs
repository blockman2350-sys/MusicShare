// Non-interactive schema setup, run as the Railway pre-deploy command.
// Mirrors src/db/schema.ts. Safe to run on every deploy.
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(`
  CREATE TABLE IF NOT EXISTS tracks (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    artist text NOT NULL DEFAULT '',
    mime_type text NOT NULL,
    size integer NOT NULL,
    plays integer NOT NULL DEFAULT 0,
    data bytea NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )
`);
// Columns added after the first release; safe to repeat.
await client.query(`
  ALTER TABLE tracks
    ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Uncategorized',
    ADD COLUMN IF NOT EXISTS cover_mime text,
    ADD COLUMN IF NOT EXISTS cover bytea
`);
await client.query(`
  CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    mime text,
    data bytea,
    updated_at timestamp NOT NULL DEFAULT now()
  )
`);
await client.end();
console.log("tracks table ready");
