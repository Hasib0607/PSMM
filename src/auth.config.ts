import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
      const isPublicRoute = nextUrl.pathname === "/";

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isPublicRoute) {
        return false; // Automatically redirects to pages.signIn (/login)
      }

      return true;
    },
  },
  providers: [], // Providers are populated in auth.ts
} satisfies NextAuthConfig;
