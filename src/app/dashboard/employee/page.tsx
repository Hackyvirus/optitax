"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLOR: Record<string,string> = { "In Progress":"#2563eb","Completed":"#059669","Pending":"#d97706","On Hold":"#9ca3af" };
const STATUS_BG:    Record<string,string> = { "In Progress":"#dbeafe","Completed":"#d1fae5","Pending":"#fef3c7","On Hold":"#f3f4f6" };

export default function EmployeeDashboard() {
  const [d, setD]       = useState({ name:"", stats:{ active:0, total:0, msgs:0 } });
  const [projects, setP] = useState<{title:string;status:string;clientId:{businessName:string;firstName:string};endDate:string}[]>([]);
  const [ok, setOk]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
    ]).then(([dash, proj]) => {
      const ps = proj.projects||[];
      setD({ name:dash.name||"", stats:{ active:ps.filter((p:{status:string})=>p.status==="In Progress").length, total:ps.length, msgs:dash.stats?.unreadMsgs||0 } });
      setP(ps.slice(0,5));
      setOk(true);
    }).catch(()=>setOk(true));
  }, []);

  return (
    <div>
      <div className="ph">
        <h1>{ok?`Good morning, ${d.name}`:"Loading…"}</h1>
        <p>Your work overview for today.</p>
      </div>

      <div className="stats-grid stats-3">
        {[
          { label:"Active Projects",  value:d.stats.active, note:"Assigned to you" },
          { label:"Total Projects",   value:d.stats.total,  note:"All time" },
          { label:"Unread Messages",  value:d.stats.msgs,   note:"From clients" },
        ].map(s => (
          <div key={s.label} className="stat">
            <div className="stat-lbl">{s.label}</div>
            <div className="stat-val">{ok?s.value:"—"}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="main-side">
        <div className="card card-p">
          <div className="sec-h">Assigned Projects</div>
          {!ok && <p style={{ fontSize:13, color:"#9ca3af" }}>Loading…</p>}
          {ok && projects.length===0 && <p style={{ fontSize:13, color:"#9ca3af" }}>No projects assigned yet.</p>}
          {projects.map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:i<projects.length-1?"1px solid #f3f4f6":"none" }}>
              <div>
                <div style={{ fontSize:13.5, fontWeight:500, color:"#111827", marginBottom:2 }}>{p.title}</div>
                <div style={{ fontSize:12, color:"#9ca3af" }}>{p.clientId?.businessName||p.clientId?.firstName}{p.endDate?` · Due ${p.endDate}`:""}</div>
              </div>
              <span className="badge" style={{ background:STATUS_BG[p.status]||"#f3f4f6", color:STATUS_COLOR[p.status]||"#6b7280" }}>{p.status}</span>
            </div>
          ))}
          <Link href="/dashboard/employee/project" style={{ display:"block", marginTop:14, fontSize:12.5, color:"#2563eb", fontWeight:500 }}>View all projects →</Link>
        </div>

        <div className="card card-p">
          <div className="sec-h">Go To</div>
          {[
            { label:"Projects",  href:"/dashboard/employee/project" },
            { label:"Messages",  href:"/dashboard/employee/msg" },
            { label:"Analysis",  href:"/dashboard/employee/analysis" },
            { label:"Profile",   href:"/dashboard/employee/profile" },
          ].map(l => (
            <Link key={l.href} href={l.href} className="nav-row" style={{ marginBottom:2 }}>
              {l.label}<span style={{ color:"#d1d5db" }}>›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}