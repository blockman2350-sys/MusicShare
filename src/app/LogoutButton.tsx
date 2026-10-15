"use client";

export default function LogoutButton() {
  return (
    <button className="text-sm text-zinc-400 hover:text-zinc-200" onClick={async () => {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    }}>Log out</button>
  );
}
