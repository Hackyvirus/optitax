"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = {
  admin: [
    { label: "Dashboard",      href: "/dashboard/admin" },
    { label: "Analysis",       href: "/dashboard/admin/analysis" },
    { label: "Projects",       href: "/dashboard/admin/project" },
    { label: "People",         href: "/dashboard/admin/employee" },
    { label: "Messages",       href: "/dashboard/admin/msg" },
    { label: "Reimbursements", href: "/dashboard/admin/reimbursements" },
    { label: "Tools",          href: "/dashboard/admin/tools" },
    { label: "Invite Codes",   href: "/dashboard/admin/invite-codes" },
    { label: "Profile",        href: "/dashboard/admin/profile" },
    { label: "Logout",         href: "/logout" },
  ],
  employee: [
    { label: "Dashboard",      href: "/dashboard/employee" },
    { label: "Analysis",       href: "/dashboard/employee/analysis" },
    { label: "Projects",       href: "/dashboard/employee/project" },
    { label: "Messages",       href: "/dashboard/employee/msg" },
    { label: "Reimbursements", href: "/dashboard/employee/reimbursements" },
    { label: "Tools",          href: "/dashboard/employee/tools" },
    { label: "Profile",        href: "/dashboard/employee/profile" },
    { label: "Logout",         href: "/logout" },
  ],
  client: [
    { label: "Dashboard",      href: "/dashboard/client" },
    { label: "Analysis",       href: "/dashboard/client/analysis" },
    { label: "Projects",       href: "/dashboard/client/project" },
    { label: "Documents",      href: "/dashboard/client/documents" },
    { label: "Messages",       href: "/dashboard/client/msg" },
    { label: "Reimbursements", href: "/dashboard/client/reimbursements" },
    { label: "Tools",          href: "/dashboard/client/tools" },
    { label: "Profile",        href: "/dashboard/client/profile" },
    { label: "Subscription",   href: "/dashboard/client/subscription" },
    { label: "Logout",         href: "/logout" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();

  const role =
    pathname.startsWith("/dashboard/admin")    ? "admin"    :
    pathname.startsWith("/dashboard/employee") ? "employee" :
    pathname.startsWith("/dashboard/client")   ? "client"   : "admin";

  const items = menus[role] || menus.admin;

  return (
    <aside style={{
      width: 196,
      flexShrink: 0,
      background: "#0d1f4c",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', 'Inter', sans-serif",
    }}>
      {/* Brand */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>OptiTax</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".1em" }}>
          {role} portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((item) => {
          const isLogout = item.href === "/logout";
          const isRoot   = ["/dashboard/admin", "/dashboard/employee", "/dashboard/client"].includes(item.href);
          const isActive = isRoot
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "7px 12px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isLogout
                  ? "rgba(255,255,255,0.2)"
                  : isActive
                    ? "#fff"
                    : "rgba(255,255,255,0.52)",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                textDecoration: "none",
                transition: "all .12s",
                marginTop: isLogout ? 6 : 0,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)" }}>© 2026 OptiTax</div>
      </div>
    </aside>
  );
}