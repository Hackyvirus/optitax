"use client";

export type RoleConfig = {
  role:        "client" | "employee" | "admin";
  label:       string;
  color:       string;
  bg:          string;
  icon:        string;
  tagline:     string;
  features:    string[];
  loginPath:   string;
  registerPath:string;
};

export const ROLE_CONFIG: Record<string, RoleConfig> = {
  client: {
    role: "client", label: "Client Portal", color: "#1e3a6e", bg: "#eff6ff",
    icon: "🏢", tagline: "Track your compliance, filings and documents — all in one place.",
    features: ["GST & ITR filing status", "Document uploads", "Team communication", "Delivery tracking"],
    loginPath: "/client/login", registerPath: "/client/register",
  },
  employee: {
    role: "employee", label: "Employee Portal", color: "#1e3a6e", bg: "#eff6ff",
    icon: "👤", tagline: "Manage client work, run tools and collaborate with your team.",
    features: ["Run Brand Rate / DBK tools", "Manage client projects", "Access compliance tools", "Team collaboration"],
    loginPath: "/employee/login", registerPath: "/employee/register",
  },
  admin: {
    role: "admin", label: "Admin Portal", color: "#1e3a6e", bg: "#eff6ff",
    icon: "🛡️", tagline: "Full platform control — users, tools, billing and settings.",
    features: ["Manage all users & roles", "Enable / disable tools", "Billing & subscriptions", "System configuration"],
    loginPath: "/admin/login", registerPath: "/admin/register",
  },
};

export default function AuthShell({ cfg, mode, children }: { cfg: RoleConfig; mode: "login" | "register"; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Left panel */}
      <div style={{ width: 420, minWidth: 420, background: cfg.color, display: "flex", flexDirection: "column", padding: "48px 44px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        {/* Logo */}
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>OptiTax</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: ".12em", textTransform: "uppercase" as const, marginTop: 3 }}>{cfg.label}</div>
        </div>

        {/* Icon + tagline */}
        <div style={{ marginTop: 64 }}>
          <div style={{ fontSize: 44, marginBottom: 20 }}>{cfg.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.4, marginBottom: 24 }}>{cfg.tagline}</h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
            {cfg.features.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 11 11"><path d="M2 5.5l2.5 2.5L9 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.82)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portal switcher */}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 22 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: ".1em" }}>Wrong portal?</div>
          <div style={{ display: "flex", gap: 8 }}>
            {cfg.role !== "client" && (
              <a href={mode === "login" ? "/client/login" : "/client/register"}
                style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
                Client
              </a>
            )}
            {cfg.role !== "employee" && (
              <a href={mode === "login" ? "/employee/login" : "/employee/register"}
                style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
                Employee
              </a>
            )}
            {cfg.role !== "admin" && (
              <a href={mode === "login" ? "/admin/login" : "/admin/register"}
                style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 20, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
                Admin
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", background: "#f8fafc", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "36px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
            {children}
          </div>
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
            {mode === "login"
              ? <span>Don't have an account?{" "}<a href={cfg.registerPath} style={{ color: cfg.color, fontWeight: 600, textDecoration: "none", fontSize: 13 }}>Create one →</a></span>
              : <span>Already registered?{" "}<a href={cfg.loginPath} style={{ color: cfg.color, fontWeight: 600, textDecoration: "none", fontSize: 13 }}>Sign in →</a></span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}