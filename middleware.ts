import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const authed = await isValidSession(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return authed ? NextResponse.redirect(new URL("/upload", req.url)) : NextResponse.next();
  }
  if (authed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, the favicon, and the login endpoint itself.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/login).*)"],
};
