"use client";
import { useState } from "react";
import { Project, ProjectStatus, ProjectPriority } from "@/lib/projectTypes";

interface Props {
  onClose: () => void;
  onCreated: (project: Project) => void;
  role: "admin" | "employee";
}

const TOOLS = ["Brand Rate / DBK", "GST Filing", "ITR Filing", "Document Upload", "Other"];

export default function CreateProjectModal({ onClose, onCreated, role }: Props) {
  const [form, setForm] = useState({
    title: "", description: "", clientName: "", clientEmail: "",
    status: "active" as ProjectStatus, priority: "medium" as ProjectPriority,
    tool: "", startDate: "", endDate: "", progress: 0, tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.clientName || !form.startDate || !form.endDate) {
      setError("Title, client name, start date and end date are required.");
      return;
    }
    setLoading(true); setError("");
    try {
      const body: Partial<Project> = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        members: [], files: [], messages: [],
        createdBy: role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      const res  = await fetch("/api/projects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");
      onCreated(data.project);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally { setLoading(false); }
  };

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label style={{ fontSize:12, fontWeight:500, color:"#475569", display:"block", marginBottom:5 }}>
        {label}{required && <span style={{ color:"#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );

  const inputStyle = { width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit", boxSizing:"border-box" as const };
  const selectStyle = { ...inputStyle, cursor:"pointer" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)", zIndex:60, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:620, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", fontFamily:"'Segoe UI',sans-serif" }}>

        {/* Modal header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:"#1e293b", margin:0 }}>Create New Project</h2>
            <p style={{ fontSize:12, color:"#94a3b8", margin:"3px 0 0" }}>Fill in the project details below</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:6, cursor:"pointer", color:"#64748b", display:"flex" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          {error && (
            <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, fontSize:13, color:"#991b1b" }}>{error}</div>
          )}

          <Field label="Project Title" required>
            <input style={inputStyle} placeholder="e.g. Brand Rate Filing - Autoliv Q1 2025" value={form.title} onChange={e => set("title", e.target.value)} />
          </Field>

          <Field label="Description">
            <textarea style={{ ...inputStyle, minHeight:80, resize:"vertical" as const }} placeholder="Describe the project scope and objectives..." value={form.description} onChange={e => set("description", e.target.value)} />
          </Field>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Client Name" required>
              <input style={inputStyle} placeholder="e.g. Autoliv India Pvt Ltd" value={form.clientName} onChange={e => set("clientName", e.target.value)} />
            </Field>
            <Field label="Client Email">
              <input style={inputStyle} type="email" placeholder="client@company.com" value={form.clientEmail} onChange={e => set("clientEmail", e.target.value)} />
            </Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Field label="Status">
              <select style={selectStyle} value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Priority">
              <select style={selectStyle} value={form.priority} onChange={e => set("priority", e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Tool">
              <select style={selectStyle} value={form.tool} onChange={e => set("tool", e.target.value)}>
                <option value="">Select tool</option>
                {TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Start Date" required>
              <input style={inputStyle} type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </Field>
            <Field label="End Date" required>
              <input style={inputStyle} type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </Field>
          </div>

          <Field label="Initial Progress (%)">
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <input type="range" min="0" max="100" value={form.progress} onChange={e => set("progress", parseInt(e.target.value))} style={{ flex:1 }} />
              <span style={{ fontSize:13, fontWeight:600, color:"#1e3a6e", minWidth:36 }}>{form.progress}%</span>
            </div>
          </Field>

          <Field label="Tags (comma separated)">
            <input style={inputStyle} placeholder="e.g. DBK, customs, 2025, Q1" value={form.tags} onChange={e => set("tags", e.target.value)} />
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid #e2e8f0", display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ padding:"9px 18px", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", color:"#64748b", fontFamily:"inherit" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding:"9px 24px", background:loading?"#94a3b8":"#1e3a6e", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit" }}>
            {loading ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
