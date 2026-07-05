import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all paths except authentication endpoints, static folders, public images, and landing page
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
