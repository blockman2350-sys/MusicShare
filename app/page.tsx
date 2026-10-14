import { db } from "@/db";
import { tracks } from "@/db/schema";
import { desc } from "drizzle-orm";
import Uploader from "./Uploader";
import TrackRow from "./TrackRow";

export const dynamic = "force-dynamic";

export default async function Home() {
  const list = await db
    .select({ slug: tracks.slug, title: tracks.title, artist: tracks.artist, size: tracks.size, plays: tracks.plays, createdAt: tracks.createdAt })
    .from(tracks)
    .orderBy(desc(tracks.createdAt));
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-indigo-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">🎵 SoundShelf</h1>
        <p className="mt-2 text-zinc-400">Store your music and share it with a link.</p>
        <Uploader />
        <h2 className="mt-12 mb-4 text-xl font-semibold">Your library ({list.length})</h2>
        {list.length === 0 ? (
          <p className="text-zinc-500">No tracks yet — upload your first song above.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((t) => (
              <TrackRow key={t.slug} track={{ ...t, createdAt: t.createdAt.toISOString() }} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
