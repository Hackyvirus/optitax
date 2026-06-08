"use client";
import { useState, useEffect } from "react";
import AuthShell, { ROLE_CONFIG } from "@/components/auth/AuthShell";

const cfg = ROLE_CONFIG.admin;

export default function ResetPassword() {
  const [token, setToken]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (!t) setError("Invalid reset link. Please request a new one.");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/reset-password", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ token, password }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setDone(true);
    setLoading(false);
  };

  const S: React.CSSProperties = { width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <AuthShell cfg={cfg} mode="login">
      <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 6px" }}>Reset password</h1>
      <p style={{ fontSize:13, color:"#64748b", margin:"0 0 24px" }}>Enter your new password below</p>
      {done ? (
        <div style={{ padding:20, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, textAlign:"center" }}>
          <p style={{ fontSize:15, fontWeight:600, color:"#166534", margin:"0 0 6px" }}>Password reset!</p>
          <p style={{ fontSize:13, color:"#166534", margin:"0 0 16px" }}>Your password has been changed successfully.</p>
          <a href="/admin/login" style={{ fontSize:13, fontWeight:600, color:cfg.color }}>Sign in now →</a>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>New Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min 8 chars" style={S}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Confirm Password</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Re-enter password" style={S}/>
          </div>
          {error && <div style={{ marginBottom:14, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#991b1b" }}>⚠ {error}</div>}
          <button type="submit" disabled={loading || !token} style={{ width:"100%", padding:13, background:loading||!token?"#94a3b8":cfg.color, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}