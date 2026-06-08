"use client";
import { useState, useEffect } from "react";
import { Project } from "@/lib/projectTypes";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectPanel from "@/components/projects/ProjectPanel";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

// Projects loaded from MongoDB

function mapProject(p: Record<string, unknown>): Project {
  const client = p.clientId as Record<string, string> | null;
  return {
    _id:         String(p._id || ""),
    title:       String(p.title || ""),
    description: String(p.description || ""),
    clientName:  client?.businessName || `${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "Unknown Client",
    clientEmail: client?.email || "",
    status:      (p.status as string || "active").replace("In Progress","active").replace("Completed","completed").replace("On Hold","on_hold").replace("Pending","active").replace("Cancelled","cancelled") as Project["status"],
    priority:    (p.priority as string || "medium").toLowerCase() as Project["priority"],
    tool:        String(p.type || p.tool || "Other"),
    startDate:   String(p.startDate || p.createdAt || ""),
    endDate:     String(p.endDate || ""),
    progress:    Number(p.progress || 0),
    tags:        (p.tags as string[]) || [],
    members:     ((p.assignedTo as Record<string,string>[]) || []).map(u => ({
      userId: String(u._id || ""),
      name:   `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      role:   "Team Member",
    })),
    files:    ((p.files as Record<string,unknown>[]) || []).map((f, i) => ({
      id: String(f._id || i), name: String(f.name || ""), size: 0,
      uploadedBy: String(f.uploadedBy || ""), uploadedAt: String(f.createdAt || ""),
      category: (f.category as "requirement" | "output" | "reference") || "requirement",
      url: String(f.fileUrl || ""),
    })),
    messages: ((p.comments as Record<string,unknown>[]) || []).map((c, i) => ({
      id: String(c._id || i), author: String(c.authorName || "Team"),
      authorRole: (c.authorRole as "admin" | "employee" | "client") || "employee",
      content: String(c.content || ""), createdAt: String(c.createdAt || ""),
    })),
    createdBy: String(p.createdBy || "employee"),
    createdAt: String(p.createdAt || ""),
    updatedAt: String(p.updatedAt || ""),
  };
}
type FilterStatus = "all" | "active" | "on_hold" | "completed" | "cancelled";
type SortKey = "recent" | "deadline" | "priority" | "progress";

export default function EmployeeProjectPage() {
  const [projects, setProjects]     = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => { setProjects((d.projects || []).map(mapProject)); setLoadingProjects(false); })
      .catch(() => setLoadingProjects(false));
  }, []);
  const [selected, setSelected]     = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilter]   = useState<FilterStatus>("all");
  const [sort, setSort]             = useState<SortKey>("recent");
  const [search, setSearch]         = useState("");

  const filtered = projects
    .filter(p => filterStatus === "all" || p.status === filterStatus)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "deadline")  return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      if (sort === "priority")  return ["urgent","high","medium","low"].indexOf(a.priority) - ["urgent","high","medium","low"].indexOf(b.priority);
      if (sort === "progress")  return b.progress - a.progress;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const counts = {
    all: projects.length,
    active: projects.filter(p => p.status === "active").length,
    on_hold: projects.filter(p => p.status === "on_hold").length,
    completed: projects.filter(p => p.status === "completed").length,
    cancelled: projects.filter(p => p.status === "cancelled").length,
  };

  return (
    <div style={{ padding:"32px 36px", minHeight:"100%", fontFamily:"'Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, gap:16, flexWrap:"wrap" as const }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, color:"#1e3a6e", margin:"0 0 6px", letterSpacing:"-.02em" }}>Projects</h1>
          <p style={{ color:"#64748b", fontSize:15, margin:0 }}>Manage your assigned client projects.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"#1e3a6e", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 15 15"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
          New Project
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total",     value:counts.all,       color:"#1e3a6e", bg:"#eff6ff" },
          { label:"Active",    value:counts.active,    color:"#166534", bg:"#f0fdf4" },
          { label:"On Hold",   value:counts.on_hold,   color:"#92400e", bg:"#fffbeb" },
          { label:"Completed", value:counts.completed, color:"#1e3a6e", bg:"#f0f9ff" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background:bg, border:`1px solid ${color}20`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:24, fontWeight:700, color, lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" as const, alignItems:"center" }}>
        <input
          placeholder="Search projects or clients…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:"8px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit", minWidth:220 }}
        />
        <div style={{ display:"flex", gap:6 }}>
          {(["all","active","on_hold","completed","cancelled"] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding:"6px 12px", fontSize:12, fontWeight:500, borderRadius:20, border:`1px solid ${filterStatus===s?"#1e3a6e":"#e2e8f0"}`, background:filterStatus===s?"#1e3a6e":"#fff", color:filterStatus===s?"#fff":"#64748b", cursor:"pointer", fontFamily:"inherit" }}>
              {s==="all"?"All":s==="on_hold"?"On Hold":s.charAt(0).toUpperCase()+s.slice(1)}
              <span style={{ marginLeft:4, opacity:.7 }}>({counts[s]})</span>
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
          style={{ marginLeft:"auto", padding:"7px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:12, color:"#475569", background:"#fff", cursor:"pointer", fontFamily:"inherit" }}>
          <option value="recent">Most Recent</option>
          <option value="deadline">Deadline</option>
          <option value="priority">Priority</option>
          <option value="progress">Progress</option>
        </select>
      </div>

      {/* Project grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"64px 20px", color:"#94a3b8" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
          <div style={{ fontSize:16, fontWeight:500, color:"#64748b", marginBottom:6 }}>No projects found</div>
          <div style={{ fontSize:13 }}>{search ? "Try a different search term" : "Create your first project to get started"}</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
          {filtered.map(project => (
            <ProjectCard key={project._id} project={project} onClick={() => setSelected(project)} />
          ))}
        </div>
      )}

      {/* Project detail panel */}
      {selected && (
        <ProjectPanel project={selected} onClose={() => setSelected(null)} role="employee" />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateProjectModal
          role="employee"
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [mapProject(p as unknown as Record<string,unknown>), ...prev])}
        />
      )}
    </div>
  );
}