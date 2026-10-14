import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [t] = await db.select().from(tracks).where(eq(tracks.slug, slug));
  if (!t) return new Response("Not found", { status: 404 });
  const data = Buffer.from(t.data);
  const total = data.length;
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
    end = Math.min(end, total - 1);
    if (start === 0) await db.update(tracks).set({ plays: sql`${tracks.plays} + 1` }).where(eq(tracks.id, t.id));
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(total) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  await db.delete(tracks).where(eq(tracks.slug, slug));
  return Response.json({ ok: true });
}
