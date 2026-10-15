import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "ss_admin";

// Fails closed: with no ADMIN_PASSWORD set, nobody is the owner.
function token(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("soundshelf-owner").digest("hex");
}

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordOk(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && same(input, pw);
}

export function sessionToken() {
  return token();
}

export async function isAdmin(): Promise<boolean> {
  const t = token();
  if (!t) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && same(c, t);
}
