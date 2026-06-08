"use client";
import { useState } from "react";
import AuthShell, { ROLE_CONFIG, RoleConfig } from "@/components/auth/AuthShell";

export default function ForgotPasswordForm({ roleKey }: { roleKey: "client" | "employee" | "admin" }) {
  const cfg: RoleConfig = ROLE_CONFIG[roleKey];
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSent(true);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  };

  const S: React.CSSProperties = { width:"100%", padding:"12px 14px", border:"1.5px solid #e2e8f0", borderRadius:12, fontSize:14, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <AuthShell cfg={cfg} mode="login">
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#1e293b", margin:"0 0 6px" }}>Forgot password?</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Enter your email and we'll send a reset link</p>
      </div>

      {sent ? (
        <div style={{ padding:"20px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📧</div>
          <p style={{ fontSize:15, fontWeight:600, color:"#166534", margin:"0 0 6px" }}>Reset link sent!</p>
          <p style={{ fontSize:13, color:"#166534", margin:0 }}>Check your email for the password reset link. It expires in 30 minutes.</p>
          <button onClick={() => window.location.href = `/${roleKey}/login`}
            style={{ marginTop:16, padding:"10px 20px", background:cfg.color, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Back to login
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email address</label>
            <input type="email" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required style={S}/>
          </div>
          {error && <div style={{ marginBottom:14, padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#991b1b" }}>⚠ {error}</div>}
          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:14, background:loading?"#94a3b8":cfg.color, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
          <button type="button" onClick={() => window.location.href = `/${roleKey}/login`}
            style={{ marginTop:10, width:"100%", padding:12, background:"transparent", color:"#64748b", border:"none", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            ← Back to login
          </button>
        </form>
      )}
    </AuthShell>
  );
}
