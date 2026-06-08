"use client";
import { useState, useEffect } from "react";
import AuthShell, { ROLE_CONFIG, RoleConfig } from "@/components/auth/AuthShell";

export default function ResetPasswordForm({ roleKey }: { roleKey: "client" | "employee" | "admin" }) {
  const cfg: RoleConfig = ROLE_CONFIG[roleKey];
  const [token, setToken]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (!t) setError("Invalid or missing reset link. Please request a new one.");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDone(true);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const S: React.CSSProperties = { width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:14, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <AuthShell cfg={cfg} mode="login">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#1e293b", margin:"0 0 6px" }}>Reset password</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Enter your new password below</p>
      </div>

      {done ? (
        <div style={{ padding:"20px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
          <p style={{ fontSize:15, fontWeight:600, color:"#166534", margin:"0 0 6px" }}>Password reset!</p>
          <p style={{ fontSize:13, color:"#166534", margin:0 }}>Your password has been changed successfully.</p>
          <button onClick={() => window.location.href = `/${roleKey}/login`}
            style={{ marginTop:16, padding:"10px 20px", background:cfg.color, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Sign in now →
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>New Password</label>
            <input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={password} onChange={e=>setPassword(e.target.value)} required style={S}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Confirm Password</label>
            <input type="password" placeholder="Re-enter new password" value={confirm} onChange={e=>setConfirm(e.target.value)} required style={S}/>
          </div>
          {error && <div style={{ marginBottom:14, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#991b1b" }}>⚠ {error}</div>}
          <button type="submit" disabled={loading || !token}
            style={{ width:"100%", padding:14, background:loading||!token?"#94a3b8":cfg.color, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:loading||!token?"not-allowed":"pointer", fontFamily:"inherit" }}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
