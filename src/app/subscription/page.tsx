"use client";
import { useEffect } from "react";

export default function Redirect() {
  useEffect(() => {
    const role = document.cookie.match(/role=([^;]+)/)?.[1];
    const dest = role ? `/dashboard/${role}/subscription` : "/admin/login";
    window.location.replace(dest);
  }, []);
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"#64748b", fontSize:14 }}>
      Redirecting…
    </div>
  );
}