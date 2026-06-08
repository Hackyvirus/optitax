"use client";
import { useEffect, useState } from "react";

type Client   = { _id:string; firstName:string; lastName:string; email:string; phone:string; businessName:string; gstin:string; servicesNeeded:string[]; createdAt:string };
type Employee = { _id:string; firstName:string; lastName:string; email:string; department:string; designation:string; createdAt:string };

const card: React.CSSProperties = { background:"#fff", borderRadius:12, border:"1px solid #e8ecf0", overflow:"hidden" };
const th:   React.CSSProperties = { padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".06em", background:"#f8fafc", borderBottom:"1px solid #e8ecf0" };
const td:   React.CSSProperties = { padding:"11px 16px", fontSize:13, color:"#475569", borderBottom:"1px solid #f1f5f9" };

export default function AdminPeople() {
  const [tab, setTab]             = useState<"clients"|"employees">("clients");
  const [clients, setClients]     = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/clients").then(r=>r.json()),
      fetch("/api/admin/employees").then(r=>r.json()),
    ]).then(([c,e]) => { setClients(c.clients||[]); setEmployees(e.employees||[]); setLoading(false); })
     .catch(()=>setLoading(false));
  }, []);

  const fc = clients.filter(c=>`${c.firstName} ${c.lastName} ${c.businessName} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
  const fe = employees.filter(e=>`${e.firstName} ${e.lastName} ${e.email} ${e.department}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>People</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Manage clients and team members</p>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {(["clients","employees"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 20px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:tab===t?"#0f1f4a":"#f1f5f9", color:tab===t?"#fff":"#64748b", transition:"all .15s", textTransform:"capitalize" }}>
            {t} ({t==="clients"?clients.length:employees.length})
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab}…`}
          style={{ marginLeft:"auto", padding:"8px 14px", borderRadius:8, border:"1px solid #e8ecf0", fontSize:13, outline:"none", background:"#fff", width:220 }}/>
      </div>

      {loading ? <p style={{ color:"#94a3b8", fontSize:14 }}>Loading…</p> : (
        <div style={card}>
          {tab==="clients" && (
            fc.length===0 ? (
              <div style={{ padding:"48px 24px", textAlign:"center" }}>
                <p style={{ fontSize:14, color:"#94a3b8", margin:"0 0 12px" }}>No clients registered yet.</p>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["Business","Contact","Email","Phone","GSTIN","Joined"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {fc.map(c=>(
                    <tr key={c._id} style={{ transition:"background .1s" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <td style={{...td,fontWeight:600,color:"#0f172a"}}>{c.businessName||"—"}</td>
                      <td style={td}>{c.firstName} {c.lastName}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.phone||"—"}</td>
                      <td style={td}><code style={{ background:"#f1f5f9", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{c.gstin||"—"}</code></td>
                      <td style={td}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {tab==="employees" && (
            fe.length===0 ? (
              <div style={{ padding:"48px 24px", textAlign:"center" }}>
                <p style={{ fontSize:14, color:"#94a3b8", margin:"0 0 12px" }}>No employees registered yet.</p>
                <a href="/dashboard/admin/invite-codes" style={{ fontSize:13, fontWeight:600, color:"#0f1f4a" }}>Create an invite code →</a>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["Name","Email","Department","Designation","Joined"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {fe.map(e=>(
                    <tr key={e._id}
                      onMouseEnter={ev=>(ev.currentTarget.style.background="#f8fafc")}
                      onMouseLeave={ev=>(ev.currentTarget.style.background="transparent")}>
                      <td style={{...td,fontWeight:600,color:"#0f172a"}}>{e.firstName} {e.lastName}</td>
                      <td style={td}>{e.email}</td>
                      <td style={td}>{e.department||"—"}</td>
                      <td style={td}>{e.designation||"—"}</td>
                      <td style={td}>{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      )}
    </div>
  );
}