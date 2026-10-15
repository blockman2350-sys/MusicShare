import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [t] = await db.select({ cover: tracks.cover, coverMime: tracks.coverMime }).from(tracks).where(eq(tracks.slug, slug));
  if (!t?.cover || !t.coverMime) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(t.cover)), {
    headers: { "Content-Type": t.coverMime, "Cache-Control": "public, max-age=3600" },
  });
}
