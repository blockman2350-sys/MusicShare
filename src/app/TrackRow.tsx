"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_ARTIST } from "./categories";

type T = { slug: string; mimeType: string; title: string; artist: string; size: number; plays: number; createdAt: string; category: string; coverUrl: string | null };

export default function TrackRow({ track, canDelete = false }: { track: T; canDelete?: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const share = () => {
    navigator.clipboard.writeText(`${location.origin}/t/${track.slug}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const del = async () => {
    if (!confirm(`Delete "${track.title}"?`)) return;
    await fetch(`/api/tracks/${track.slug}`, { method: "DELETE" });
    router.refresh();
  };
  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.coverUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl">🎵</div>
          )}
          <div>
          <a href={`/t/${track.slug}`} className="font-semibold hover:underline">{track.title}</a>
          <p className="text-sm text-zinc-400">
            {track.artist || DEFAULT_ARTIST} · {(track.size / 1048576).toFixed(1)} MB · {track.plays} plays
          </p>
          <a href={`/?category=${encodeURIComponent(track.category)}`} className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300 hover:bg-white/20">{track.category}</a>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={share} className="rounded-md bg-indigo-500 px-3 py-1 hover:bg-indigo-400">{copied ? "Copied!" : "Copy link"}</button>
          {canDelete && <button onClick={del} className="rounded-md bg-white/10 px-3 py-1 hover:bg-red-500">Delete</button>}
        </div>
      </div>
      {track.mimeType.startsWith("video/") ? (
        <video controls playsInline preload="none" src={`/api/tracks/${track.slug}`} className="mt-3 w-full rounded-lg bg-black" />
      ) : (
        <audio controls preload="none" src={`/api/tracks/${track.slug}`} className="mt-3 w-full" />
      )}
    </li>
  );
}
