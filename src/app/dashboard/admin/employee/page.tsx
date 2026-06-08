"use client";
import { useEffect, useState } from "react";

type Client   = { _id:string; firstName:string; lastName:string; email:string; phone:string; businessName:string; gstin:string; createdAt:string };
type Employee = { _id:string; firstName:string; lastName:string; email:string; department:string; designation:string; isFinance:boolean; createdAt:string };

const th: React.CSSProperties = { padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".06em", background:"#f9fafb", borderBottom:"1px solid #e5e7eb" };
const td: React.CSSProperties = { padding:"11px 16px", fontSize:13.5, color:"#374151", borderBottom:"1px solid #f3f4f6" };

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
    ]).then(([c,e]) => {
      setClients(c.clients||[]);
      setEmployees(e.employees||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const toggleFinance = async (emp: Employee) => {
    const res = await fetch("/api/admin/employees/finance", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId: emp._id, isFinance: !emp.isFinance }),
    });
    if (res.ok) setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, isFinance: !e.isFinance } : e));
  };

  const fc = clients.filter(c  => `${c.firstName} ${c.lastName} ${c.businessName} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
  const fe = employees.filter(e => `${e.firstName} ${e.lastName} ${e.email} ${e.department}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="ph">
        <h1>People</h1>
        <p>Manage clients and team members</p>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
        {(["clients","employees"] as const).map(t => (
          <button key={t} onClick={()=>{ setTab(t); setSearch(""); }}
            className="btn" style={{ background:tab===t?"#0d1f4c":"#f3f4f6", color:tab===t?"#fff":"#374151", textTransform:"capitalize" }}>
            {t} ({t==="clients"?clients.length:employees.length})
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab}...`}
          style={{ marginLeft:"auto", padding:"8px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, outline:"none", width:220 }}/>
      </div>

      {loading ? <p style={{ fontSize:13, color:"#9ca3af" }}>Loading...</p> : (
        <div className="card" style={{ overflow:"hidden" }}>
          {tab === "clients" && (
            fc.length === 0
              ? <div style={{ padding:"48px 24px", textAlign:"center" }}><p style={{ fontSize:14, color:"#9ca3af" }}>No clients registered yet.</p></div>
              : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>{["Business","Contact","Email","Phone","GSTIN","Joined"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {fc.map(c=>(
                      <tr key={c._id} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{...td,fontWeight:600,color:"#111827"}}>{c.businessName||"—"}</td>
                        <td style={td}>{c.firstName} {c.lastName}</td>
                        <td style={td}>{c.email}</td>
                        <td style={td}>{c.phone||"—"}</td>
                        <td style={td}><code style={{ background:"#f3f4f6", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{c.gstin||"—"}</code></td>
                        <td style={td}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          )}

          {tab === "employees" && (
            fe.length === 0
              ? (
                <div style={{ padding:"48px 24px", textAlign:"center" }}>
                  <p style={{ fontSize:14, color:"#9ca3af", marginBottom:12 }}>No employees yet.</p>
                  <a href="/dashboard/admin/invite-codes" style={{ fontSize:13, fontWeight:600, color:"#0d1f4c" }}>Create an invite code</a>
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["Name","Email","Department","Designation","Finance Access","Joined"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {fe.map(e=>(
                      <tr key={e._id} onMouseEnter={ev=>ev.currentTarget.style.background="#f9fafb"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                        <td style={{...td,fontWeight:600,color:"#111827"}}>{e.firstName} {e.lastName}</td>
                        <td style={td}>{e.email}</td>
                        <td style={td}>{e.department||"—"}</td>
                        <td style={td}>{e.designation||"—"}</td>
                        <td style={td}>
                          <button onClick={()=>toggleFinance(e)} style={{
                            padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600,
                            border:"none", cursor:"pointer",
                            background: e.isFinance ? "#d1fae5" : "#f3f4f6",
                            color:      e.isFinance ? "#065f46" : "#6b7280",
                          }}>
                            {e.isFinance ? "✓ Finance" : "Grant Finance"}
                          </button>
                        </td>
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