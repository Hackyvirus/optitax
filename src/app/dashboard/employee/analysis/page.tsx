"use client";
import { useEffect, useState } from "react";

const card: React.CSSProperties = { background:"#fff", borderRadius:12, padding:"20px 24px", border:"1px solid #e8ecf0" };

export default function EmployeeAnalysis() {
  const [projects, setProjects] = useState<{status:string;type:string;clientId:{businessName:string;firstName:string}}[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/projects").then(r=>r.json()).then(d=>{ setProjects(d.projects||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const active    = projects.filter(p=>p.status==="In Progress").length;
  const completed = projects.filter(p=>p.status==="Completed").length;
  const pending   = projects.filter(p=>p.status==="Pending").length;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>My Analysis</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Your project performance overview</p>
      </div>

      {loading ? <p style={{ color:"#94a3b8" }}>Loading…</p> : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
            {[
              { label:"Total Assigned", value:projects.length, note:"All projects" },
              { label:"In Progress",    value:active,          note:"Currently working" },
              { label:"Completed",      value:completed,       note:"Delivered" },
              { label:"Pending",        value:pending,         note:"Not started" },
            ].map(c=>(
              <div key={c.label} style={card}>
                <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".08em", margin:"0 0 6px" }}>{c.label}</p>
                <p style={{ fontSize:28, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>{c.value}</p>
                <p style={{ fontSize:12, color:"#94a3b8", margin:0 }}>{c.note}</p>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={card}>
              <p style={{ fontSize:15, fontWeight:600, color:"#0f172a", margin:"0 0 16px" }}>Project Status</p>
              {[
                { label:"In Progress", count:active,    total:projects.length, color:"#3b82f6" },
                { label:"Completed",   count:completed, total:projects.length, color:"#22c55e" },
                { label:"Pending",     count:pending,   total:projects.length, color:"#f59e0b" },
              ].map(item=>(
                <div key={item.label} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, color:"#475569" }}>{item.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{item.count} / {item.total}</span>
                  </div>
                  <div style={{ height:6, background:"#f1f5f9", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:item.color, borderRadius:6, width:item.total>0?`${Math.round((item.count/item.total)*100)}%`:"0%", transition:"width .4s" }}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <p style={{ fontSize:15, fontWeight:600, color:"#0f172a", margin:"0 0 8px" }}>Recent Projects</p>
              {projects.length===0 ? <p style={{ fontSize:13, color:"#94a3b8" }}>No projects assigned yet.</p> : (
                <div>
                  {projects.slice(0,5).map((p,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f1f5f9" }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:500, color:"#0f172a", margin:"0 0 2px" }}>{p.type}</p>
                        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{p.clientId?.businessName||p.clientId?.firstName}</p>
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:20, background:p.status==="In Progress"?"#dbeafe":p.status==="Completed"?"#dcfce7":"#fef9c3", color:p.status==="In Progress"?"#1e40af":p.status==="Completed"?"#166534":"#92400e" }}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}