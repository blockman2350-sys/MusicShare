import { db } from "@/db";
import { tracks } from "@/db/schema";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Please upload an audio file" }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 50MB" }, { status: 400 });
  }
  const title = String(form.get("title") || "").trim() || file.name.replace(/\.[^.]+$/, "");
  const artist = String(form.get("artist") || "").trim();
  const slug = randomBytes(6).toString("base64url");
  const buf = Buffer.from(await file.arrayBuffer());
  await db.insert(tracks).values({ slug, title, artist, mimeType: file.type, size: file.size, data: buf });
  return NextResponse.json({ slug });
}
