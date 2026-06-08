"use client";
import { useState } from "react";
import AuthShell, { ROLE_CONFIG, RoleConfig } from "@/components/auth/AuthShell";

export default function LoginForm({ roleKey }: { roleKey: "client" | "employee" | "admin" }) {
  const cfg: RoleConfig = ROLE_CONFIG[roleKey];
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true); setError("");

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password, expectedRole: cfg.role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.correctPortal) {
          setTimeout(() => { window.location.href = data.correctPortal; }, 2000);
        }
        return;
      }

      // Success — force redirect to dashboard
      const dest = data.redirect || `/dashboard/${cfg.role}`;
      window.location.replace(dest);

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const INP_STYLE: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    border: "1.5px solid #e2e8f0", borderRadius: 12,
    fontSize: 14, color: "#1e293b", background: "#fff",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <AuthShell cfg={cfg} mode="login">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:cfg.bg, padding:"5px 14px", borderRadius:20, marginBottom:16 }}>
          <span style={{ fontSize:14 }}>{cfg.icon}</span>
          <span style={{ fontSize:11, fontWeight:700, color:cfg.color, textTransform:"uppercase", letterSpacing:".1em" }}>{cfg.label}</span>
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#1e293b", margin:"0 0 6px" }}>Welcome back</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Sign in to your {cfg.label.toLowerCase()}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Email address</label>
          <input
            type="email" placeholder="you@company.com"
            value={email} onChange={e => setEmail(e.target.value)} required
            style={INP_STYLE}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Password</label>
            <a href={`/${roleKey}/forgot-password`} style={{ fontSize:12, color:cfg.color, textDecoration:"none" }}>
              Forgot password?
            </a>
          </div>
          <div style={{ position:"relative" }}>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ ...INP_STYLE, paddingRight: 52 }}
            />
            <button
              type="button" onClick={() => setShowPw(s => !s)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:13, padding:4, fontFamily:"inherit" }}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin:"14px 0 0", padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#991b1b" }}>
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          style={{ marginTop:20, width:"100%", padding:14, background:loading?"#94a3b8":cfg.color, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", transition:"background .15s" }}>
          {loading ? "Signing in…" : `Sign in to ${cfg.label}`}
        </button>
      </form>
    </AuthShell>
  );
}