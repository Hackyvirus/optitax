"use client";
import { useEffect, useState } from "react";

const card: React.CSSProperties = { background:"#fff", borderRadius:12, padding:"20px 24px", border:"1px solid #e8ecf0" };

export default function AdminAnalysis() {
  const [stats, setStats] = useState({ totalClients:0, totalProjects:0, activeProjects:0, completedProjects:0, totalEmployees:0, unreadMsgs:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/admin/clients").then(r=>r.json()),
      fetch("/api/admin/employees").then(r=>r.json()),
    ]).then(([dash, proj, clients, employees]) => {
      const projects = proj.projects || [];
      setStats({
        totalClients:      (clients.clients||[]).length,
        totalProjects:     projects.length,
        activeProjects:    projects.filter((p:{status:string})=>p.status==="In Progress").length,
        completedProjects: projects.filter((p:{status:string})=>p.status==="Completed").length,
        totalEmployees:    (employees.employees||[]).length,
        unreadMsgs:        dash.stats?.unreadMsgs||0,
      });
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>Analysis</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Business overview and performance metrics</p>
      </div>
      {loading ? <p style={{ color:"#94a3b8" }}>Loading…</p> : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
            {[
              { label:"Total Clients",   value:stats.totalClients,      note:"Registered" },
              { label:"Total Projects",  value:stats.totalProjects,     note:"All time" },
              { label:"Active",          value:stats.activeProjects,    note:"In progress" },
              { label:"Completed",       value:stats.completedProjects, note:"Delivered" },
              { label:"Team Members",    value:stats.totalEmployees,    note:"Employees" },
              { label:"Unread Messages", value:stats.unreadMsgs,        note:"Need response" },
            ].map(c => (
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
                { label:"In Progress", count:stats.activeProjects,    color:"#3b82f6" },
                { label:"Completed",   count:stats.completedProjects, color:"#22c55e" },
                { label:"Pending",     count:Math.max(0,stats.totalProjects-stats.activeProjects-stats.completedProjects), color:"#f59e0b" },
              ].map(item => (
                <div key={item.label} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:13, color:"#475569" }}>{item.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{item.count} / {stats.totalProjects}</span>
                  </div>
                  <div style={{ height:6, background:"#f1f5f9", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:item.color, borderRadius:6, width:stats.totalProjects>0?`${Math.round((item.count/stats.totalProjects)*100)}%`:"0%", transition:"width .4s" }}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={card}>
              <p style={{ fontSize:15, fontWeight:600, color:"#0f172a", margin:"0 0 8px" }}>Quick Actions</p>
              {[
                { label:"Manage Projects", href:"/dashboard/admin/project" },
                { label:"View People",     href:"/dashboard/admin/employee" },
                { label:"Invite Codes",    href:"/dashboard/admin/invite-codes" },
                { label:"Messages",        href:"/dashboard/admin/msg" },
              ].map(a => (
                <a key={a.label} href={a.href} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:8, textDecoration:"none", color:"#0f172a", fontSize:13, fontWeight:500 }}
                  onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  {a.label}<span style={{ color:"#cbd5e1" }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}