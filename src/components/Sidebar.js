"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const panelMeta = {
  admin:    { title: "Admin Workspace",    subtitle: "Team, filings, and day-to-day ops" },
  employee: { title: "Employee Workspace", subtitle: "Projects, updates, and conversations" },
  client:   { title: "Client Portal",      subtitle: "Your compliance home base" },
  user:     { title: "Workspace",          subtitle: "Your OptiTax home base" },
};

const menus = {
  admin: [
    { label: "Dashboard",    href: "/dashboard/admin" },
    { label: "Analysis",     href: "/dashboard/admin/analysis" },
    { label: "Projects",     href: "/dashboard/admin/project" },
    { label: "Employees",    href: "/dashboard/admin/employee" },
    { label: "Tools",        href: "/dashboard/admin/tools" },
    { label: "Messages",     href: "/dashboard/admin/msg" },
    { label: "Profile",      href: "/dashboard/admin/profile" },
    { label: "Subscription", href: "/dashboard/admin/subscription" },
    { label: "Logout",       href: "/logout" },
  ],
  employee: [
    { label: "Dashboard",    href: "/dashboard/employee" },
    { label: "Projects",     href: "/dashboard/employee/project" },
    { label: "Tools",        href: "/dashboard/employee/tools" },
    { label: "Messages",     href: "/dashboard/employee/msg" },
    { label: "Profile",      href: "/dashboard/employee/profile" },
    { label: "Subscription", href: "/dashboard/employee/subscription" },
    { label: "Logout",       href: "/logout" },
  ],
  client: [
    { label: "Dashboard",    href: "/dashboard/client" },
    { label: "Analysis",     href: "/dashboard/client/analysis" },
    { label: "Projects",     href: "/dashboard/client/project" },
    { label: "Documents",    href: "/dashboard/client/documents" },
    { label: "Messages",     href: "/dashboard/client/msg" },
    { label: "Tools",        href: "/dashboard/client/tools" },
    { label: "Profile",      href: "/dashboard/client/profile" },
    { label: "Subscription", href: "/dashboard/client/subscription" },
    { label: "Logout",       href: "/logout" },
  ],
  user: [
    { label: "Dashboard",    href: "/dashboard" },
    { label: "Profile",      href: "/profile" },
    { label: "Tools",        href: "/tools" },
    { label: "Messages",     href: "/msg" },
    { label: "Subscription", href: "/subscription" },
    { label: "Logout",       href: "/logout" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();

  const role =
    pathname.startsWith("/dashboard/admin")    ? "admin"    :
    pathname.startsWith("/dashboard/employee") ? "employee" :
    pathname.startsWith("/dashboard/client")   ? "client"   : "user";

  const menuItems = menus[role];
  const panel     = panelMeta[role];

  return (
    <aside className="rounded-2xl border border-blue-200/60 bg-gradient-to-b from-[#0f2f7e] via-[#123991] to-[#0f2f7e] p-5 text-white shadow-[0_20px_50px_rgba(11,31,91,0.32)] md:sticky md:top-24 md:basis-1/5 md:min-w-[250px] md:self-start">
      <h1 className="text-lg font-semibold tracking-tight">{panel.title}</h1>
      <p className="mt-1 text-xs text-blue-100/80">{panel.subtitle}</p>
      <nav className="mt-5 space-y-1.5">
        {menuItems.map((item) => {
          const isDashboardRoot = ["/dashboard/admin","/dashboard/employee","/dashboard/client","/dashboard"].includes(item.href);
          const isActive = isDashboardRoot
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-white text-blue-900 shadow-[0_8px_20px_rgba(255,255,255,0.35)]"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`h-2 w-2 rounded-full transition ${isActive ? "bg-blue-700" : "bg-blue-200/65 group-hover:bg-white"}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}