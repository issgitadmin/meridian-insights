import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, safeNext, sessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  if (!(await checkPassword(password))) {
    // Small delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ next: safeNext(body.next) });
  res.cookies.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
