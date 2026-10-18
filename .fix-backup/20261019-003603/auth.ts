import { cookies } from "next/headers";
import { connection } from "next/server";
import crypto from "crypto";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-insecure-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function createToken(): string {
  const payload = String(Date.now());
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const ts = Number(payload);
  if (!Number.isFinite(ts)) return false;
  if (Date.now() - ts > MAX_AGE * 1000) return false;
  return true;
}

export async function isAdmin(): Promise<boolean> {
  // This tells Next.js 16 this function requires a live request
  await connection();
  
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;
