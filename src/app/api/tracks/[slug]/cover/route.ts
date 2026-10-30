import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getObjectStream, storageEnabled } from "@/storage";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [t] = await db
    .select({ cover: tracks.cover, coverMime: tracks.coverMime, coverKey: tracks.coverKey })
    .from(tracks)
    .where(eq(tracks.slug, slug));
  if (!t?.coverMime) return new Response("Not found", { status: 404 });
  const headers = { "Content-Type": t.coverMime, "Cache-Control": "public, max-age=3600" };
  if (t.coverKey && storageEnabled()) {
    const body = await getObjectStream(t.coverKey, undefined, req.signal);
    if (!body) return new Response("Not found", { status: 404 });
    return new Response(body, { headers });
  }
  if (!t.cover) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(t.cover)), { headers });
}
