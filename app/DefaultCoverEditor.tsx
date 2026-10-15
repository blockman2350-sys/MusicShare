"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DefaultCoverEditor({ coverUrl }: { coverUrl: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(file: File) {
    setBusy(true); setErr("");
    const fd = new FormData();
    fd.append("cover", file);
    const res = await fetch("/api/default-cover", { method: "PUT", body: fd });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || "Upload failed"); return; }
    router.refresh();
  }

  async function remove() {
    if (!confirm("Remove the default cover?")) return;
    setBusy(true); setErr("");
    await fetch("/api/default-cover", { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="Default cover" className="h-16 w-16 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl">🎵</div>
      )}
      <div className="flex-1 text-sm">
        <p className="font-semibold">Default cover</p>
        <p className="text-zinc-400">Shown for tracks without their own picture.</p>
        {err && <p className="text-red-400">{err}</p>}
      </div>
      <div className="flex gap-2 text-sm">
        <label className={`cursor-pointer rounded-md bg-indigo-500 px-3 py-1 hover:bg-indigo-400 ${busy ? "opacity-40" : ""}`}>
          {coverUrl ? "Change" : "Set picture"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        </label>
        {coverUrl && <button onClick={remove} disabled={busy} className="rounded-md bg-white/10 px-3 py-1 hover:bg-red-500 disabled:opacity-40">Remove</button>}
      </div>
    </div>
  );
}
