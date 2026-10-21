"use client";
import { useEffect, useRef, useState } from "react";

// Plays every track or video in the list below (#tracklist) one after another, so each
// track doesn't have to be started by hand. Only one track plays at a time.
export default function PlayAll() {
  const [on, setOn] = useState(false);
  const onRef = useRef(false);
  const set = (v: boolean) => { onRef.current = v; setOn(v); };
  const audios = () => Array.from(document.querySelectorAll<HTMLMediaElement>("#tracklist audio, #tracklist video"));

  useEffect(() => {
    const ended = (e: Event) => {
      if (!onRef.current) return;
      const list = audios();
      const next = list[list.indexOf(e.target as HTMLMediaElement) + 1];
      if (!next) return set(false);
      next.play().catch(() => set(false));
      next.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    const played = (e: Event) => {
      for (const a of audios()) if (a !== e.target) a.pause();
    };
    // media events don't bubble, so listen in the capture phase
    document.addEventListener("ended", ended, true);
    document.addEventListener("play", played, true);
    return () => {
      document.removeEventListener("ended", ended, true);
      document.removeEventListener("play", played, true);
    };
  }, []);

  const start = () => {
    const first = audios()[0];
    if (!first) return;
    set(true);
    first.currentTime = 0;
    first.play().catch(() => set(false));
    first.scrollIntoView({ block: "center", behavior: "smooth" });
  };
  const stop = () => { set(false); audios().forEach((a) => a.pause()); };

  return on ? (
    <button onClick={stop} className="rounded-md bg-white/10 px-3 py-1 text-sm hover:bg-white/20">■ Stop</button>
  ) : (
    <button onClick={start} className="rounded-md bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-400">▶ Play all</button>
  );
}
