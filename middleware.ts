import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/**
 * Language routing (next-intl). The bare site address opens the sign in page directly, in the
 * visitor's language: "/" goes to "/<locale>/login" instead of the landing page.
 */
export default function middleware(req: NextRequest) {
  const res = intl(req);
  if (req.nextUrl.pathname === "/") {
    const to = res.headers.get("location");
    const url = to ? new URL(to, req.url) : null;
    if (url && routing.locales.some((l) => url.pathname === `/${l}`)) {
      url.pathname = `${url.pathname}/login`;
      return NextResponse.redirect(url);
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
