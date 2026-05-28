import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isOnboardingComplete } from "@/lib/onboarding/profile-status";

const AUTH_ROUTES = ["/auth/login", "/auth/signup"];
const ONBOARDING_ROUTE = "/onboarding";

function isAuthRoute(pathname) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isOnboardingRoute(pathname) {
  return pathname === ONBOARDING_ROUTE || pathname.startsWith(`${ONBOARDING_ROUTE}/`);
}

function isPublicRoute(pathname) {
  return pathname === "/";
}

function isProtectedRoute(pathname) {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return false;
  }
  if (isPublicRoute(pathname) || isAuthRoute(pathname) || isOnboardingRoute(pathname)) {
    return false;
  }
  return true;
}

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (user) {
    const completed = await isOnboardingComplete(supabase, user.id);

    if (pathname === "/" || isAuthRoute(pathname)) {
      const dest = completed ? "/dashboard" : ONBOARDING_ROUTE;
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (isOnboardingRoute(pathname) && completed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isProtectedRoute(pathname) && !completed) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
    }
  }

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && isOnboardingRoute(pathname)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
