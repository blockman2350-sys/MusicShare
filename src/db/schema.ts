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
  data: bytea("data").notNull(),
  category: text("category").notNull().default("Uncategorized"),
  coverMime: text("cover_mime"),
  cover: bytea("cover"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
