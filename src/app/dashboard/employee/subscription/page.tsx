"use client";

export default function EmployeeSubscription() {
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>Subscription</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Platform access managed by admin</p>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e8ecf0", padding:"60px 24px", textAlign:"center" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>🔐</div>
        <p style={{ fontSize:16, fontWeight:600, color:"#0f172a", margin:"0 0 8px" }}>Your access is fully covered</p>
        <p style={{ fontSize:13, color:"#64748b", margin:"0 auto", maxWidth:360, lineHeight:1.6 }}>
          Employee accounts have full platform access. Subscriptions apply only to client accounts.
        </p>
      </div>
    </div>
  );
}