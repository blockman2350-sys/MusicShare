import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getObjectStream, storageEnabled } from "@/storage";

export const runtime = "nodejs";

// Covers are small and requested ~60 at a time by the library page, so keep
// recently used ones in memory (bounded) instead of opening a bucket
// connection for every request. Concurrent requests for one key share a read.
const MAX_CACHE_BYTES = 64 * 1024 * 1024;
const cache = new Map<string, Uint8Array>();
const inflight = new Map<string, Promise<Uint8Array | null>>();
let cacheBytes = 0;

async function loadCover(key: string): Promise<Uint8Array | null> {
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit); // refresh LRU order
    return hit;
  }
  let p = inflight.get(key);
  if (!p) {
    // Not tied to one request's signal: other requests may be waiting on this read.
    p = (async () => {
      const stream = await getObjectStream(key);
      if (!stream) return null;
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
      cache.set(key, bytes);
      cacheBytes += bytes.length;
      for (const [k, v] of cache) {
        if (cacheBytes <= MAX_CACHE_BYTES) break;
        cache.delete(k);
        cacheBytes -= v.length;
      }
      return bytes;
    })().finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const [t] = await db
    .select({ cover: tracks.cover, coverMime: tracks.coverMime, coverKey: tracks.coverKey })
    .from(tracks)
    .where(eq(tracks.slug, slug));
  if (!t?.coverMime) return new Response("Not found", { status: 404 });
  const headers = { "Content-Type": t.coverMime, "Cache-Control": "public, max-age=3600" };
  if (t.coverKey && storageEnabled()) {
    const body = await loadCover(t.coverKey);
    if (!body) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(body), { headers });
  }
  if (!t.cover) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(t.cover)), { headers });
}
