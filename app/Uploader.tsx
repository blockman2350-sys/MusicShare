"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Uploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setErr("");
    const fd = new FormData();
    fd.append("file", file); fd.append("title", title); fd.append("artist", artist);
    const res = await fetch("/api/tracks", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || "Upload failed"); return; }
    setFile(null); setTitle(""); setArtist("");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-400/40 p-6 text-center hover:bg-white/5">
        <span className="text-3xl">⬆️</span>
        <span className="mt-2 text-sm text-zinc-300">{file ? file.name : "Choose an audio file (MP3, WAV, OGG, M4A… up to 50MB)"}</span>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0] ?? null; setFile(f);
          if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
        }} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-lg bg-black/30 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400" />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" className="rounded-lg bg-black/30 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400" />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <button disabled={!file || busy} className="w-full rounded-lg bg-indigo-500 py-2 font-semibold hover:bg-indigo-400 disabled:opacity-40">
        {busy ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
