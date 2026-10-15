import { pgTable, serial, text, integer, timestamp, customType } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  artist: text("artist").notNull().default(""),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  plays: integer("plays").notNull().default(0),
  data: bytea("data"), // null once the file lives in the bucket (audioKey)
  audioKey: text("audio_key"),
  category: text("category").notNull().default("Uncategorized"),
  coverMime: text("cover_mime"),
  cover: bytea("cover"),
  coverKey: text("cover_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Site-wide settings. The row with key "default_cover" holds the cover picture
// shown for tracks that have no cover of their own.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  mime: text("mime"),
  data: bytea("data"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
