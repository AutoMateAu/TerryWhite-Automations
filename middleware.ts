import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/supabase"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("role, hospital_id")
    .eq("id", session?.user?.id || "")
    .single()

  const userRole = profileData?.role
  const userHospitalId = profileData?.hospital_id

  // Allow access to login and signup pages without authentication
  if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) {
    if (session) {
      // If already logged in, redirect from login/signup page to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return response
  }

  // Redirect unauthenticated users to login page for all other protected routes
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect doctors and nurses without a selected hospital to the hospital selection page
  if (
    (userRole === "doctor" || userRole === "nurse") &&
    !userHospitalId &&
    !request.nextUrl.pathname.startsWith("/select-hospital")
  ) {
    return NextResponse.redirect(new URL("/select-hospital", request.url))
  }

  // Prevent admins from accessing the hospital selection page
  if (userRole === "admin" && request.nextUrl.pathname.startsWith("/select-hospital")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url)) // Or a 403 forbidden page
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/callback (Supabase auth callback)
     * - /api (API routes, if any are public)
     * - /login (login page - already handled above, but good to keep in matcher for clarity)
     * - /signup (signup page - NEWLY ADDED)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|api|login|signup).*)",
  ],
}
