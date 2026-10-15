import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_COVER_KEY = "default_cover";

/** URL of the default cover (versioned so edits show immediately), or null when none is set. */
export async function defaultCoverUrl(): Promise<string | null> {
  const [row] = await db
    .select({ updatedAt: settings.updatedAt, hasData: settings.data })
    .from(settings)
    .where(eq(settings.key, DEFAULT_COVER_KEY));
  if (!row?.hasData) return null;
  return `/api/default-cover?v=${row.updatedAt.getTime()}`;
}
