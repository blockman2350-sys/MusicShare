"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES, DEFAULT_ARTIST } from "./categories";

type Item = { file: File; title: string; artist: string; cover: File | null; status: "pending" | "uploading" | "done" | "error"; error?: string };

const input = "rounded-lg bg-black/30 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400";

export default function Uploader() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (i: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  function pick(files: FileList | null) {
    if (!files) return;
    const added: Item[] = Array.from(files).map((file) => ({
      file, title: file.name.replace(/\.[^.]+$/, ""), artist: DEFAULT_ARTIST, cover: null, status: "pending",
    }));
    setItems((prev) => [...prev, ...added]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.status === "done") continue;
      update(i, { status: "uploading", error: undefined });
      const fd = new FormData();
      fd.append("file", it.file);
      fd.append("title", it.title);
      fd.append("artist", it.artist);
      fd.append("category", category);
      if (it.cover) fd.append("cover", it.cover);
      try {
        const res = await fetch("/api/tracks", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
        update(i, { status: "done" });
      } catch (err) {
        update(i, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
      }
    }
    setBusy(false);
    setItems((prev) => prev.filter((it) => it.status !== "done"));
    router.refresh();
  }

  const pending = items.filter((it) => it.status !== "done").length;

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-400/40 p-6 text-center hover:bg-white/5">
        <span className="text-3xl">⬆️</span>
        <span className="mt-2 text-sm text-zinc-300">Choose audio files (MP3, WAV, OGG, M4A… up to 50MB each) or MP4 videos (up to 100MB each)</span>
        <input type="file" accept="audio/*,video/mp4,.mp4" multiple className="hidden" disabled={busy}
          onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      </label>

      {items.length > 0 && (
        <>
          <div>
            <input list="categories" value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (applies to all) — pick or type your own" className={`${input} w-full`} />
            <datalist id="categories">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <ul className="space-y-3">
            {items.map((it, i) => (
              <li key={i} className="rounded-xl bg-black/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <span className="truncate">{it.file.name}</span>
                  <span className={it.status === "error" ? "text-red-400" : ""}>
                    {it.status === "uploading" ? "Uploading…" : it.status === "error" ? it.error : ""}
                  </span>
                  {!busy && <button type="button" onClick={() => setItems((p) => p.filter((_, k) => k !== i))} className="hover:text-red-400">Remove</button>}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={it.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title" className={input} />
                  <input value={it.artist} onChange={(e) => update(i, { artist: e.target.value })} placeholder="Artist" className={input} />
                </div>
                <label className="flex items-center gap-3 text-sm text-zinc-400">
                  {it.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(it.cover)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">🖼️</span>
                  )}
                  <span className="cursor-pointer hover:text-zinc-200">{it.cover ? it.cover.name : "Add cover picture (optional)"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={busy}
                    onChange={(e) => update(i, { cover: e.target.files?.[0] ?? null })} />
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      <button disabled={pending === 0 || busy} className="w-full rounded-lg bg-indigo-500 py-2 font-semibold hover:bg-indigo-400 disabled:opacity-40">
        {busy ? "Uploading…" : pending > 1 ? `Upload ${pending} tracks` : "Upload"}
      </button>
    </form>
  );
}
