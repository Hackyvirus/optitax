"use client";
import { useEffect } from "react";

export default function LogoutPage() {
  useEffect(() => {
    async function logout() {
      // Read role before clearing cookies
      const role = document.cookie.match(/role=([^;]+)/)?.[1] || "admin";
      await fetch("/api/auth/logout", { method: "POST" });
      // Clear cookies client-side too
      document.cookie = "token=; max-age=0; path=/";
      document.cookie = "role=; max-age=0; path=/";
      document.cookie = "refreshToken=; max-age=0; path=/";
      const portals = { client: "/client/login", employee: "/employee/login", admin: "/admin/login" };
      window.location.replace(portals[role] || "/admin/login");
    }
    logout();
  }, []);

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#f8fafc", fontFamily:"'Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:"3px solid #1e3a6e", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }}/>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Logging out…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}