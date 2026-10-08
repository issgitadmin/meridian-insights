// Shared password gate. Runs in both the Edge middleware and Node route handlers,
// so it only uses Web Crypto.

export const SESSION_COOKIE = "meridian_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const password = () => process.env.APP_PASSWORD || "OPS123";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production");
  }
  return s || "dev-only-secret";
}

async function hmac(message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Token stored in the cookie. Changing APP_PASSWORD or AUTH_SECRET signs everyone out. */
export const sessionToken = () => hmac(`session:${password()}`);

export async function isValidSession(token: string | undefined) {
  if (!token) return false;
  return safeEqual(token, await sessionToken());
}

export async function checkPassword(attempt: string) {
  return safeEqual(await hmac(`pw:${attempt}`), await hmac(`pw:${password()}`));
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return "/upload";
  return next;
}
