// Moves audio and cover files from Postgres (bytea) into the storage bucket.
// Idempotent: only rows that still hold data and have no key are touched. For
// each file the object is uploaded, its size is checked in the bucket, and only
// then is the database copy cleared. Run by init-db.mjs when bucket variables
// are set, or by hand: node scripts/migrate-to-bucket.mjs
import pg from "pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export async function migrateToBucket(client) {
  const e = process.env;
  if (!(e.BUCKET && e.ENDPOINT && e.ACCESS_KEY_ID && e.SECRET_ACCESS_KEY)) {
    console.log("bucket not configured; skipping file migration");
    return;
  }
  const s3 = new S3Client({
    endpoint: e.ENDPOINT,
    region: e.REGION || "auto",
    forcePathStyle: e.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: e.ACCESS_KEY_ID, secretAccessKey: e.SECRET_ACCESS_KEY },
  });

  async function move(label, slug, key, mime, buf, clearSql) {
    await s3.send(new PutObjectCommand({ Bucket: e.BUCKET, Key: key, Body: buf, ContentType: mime, ContentLength: buf.length }));
    const head = await s3.send(new HeadObjectCommand({ Bucket: e.BUCKET, Key: key }));
    if (head.ContentLength !== buf.length) {
      throw new Error(`${label} ${slug}: bucket has ${head.ContentLength} bytes, expected ${buf.length}`);
    }
    await client.query(clearSql, [key, slug]);
  }

  let moved = 0;
  let failed = 0;
  const audio = await client.query("SELECT slug FROM tracks WHERE data IS NOT NULL AND audio_key IS NULL ORDER BY id");
  for (const { slug } of audio.rows) {
    try {
      const { rows } = await client.query("SELECT data, mime_type FROM tracks WHERE slug = $1", [slug]);
      await move("audio", slug, `audio/${slug}`, rows[0].mime_type, rows[0].data,
        "UPDATE tracks SET audio_key = $1, data = NULL WHERE slug = $2");
      moved++;
    } catch (err) {
      failed++;
      console.error(`migrate audio ${slug} failed:`, err.message);
    }
  }
  const covers = await client.query("SELECT slug FROM tracks WHERE cover IS NOT NULL AND cover_key IS NULL ORDER BY id");
  for (const { slug } of covers.rows) {
    try {
      const { rows } = await client.query("SELECT cover, cover_mime FROM tracks WHERE slug = $1", [slug]);
      await move("cover", slug, `covers/${slug}`, rows[0].cover_mime, rows[0].cover,
        "UPDATE tracks SET cover_key = $1, cover = NULL WHERE slug = $2");
      moved++;
    } catch (err) {
      failed++;
      console.error(`migrate cover ${slug} failed:`, err.message);
    }
  }
  console.log(`bucket migration: ${moved} file(s) moved, ${failed} failed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await migrateToBucket(client);
  await client.end();
}
