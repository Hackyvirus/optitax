"use client";
import { useEffect, useState } from "react";

type Sub = { plan:string; status:string; amount:number; billingCycle:string; currentPeriodEnd:string; clientId:{firstName:string;lastName:string;businessName:string} };

const card: React.CSSProperties = { background:"#fff", borderRadius:12, border:"1px solid #e8ecf0" };
const th:   React.CSSProperties = { padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", background:"#f8fafc", borderBottom:"1px solid #e8ecf0" };
const td:   React.CSSProperties = { padding:"11px 16px", fontSize:13, color:"#475569", borderBottom:"1px solid #f1f5f9" };

export default function AdminSubscription() {
  const [subs, setSubs]       = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions").then(r=>r.json()).then(d=>{ setSubs(d.subscriptions||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const active  = subs.filter(s=>s.status==="active").length;
  const revenue = subs.filter(s=>s.status==="active").reduce((a,s)=>a+s.amount,0);

  const PLAN_COLOR: Record<string,string> = { starter:"#dbeafe", professional:"#ede9fe", enterprise:"#fef9c3" };
  const PLAN_TEXT:  Record<string,string> = { starter:"#1e40af", professional:"#6d28d9", enterprise:"#92400e" };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>Subscriptions</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Client subscription overview</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Active Subscribers", value:active,   note:"Paying clients" },
          { label:"Monthly Revenue",    value:`₹${(revenue/100).toLocaleString("en-IN")}`, note:"Approx MRR" },
          { label:"Total Clients",      value:subs.length, note:"Registered" },
        ].map(c=>(
          <div key={c.label} style={{ ...card, padding:"20px 24px" }}>
            <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", margin:"0 0 6px" }}>{c.label}</p>
            <p style={{ fontSize:26, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>{c.value}</p>
            <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>{c.note}</p>
          </div>
        ))}
      </div>

      {loading ? <p style={{ color:"#94a3b8", fontSize:14 }}>Loading…</p> : subs.length===0 ? (
        <div style={{ ...card, padding:"48px 24px", textAlign:"center" }}>
          <p style={{ fontSize:14, color:"#94a3b8" }}>No subscriptions yet.</p>
        </div>
      ) : (
        <div style={card}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Client","Plan","Cycle","Status","Valid Until"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {subs.map((s,i)=>(
                <tr key={i} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td style={{...td,fontWeight:600,color:"#0f172a"}}>{s.clientId?.businessName||`${s.clientId?.firstName} ${s.clientId?.lastName}`}</td>
                  <td style={td}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:PLAN_COLOR[s.plan]||"#f1f5f9", color:PLAN_TEXT[s.plan]||"#475569", textTransform:"capitalize" }}>{s.plan}</span></td>
                  <td style={{...td,textTransform:"capitalize"}}>{s.billingCycle}</td>
                  <td style={td}><span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:s.status==="active"?"#dcfce7":"#f1f5f9", color:s.status==="active"?"#166534":"#64748b" }}>{s.status}</span></td>
                  <td style={td}>{s.currentPeriodEnd?new Date(s.currentPeriodEnd).toLocaleDateString("en-IN"):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}