"use client";
import { useState } from "react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setBusy(false);
    if (!res.ok) { setErr((await res.json().catch(() => ({}))).error || "Login failed"); return; }
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 to-indigo-950 p-4 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">Owner login</h1>
        <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
          className="w-full rounded-lg bg-black/30 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-indigo-400" />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button disabled={!password || busy} className="w-full rounded-lg bg-indigo-500 py-2 font-semibold hover:bg-indigo-400 disabled:opacity-40">Log in</button>
      </form>
    </main>
  );
}
