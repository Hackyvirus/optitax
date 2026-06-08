"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [d, setD]   = useState({ name:"", stats:{ totalClients:0, totalProjects:0, activeProjects:0, unreadMsgs:0 } });
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then(r=>r.json()).then(data => {
      setD({ name:data.name||"Admin", stats:{ totalClients:data.stats?.totalClients||0, totalProjects:data.stats?.totalProjects||0, activeProjects:data.stats?.activeProjects||0, unreadMsgs:data.stats?.unreadMsgs||0 } });
      setOk(true);
    }).catch(()=>setOk(true));
  }, []);

  const stats = [
    { label:"Clients",         value:d.stats.totalClients,   note:"Registered" },
    { label:"Total Projects",  value:d.stats.totalProjects,  note:"All time" },
    { label:"Active",          value:d.stats.activeProjects, note:"In progress" },
    { label:"Unread Messages", value:d.stats.unreadMsgs,     note:"Need response" },
  ];

  const links = [
    { label:"Projects",    sub:"Manage all client work",    href:"/dashboard/admin/project" },
    { label:"People",      sub:"Clients and team members",  href:"/dashboard/admin/employee" },
    { label:"Messages",    sub:"Client conversations",      href:"/dashboard/admin/msg" },
    { label:"Invite Codes",sub:"Control team access",       href:"/dashboard/admin/invite-codes" },
  ];

  return (
    <div>
      <div className="ph">
        <h1>{ok ? `Good morning, ${d.name}` : "Loading…"}</h1>
        <p>Here is what is happening across your practice today.</p>
      </div>

      <div className="stats-grid stats-4">
        {stats.map(s => (
          <div key={s.label} className="stat">
            <div className="stat-lbl">{s.label}</div>
            <div className="stat-val">{ok ? s.value : "—"}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card card-p">
          <div className="sec-h">Quick Access</div>
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-row" style={{ marginBottom:2 }}>
              <div>
                <div style={{ fontSize:13.5, fontWeight:500, color:"#111827" }}>{l.label}</div>
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:1 }}>{l.sub}</div>
              </div>
              <span style={{ color:"#d1d5db", fontSize:16 }}>›</span>
            </Link>
          ))}
        </div>

        <div className="card card-p">
          <div className="sec-h">Project Overview</div>
          {[
            { label:"Active",    count:d.stats.activeProjects,    color:"#2563eb" },
            { label:"Completed", count:Math.max(0,d.stats.totalProjects-d.stats.activeProjects), color:"#059669" },
          ].map(b => (
            <div key={b.label} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:13, color:"#6b7280" }}>{b.label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{ok?b.count:"—"}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ background:b.color, width:d.stats.totalProjects>0?`${Math.round((b.count/d.stats.totalProjects)*100)}%`:"0%" }}/>
              </div>
            </div>
          ))}
          <div style={{ paddingTop:8, borderTop:"1px solid #f3f4f6" }}>
            <span style={{ fontSize:13, color:"#9ca3af" }}>Total: </span>
            <span style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{ok?d.stats.totalProjects:"—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}