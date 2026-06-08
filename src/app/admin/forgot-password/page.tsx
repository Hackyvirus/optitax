"use client";
import { useState } from "react";
import AuthShell, { ROLE_CONFIG } from "@/components/auth/AuthShell";

const cfg = ROLE_CONFIG.admin;

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/forgot-password", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else setSent(true);
    setLoading(false);
  };

  const S: React.CSSProperties = { width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <AuthShell cfg={cfg} mode="login">
      <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 6px" }}>Forgot password?</h1>
      <p style={{ fontSize:13, color:"#64748b", margin:"0 0 24px" }}>Enter your email and we will send a reset link</p>
      {sent ? (
        <div style={{ padding:20, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, textAlign:"center" }}>
          <p style={{ fontSize:15, fontWeight:600, color:"#166534", margin:"0 0 6px" }}>Reset link sent!</p>
          <p style={{ fontSize:13, color:"#166534", margin:"0 0 16px" }}>Check your email. Link expires in 30 minutes.</p>
          <a href="/admin/login" style={{ fontSize:13, fontWeight:600, color:cfg.color }}>Back to login →</a>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@company.com" style={S}/>
          </div>
          {error && <div style={{ marginBottom:14, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#991b1b" }}>⚠ {error}</div>}
          <button type="submit" disabled={loading} style={{ width:"100%", padding:13, background:loading?"#94a3b8":cfg.color, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
          <a href="/admin/login" style={{ display:"block", textAlign:"center", marginTop:14, fontSize:13, color:"#64748b", textDecoration:"none" }}>← Back to login</a>
        </form>
      )}
    </AuthShell>
  );
}