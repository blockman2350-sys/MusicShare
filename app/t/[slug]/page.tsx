import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DEFAULT_ARTIST } from "../../categories";
import { defaultCoverUrl } from "@/defaultCover";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t] = await db.select({ mimeType: tracks.mimeType, title: tracks.title, artist: tracks.artist, plays: tracks.plays, category: tracks.category, hasCover: sql<boolean>`(${tracks.cover} is not null or ${tracks.coverKey} is not null)` }).from(tracks).where(eq(tracks.slug, slug));
  if (!t) notFound();
  const coverUrl = t.hasCover ? `/api/tracks/${slug}/cover` : await defaultCoverUrl();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-indigo-950 to-fuchsia-950 p-4 text-zinc-100">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="mx-auto h-40 w-40 rounded-2xl object-cover" />
        ) : (
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-6xl">🎵</div>
        )}
        <h1 className="mt-6 text-2xl font-bold">{t.title}</h1>
        <p className="text-zinc-400">{t.artist || DEFAULT_ARTIST}</p>
        <p className="mt-2"><span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">{t.category}</span></p>
        {t.mimeType.startsWith("video/") ? (
          <video controls playsInline preload="metadata" src={`/api/tracks/${slug}`} className="mt-6 w-full rounded-xl bg-black" />
        ) : (
          <audio controls autoPlay={false} src={`/api/tracks/${slug}`} className="mt-6 w-full" />
        )}
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <a href={`/api/tracks/${slug}?download`} className="rounded-md bg-indigo-500 px-4 py-2 hover:bg-indigo-400">Download</a>
          <a href="/" className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20">SoundShelf</a>
        </div>
        <p className="mt-4 text-xs text-zinc-500">{t.plays} plays</p>
      </div>
    </main>
  );
}
