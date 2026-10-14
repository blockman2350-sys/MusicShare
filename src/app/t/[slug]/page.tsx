import { db } from "@/db";
import { tracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [t] = await db.select({ title: tracks.title, artist: tracks.artist, plays: tracks.plays }).from(tracks).where(eq(tracks.slug, slug));
  if (!t) notFound();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-indigo-950 to-fuchsia-950 p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-6xl">🎵</div>
        <h1 className="mt-6 text-2xl font-bold">{t.title}</h1>
        <p className="text-zinc-400">{t.artist || "Unknown artist"}</p>
        <audio controls autoPlay={false} src={`/api/tracks/${slug}`} className="mt-6 w-full" />
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <a href={`/api/tracks/${slug}?download`} className="rounded-md bg-indigo-500 px-4 py-2 hover:bg-indigo-400">Download</a>
          <a href="/" className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20">SoundShelf</a>
        </div>
        <p className="mt-4 text-xs text-zinc-500">{t.plays} plays</p>
      </div>
    </main>
  );
}
