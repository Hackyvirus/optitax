import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ fontFamily:"'Segoe UI',Arial,sans-serif", background:"#f8fafc", minHeight:"100vh" }}>

      {/* Nav */}
      <nav style={{ background:"#fff", borderBottom:"1px solid #e8ecf0", padding:"0 40px", display:"flex", alignItems:"center", height:60, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontSize:18, fontWeight:800, color:"#0f1f4a", letterSpacing:"-.3px" }}>OptiTax</div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
          <Link href="/client/login"   style={{ padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:500, color:"#475569", textDecoration:"none" }}>Client Login</Link>
          <Link href="/employee/login" style={{ padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:500, color:"#475569", textDecoration:"none" }}>Employee Login</Link>
          <Link href="/admin/login"    style={{ padding:"7px 16px", borderRadius:8, fontSize:13, fontWeight:500, color:"#475569", textDecoration:"none" }}>Admin</Link>
          <Link href="/client/register" style={{ padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:600, background:"#0f1f4a", color:"#fff", textDecoration:"none" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth:960, margin:"0 auto", padding:"80px 24px 60px", textAlign:"center" }}>
        <div style={{ display:"inline-block", padding:"5px 14px", borderRadius:20, background:"#eff6ff", color:"#1e40af", fontSize:12, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase", marginBottom:24 }}>
          India's Compliance Platform
        </div>
        <h1 style={{ fontSize:"clamp(32px,5vw,56px)", fontWeight:800, color:"#0f172a", lineHeight:1.15, margin:"0 0 20px", letterSpacing:"-.03em" }}>
          GST, Customs & Compliance<br/>
          <span style={{ color:"#0f1f4a" }}>managed in one place</span>
        </h1>
        <p style={{ fontSize:18, color:"#64748b", maxWidth:560, margin:"0 auto 36px", lineHeight:1.7 }}>
          OptiTax handles your GST filings, Brand Rate / DBK applications, MOOWR, SEZ compliance and ITR — so you can focus on growing your business.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/client/register" style={{ padding:"14px 28px", background:"#0f1f4a", color:"#fff", borderRadius:10, fontSize:15, fontWeight:700, textDecoration:"none" }}>
            Start for free →
          </Link>
          <Link href="/client/login" style={{ padding:"14px 28px", background:"#fff", color:"#0f172a", borderRadius:10, fontSize:15, fontWeight:600, textDecoration:"none", border:"1px solid #e8ecf0" }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth:800, margin:"0 auto", padding:"0 24px 60px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:2, background:"#e8ecf0", borderRadius:16, overflow:"hidden" }}>
          {[
            { value:"500+", label:"Clients served" },
            { value:"₹200Cr+", label:"Duty recovered" },
            { value:"10,000+", label:"Filings completed" },
          ].map(s => (
            <div key={s.label} style={{ background:"#fff", padding:"28px 24px", textAlign:"center" }}>
              <p style={{ fontSize:32, fontWeight:800, color:"#0f1f4a", margin:"0 0 6px" }}>{s.value}</p>
              <p style={{ fontSize:13, color:"#94a3b8", margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth:960, margin:"0 auto", padding:"0 24px 80px" }}>
        <h2 style={{ fontSize:28, fontWeight:700, color:"#0f172a", textAlign:"center", margin:"0 0 40px" }}>Everything you need for compliance</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
          {[
            { title:"GST Filing",          desc:"GSTR-1, GSTR-3B, GSTR-9 filing with reconciliation and error checking." },
            { title:"Brand Rate / DBK",    desc:"Automate duty drawback brand rate applications with our Python tool." },
            { title:"MOOWR",               desc:"Manufacturing and Other Operations in Warehouse Regulations management." },
            { title:"SEZ Compliance",      desc:"Special Economic Zone compliance tracking and reporting." },
            { title:"ITR Filing",          desc:"Income tax returns for companies, LLPs, and individuals." },
            { title:"Real-time Tracking",  desc:"Track every project's status, progress, and documents in one dashboard." },
          ].map(f => (
            <div key={f.title} style={{ background:"#fff", borderRadius:12, padding:"24px", border:"1px solid #e8ecf0" }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:"0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize:13, color:"#64748b", margin:0, lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section style={{ background:"#0f1f4a", padding:"60px 24px" }}>
        <div style={{ maxWidth:800, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontSize:26, fontWeight:700, color:"#fff", margin:"0 0 12px" }}>Three portals, one platform</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,0.6)", margin:"0 0 36px" }}>Each role gets exactly what they need</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[
              { role:"Client",   desc:"Track filings, upload documents, chat with your team", href:"/client/register" },
              { role:"Employee", desc:"Manage client projects, run tools, collaborate", href:"/employee/login" },
              { role:"Admin",    desc:"Full platform control — users, billing, settings", href:"/admin/login" },
            ].map(p => (
              <Link key={p.role} href={p.href} style={{ background:"rgba(255,255,255,0.07)", borderRadius:12, padding:"24px 20px", textDecoration:"none", border:"1px solid rgba(255,255,255,0.1)", display:"block", transition:"background .15s" }}>
                <p style={{ fontSize:16, fontWeight:700, color:"#fff", margin:"0 0 8px" }}>{p.role} Portal</p>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:"0 0 16px", lineHeight:1.5 }}>{p.desc}</p>
                <span style={{ fontSize:12, fontWeight:600, color:"#93c5fd" }}>Get started →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:"#fff", borderTop:"1px solid #e8ecf0", padding:"24px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#0f1f4a" }}>OptiTax</div>
        <div style={{ fontSize:12, color:"#94a3b8" }}>© 2026 OptiTax. All rights reserved.</div>
        <div style={{ display:"flex", gap:16 }}>
          {[["Client Login","/client/login"],["Employee","/employee/login"],["Admin","/admin/login"]].map(([l,h]) => (
            <Link key={l} href={h} style={{ fontSize:12, color:"#64748b", textDecoration:"none" }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}