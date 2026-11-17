import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath } from "@/lib/auth/access";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/checkout");
  const isAdmin = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  if (isAccount && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAccount && session && session.role !== "CUSTOMER" && session.role !== "ADMIN") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAdmin && !isAdminLogin) {
    if (!session || !canAccessPath(session.role, pathname)) {
      const url = request.nextUrl.clone();
      if (!session || session.role === "CUSTOMER") {
        url.pathname = "/admin/login";
      } else {
        url.pathname = "/admin";
      }
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if ((pathname === "/login" || pathname === "/register") && session?.role === "CUSTOMER") {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin", "/admin/:path*", "/login", "/register"],
};
