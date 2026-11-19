import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Language routing (next-intl): the site address opens the landing page in the visitor's language. */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
