import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isLegacyLockscorePath, lockscorePath } from "@/lib/utils/lockscore-routes";

const publicRoutes = new Set(["/", "/login", "/signup"]);
const protectedPrefixes = ["/dashboard", "/decisions", "/history", "/profile", "/onboarding"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function requiresCompletedOnboarding(pathname: string) {
  return pathname !== "/onboarding" && isProtectedPath(pathname);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isLegacyLockscorePath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = lockscorePath(pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options
          });

          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });

          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: "",
            ...options
          });

          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });

          response.cookies.set({
            name,
            value: "",
            ...options
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && requiresCompletedOnboarding(pathname)) {
    const [profileRes, goalsRes] = await Promise.all([
      supabase.from("financial_profiles").select("id, monthly_in_hand_salary").maybeSingle(),
      supabase.from("financial_goals").select("id", { head: true, count: "exact" })
    ]);

    if (!profileRes.error && !goalsRes.error) {
      const needsOnboarding = !profileRes.data || Number(profileRes.data.monthly_in_hand_salary ?? 0) <= 0 || !goalsRes.count;
      if (needsOnboarding) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  if (user && publicRoutes.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|robots.txt|sitemap.xml|sw.js).*)"]
};
