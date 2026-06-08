import { NextResponse } from "next/server";

export function proxy(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const role  = req.cookies.get("role")?.value;

  // Skip API routes — let them handle auth themselves
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const isAdminRole    = role === "admin";
  const isEmployeeRole = role === "employee";
  const isClientRole   = role === "client";

  const isAdminArea    = pathname === "/dashboard/admin"    || pathname.startsWith("/dashboard/admin/");
  const isEmployeeArea = pathname === "/dashboard/employee" || pathname.startsWith("/dashboard/employee/");
  const isClientArea   = pathname === "/dashboard/client"   || pathname.startsWith("/dashboard/client/");
  const isStaffArea    = isAdminArea || isEmployeeArea;

  const isProtected = ["/dashboard","/profile","/tools","/msg","/subscription"].some(
    p => pathname === p || pathname.startsWith(`${p}/`)
  );

  const staffHome = isAdminRole    ? "/dashboard/admin"
                  : isEmployeeRole ? "/dashboard/employee"
                  : isClientRole   ? "/dashboard/client"
                  : "/admin/login";

  // Not logged in
  if (!token) {
    if (isAdminArea)    return NextResponse.redirect(new URL("/admin/login",    req.url));
    if (isEmployeeArea) return NextResponse.redirect(new URL("/employee/login", req.url));
    if (isClientArea)   return NextResponse.redirect(new URL("/client/login",   req.url));
    if (isProtected)    return NextResponse.redirect(new URL("/admin/login",    req.url));
    return NextResponse.next();
  }

  // Redirect /dashboard to role home
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(staffHome, req.url));
  }

  // Cross-role protection
  if (isAdminArea    && !isAdminRole)    return NextResponse.redirect(new URL(staffHome, req.url));
  if (isEmployeeArea && !isEmployeeRole) return NextResponse.redirect(new URL(staffHome, req.url));
  if (isClientArea   && !isClientRole)   return NextResponse.redirect(new URL(staffHome, req.url));

  return NextResponse.next();
}
