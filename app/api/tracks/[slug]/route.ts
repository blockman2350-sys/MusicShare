import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { isAdmin } from "@/auth";
import { deleteObject, getObjectStream, storageEnabled } from "@/storage";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [t] = await db.select().from(tracks).where(eq(tracks.slug, slug));
  if (!t) return new Response("Not found", { status: 404 });
  const inBucket = Boolean(t.audioKey) && storageEnabled();
  if (!inBucket && !t.data) return new Response("Not found", { status: 404 });
  const data = inBucket ? null : Buffer.from(t.data!);
  const total = data ? data.length : t.size;
  const range = req.headers.get("range");
  const download = new URL(req.url).searchParams.has("download");
  const headers: Record<string, string> = {
    "Content-Type": t.mimeType,
    "Accept-Ranges": "bytes",
  };
  if (download) {
    const ext = t.mimeType.split("/")[1] ?? "audio";
    headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(t.title)}.${ext}"`;
  }
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1]) : 0;
    let end = m && m[2] ? parseInt(m[2]) : total - 1;
    if (m && !m[1] && m[2]) { start = total - parseInt(m[2]); end = total - 1; }
    // Browsers ask for "bytes=0-" (the whole file) just to read a video's
    // header. Serve at most 4MB per response so an abandoned request cannot
    // hold a bucket connection streaming up to 100MB; the player asks again.
    if (m && !m[2]) end = Math.min(end, start + 4 * 1024 * 1024 - 1);
    end = Math.min(end, total - 1);
    if (start === 0) await db.update(tracks).set({ plays: sql`${tracks.plays} + 1` }).where(eq(tracks.id, t.id));
    const body = data
      ? new Uint8Array(data.subarray(start, end + 1))
      : await getObjectStream(t.audioKey!, `bytes=${start}-${end}`, req.signal);
    if (!body) return new Response("Not found", { status: 404 });
    return new Response(body, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  const full = data ? new Uint8Array(data) : await getObjectStream(t.audioKey!, undefined, req.signal);
  if (!full) return new Response("Not found", { status: 404 });
  return new Response(full, { headers: { ...headers, "Content-Length": String(total) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Owner login required" }, { status: 401 });
  const { slug } = await ctx.params;
  const [t] = await db.select({ audioKey: tracks.audioKey, coverKey: tracks.coverKey }).from(tracks).where(eq(tracks.slug, slug));
  await db.delete(tracks).where(eq(tracks.slug, slug));
  if (storageEnabled()) {
    await Promise.allSettled([t?.audioKey, t?.coverKey].filter((k): k is string => !!k).map(deleteObject));
  }
  return Response.json({ ok: true });
}
