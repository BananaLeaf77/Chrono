// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/otp", "/auth/otp/reset", "/"];
const PROTECTED_PATHS = ["/dashboard"];

export function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value; // Tapi kamu pakai memory
    const pathname = request.nextUrl.pathname;

    // Kalau sudah login (cek refresh_token cookie?)
    const hasRefreshToken = request.cookies.has("refresh_token");

    // Blokir auth page kalau sudah login
    if (hasRefreshToken && AUTH_PATHS.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Proteksi dashboard
    if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !hasRefreshToken) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/auth/:path*", "/dashboard/:path*", "/"],
};