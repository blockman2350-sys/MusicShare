import { db } from "@/db";
import { tracks } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { isAdmin } from "@/auth";
import Uploader from "./Uploader";
import LogoutButton from "./LogoutButton";
import TrackRow from "./TrackRow";
import DefaultCoverEditor from "./DefaultCoverEditor";
import { defaultCoverUrl } from "@/defaultCover";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const admin = await isAdmin();
  const fallbackCover = await defaultCoverUrl();
  const categoryRows = await db
    .select({ category: tracks.category, n: sql<number>`count(*)::int` })
    .from(tracks)
    .groupBy(tracks.category)
    .orderBy(tracks.category);
  const list = await db
    .select({
      slug: tracks.slug, title: tracks.title, artist: tracks.artist, size: tracks.size, plays: tracks.plays,
      createdAt: tracks.createdAt, category: tracks.category,
      hasCover: sql<boolean>`(${tracks.cover} is not null or ${tracks.coverKey} is not null)`,
    })
    .from(tracks)
    .where(category ? eq(tracks.category, category) : undefined)
    .orderBy(desc(tracks.createdAt));
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-indigo-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">🎵 SoundShelf</h1>
        <p className="mt-2 text-zinc-400">Store your music and share it with a link.</p>
        {admin ? <Uploader /> : null}
        {admin ? <DefaultCoverEditor coverUrl={fallbackCover} /> : null}
        <h2 className="mt-12 mb-4 text-xl font-semibold">{category ? `${category} (${list.length})` : `Your library (${list.length})`}</h2>
        {categoryRows.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <Link href="/" className={`rounded-full px-3 py-1 ${!category ? "bg-indigo-500" : "bg-white/10 hover:bg-white/20"}`}>All</Link>
            {categoryRows.map((c) => (
              <a key={c.category} href={`/?category=${encodeURIComponent(c.category)}`}
                className={`rounded-full px-3 py-1 ${category === c.category ? "bg-indigo-500" : "bg-white/10 hover:bg-white/20"}`}>
                {c.category} ({c.n})
              </a>
            ))}
          </div>
        )}
        {list.length === 0 ? (
          <p className="text-zinc-500">No tracks yet — upload your first song above.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((t) => (
              <TrackRow key={t.slug} canDelete={admin} track={{ ...t, createdAt: t.createdAt.toISOString(), coverUrl: t.hasCover ? `/api/tracks/${t.slug}/cover` : fallbackCover }} />
            ))}
          </ul>
        )}
        <footer className="mt-12 text-center">
          {admin ? <LogoutButton /> : <Link href="/login" className="text-xs text-zinc-600 hover:text-zinc-400">Owner login</Link>}
        </footer>
      </div>
    </main>
  );
}
