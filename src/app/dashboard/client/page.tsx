"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STATUS_COLOR: Record<string,string> = { "In Progress":"#2563eb","Completed":"#059669","Pending":"#d97706" };
const STATUS_BG:    Record<string,string> = { "In Progress":"#dbeafe","Completed":"#d1fae5","Pending":"#fef3c7" };

export default function ClientDashboard() {
  const [d, setD]       = useState({ name:"", stats:{ active:0, completed:0, msgs:0, plan:"free" } });
  const [projects, setP] = useState<{title:string;status:string;progress:number;type:string;endDate:string}[]>([]);
  const [ok, setOk]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
    ]).then(([dash, proj]) => {
      const ps = proj.projects||[];
      setD({ name:dash.name||"", stats:{ active:dash.stats?.activeProjects||0, completed:dash.stats?.completed||0, msgs:dash.stats?.unreadMsgs||0, plan:dash.stats?.subscription||"free" } });
      setP(ps.slice(0,4));
      setOk(true);
    }).catch(()=>setOk(true));
  }, []);

  const planLabel = d.stats.plan.charAt(0).toUpperCase()+d.stats.plan.slice(1);

  return (
    <div>
      <div className="ph">
        <h1>{ok?`Welcome back, ${d.name}`:"Loading…"}</h1>
        <p>Your compliance overview.</p>
      </div>

      <div className="stats-grid stats-4">
        {[
          { label:"Active Projects",  value:d.stats.active,    note:"In progress" },
          { label:"Completed",        value:d.stats.completed, note:"This year" },
          { label:"Unread Messages",  value:d.stats.msgs,      note:"From team" },
          { label:"Plan",             value:planLabel,         note:"Current subscription", isText:true },
        ].map(s => (
          <div key={s.label} className="stat">
            <div className="stat-lbl">{s.label}</div>
            <div className="stat-val" style={{ fontSize:s.isText&&planLabel.length>6?20:28 }}>{ok?s.value:"—"}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="main-side">
        <div className="card card-p">
          <div className="sec-h">Active Projects</div>
          {!ok && <p style={{ fontSize:13, color:"#9ca3af" }}>Loading…</p>}
          {ok && projects.length===0 && <p style={{ fontSize:13, color:"#9ca3af" }}>No projects yet.</p>}
          {projects.map((p,i) => (
            <div key={i} style={{ paddingBottom:13, marginBottom:i<projects.length-1?13:0, borderBottom:i<projects.length-1?"1px solid #f3f4f6":"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:13.5, fontWeight:500, color:"#111827", marginBottom:2 }}>{p.title}</div>
                  <div style={{ fontSize:12, color:"#9ca3af" }}>{p.type}{p.endDate?` · Due ${p.endDate}`:""}</div>
                </div>
                <span className="badge" style={{ background:STATUS_BG[p.status]||"#f3f4f6", color:STATUS_COLOR[p.status]||"#6b7280", flexShrink:0 }}>{p.status}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div className="bar-track" style={{ flex:1 }}>
                  <div className="bar-fill" style={{ width:`${p.progress}%` }}/>
                </div>
                <span style={{ fontSize:11, color:"#9ca3af", flexShrink:0, width:30, textAlign:"right" }}>{p.progress}%</span>
              </div>
            </div>
          ))}
          <Link href="/dashboard/client/project" style={{ display:"block", marginTop:14, fontSize:12.5, color:"#2563eb", fontWeight:500 }}>View all projects →</Link>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card card-p">
            <div className="sec-h">Go To</div>
            {[
              { label:"Documents",    href:"/dashboard/client/documents" },
              { label:"Messages",     href:"/dashboard/client/msg" },
              { label:"Analysis",     href:"/dashboard/client/analysis" },
              { label:"Subscription", href:"/dashboard/client/subscription" },
            ].map(l => (
              <Link key={l.href} href={l.href} className="nav-row" style={{ marginBottom:2 }}>
                {l.label}<span style={{ color:"#d1d5db" }}>›</span>
              </Link>
            ))}
          </div>

          {ok && d.stats.plan==="free" && (
            <div style={{ background:"#0d1f4c", borderRadius:14, padding:"18px 20px" }}>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Free plan</div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginBottom:14, lineHeight:1.6 }}>Upgrade to unlock all compliance services.</p>
              <Link href="/dashboard/client/subscription" style={{ fontSize:12.5, fontWeight:600, color:"#93c5fd" }}>View plans →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}