import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function createRedirectWithCookies(
  url: URL,
  supabaseResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  supabaseResponse.headers.forEach((value, key) => {
    if (
      key.toLowerCase() === "cache-control" ||
      key.toLowerCase() === "expires" ||
      key.toLowerCase() === "pragma"
    ) {
      redirectResponse.headers.set(key, value);
    }
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(
    claims && typeof claims.sub === "string" && claims.sub.length > 0
  );

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/");
  const isPublicRoute =
    pathname === "/" || isAuthPage || pathname.startsWith("/auth");

  // Prevent authenticated users from accessing login and registration pages unnecessarily
  if (isAuthenticated && isAuthPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return createRedirectWithCookies(dashboardUrl, supabaseResponse);
  }

  // Redirect unauthenticated users trying to access /dashboard or future protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("next", pathname);
    }
    return createRedirectWithCookies(loginUrl, supabaseResponse);
  }

  return supabaseResponse;
}


