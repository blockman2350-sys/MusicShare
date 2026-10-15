import { db } from "@/db";
import { tracks } from "@/db/schema";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/auth";
import { deleteObject, putObject, storageEnabled } from "@/storage";
import { DEFAULT_ARTIST, DEFAULT_CATEGORY } from "../../categories";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Owner login required" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Please upload an audio file" }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 50MB" }, { status: 400 });
  }
  const cover = form.get("cover");
  let coverData: Buffer | null = null;
  let coverMime: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    if (!IMAGE_TYPES.includes(cover.type)) {
      return NextResponse.json({ error: "Cover must be a JPG, PNG, WebP or GIF image" }, { status: 400 });
    }
    if (cover.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Cover image max 5MB" }, { status: 400 });
    }
    coverData = Buffer.from(await cover.arrayBuffer());
    coverMime = cover.type;
  }
  const title = String(form.get("title") || "").trim() || file.name.replace(/\.[^.]+$/, "");
  const artist = String(form.get("artist") || "").trim() || DEFAULT_ARTIST;
  const category = String(form.get("category") || "").trim().slice(0, 40) || DEFAULT_CATEGORY;
  const slug = randomBytes(6).toString("base64url");
  const buf = Buffer.from(await file.arrayBuffer());
  const values = { slug, title, artist, category, mimeType: file.type, size: file.size } as typeof tracks.$inferInsert;
  if (storageEnabled()) {
    // Files go to the bucket; Postgres keeps only metadata and the keys.
    values.audioKey = `audio/${slug}`;
    const keys = [values.audioKey];
    try {
      await putObject(values.audioKey, buf, file.type);
      if (coverData && coverMime) {
        values.coverKey = `covers/${slug}`;
        keys.push(values.coverKey);
        await putObject(values.coverKey, coverData, coverMime);
        values.coverMime = coverMime;
      }
      await db.insert(tracks).values(values);
    } catch (e) {
      await Promise.allSettled(keys.map(deleteObject));
      throw e;
    }
  } else {
    await db.insert(tracks).values({ ...values, data: buf, cover: coverData, coverMime });
  }
  return NextResponse.json({ slug });
}
