import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAdmin } from "@/auth";
import { DEFAULT_COVER_KEY } from "@/defaultCover";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function GET() {
  const [row] = await db.select({ mime: settings.mime, data: settings.data }).from(settings).where(eq(settings.key, DEFAULT_COVER_KEY));
  if (!row?.data || !row.mime) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(row.data)), {
    headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Owner login required" }, { status: 401 });
  const form = await req.formData();
  const cover = form.get("cover");
  if (!(cover instanceof File) || !IMAGE_TYPES.includes(cover.type)) {
    return Response.json({ error: "Cover must be a JPG, PNG, WebP or GIF image" }, { status: 400 });
  }
  if (cover.size > 5 * 1024 * 1024) return Response.json({ error: "Cover image max 5MB" }, { status: 400 });
  const data = Buffer.from(await cover.arrayBuffer());
  await db
    .insert(settings)
    .values({ key: DEFAULT_COVER_KEY, mime: cover.type, data })
    .onConflictDoUpdate({ target: settings.key, set: { mime: cover.type, data, updatedAt: new Date() } });
  return Response.json({ ok: true });
}

export async function DELETE() {
  if (!(await isAdmin())) return Response.json({ error: "Owner login required" }, { status: 401 });
  await db.delete(settings).where(eq(settings.key, DEFAULT_COVER_KEY));
  return Response.json({ ok: true });
}
