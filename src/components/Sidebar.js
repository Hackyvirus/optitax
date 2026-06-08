"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = {
  admin: [
    { label:"Dashboard",    href:"/dashboard/admin" },
    { label:"Analysis",     href:"/dashboard/admin/analysis" },
    { label:"Projects",     href:"/dashboard/admin/project" },
    { label:"People",       href:"/dashboard/admin/employee" },
    { label:"Messages",     href:"/dashboard/admin/msg" },
    { label:"Tools",        href:"/dashboard/admin/tools" },
    { label:"Invite Codes", href:"/dashboard/admin/invite-codes" },
    { label:"Profile",      href:"/dashboard/admin/profile" },
    { label:"Logout",       href:"/logout" },
  ],
  employee: [
    { label:"Dashboard",    href:"/dashboard/employee" },
    { label:"Analysis",     href:"/dashboard/employee/analysis" },
    { label:"Projects",     href:"/dashboard/employee/project" },
    { label:"Messages",     href:"/dashboard/employee/msg" },
    { label:"Tools",        href:"/dashboard/employee/tools" },
    { label:"Profile",      href:"/dashboard/employee/profile" },
    { label:"Logout",       href:"/logout" },
  ],
  client: [
    { label:"Dashboard",    href:"/dashboard/client" },
    { label:"Analysis",     href:"/dashboard/client/analysis" },
    { label:"Projects",     href:"/dashboard/client/project" },
    { label:"Documents",    href:"/dashboard/client/documents" },
    { label:"Messages",     href:"/dashboard/client/msg" },
    { label:"Tools",        href:"/dashboard/client/tools" },
    { label:"Profile",      href:"/dashboard/client/profile" },
    { label:"Subscription", href:"/dashboard/client/subscription" },
    { label:"Logout",       href:"/logout" },
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
      width:200, flexShrink:0, background:"#0d1f4c",
      minHeight:"100vh", display:"flex", flexDirection:"column",
    }}>
      {/* Brand */}
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"-0.4px" }}>OptiTax</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", marginTop:2, textTransform:"uppercase", letterSpacing:".1em", fontWeight:500 }}>
          {role}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:"14px 10px", display:"flex", flexDirection:"column", gap:1 }}>
        {items.map(item => {
          const isLogout = item.href === "/logout";
          const roots    = ["/dashboard/admin","/dashboard/employee","/dashboard/client"];
          const isActive = roots.includes(item.href)
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href} style={{
              display:"block", padding:"7px 12px", borderRadius:7,
              fontSize:13, fontWeight:isActive?600:400,
              color: isLogout ? "rgba(255,255,255,0.25)"
                   : isActive ? "#fff"
                   : "rgba(255,255,255,0.5)",
              background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
              transition:"all .12s",
              marginTop: isLogout ? 6 : 0,
            }}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.15)" }}>© 2026 OptiTax</div>
      </div>
    </aside>
  );
}