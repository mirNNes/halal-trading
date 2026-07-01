import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/pricing"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next()
  }

  // Check for token in cookie (set by login page after receiving JWT)
  const token = request.cookies.get("access_token")?.value
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
