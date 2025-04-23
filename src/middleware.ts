// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup", "/auth/blocked"];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Redirect to dashboard if logged in and trying to access auth pages
  if (token && pathname.startsWith("/auth")) {
    const redirectUrl = "/dashboard"; // Always redirect to dashboard first
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Protect non-public routes
  if (!token && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};