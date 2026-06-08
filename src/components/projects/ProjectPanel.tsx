"use client";
import { useState, useRef } from "react";
import { Project, ProjectMessage, ProjectFile } from "@/lib/projectTypes";

interface Props {
  project: Project;
  onClose: () => void;
  role: "admin" | "employee" | "client";
}

export default function ProjectPanel({ project, onClose, role }: Props) {
  const [tab, setTab]       = useState<"overview"|"files"|"discussion">("overview");
  const [open, setOpen]     = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ProjectMessage[]>(project.messages ?? []);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => { setOpen(false); setTimeout(onClose, 320); };

  const STATUS_COLOR: Record<string, string> = {
    active: "#10b981", on_hold: "#f59e0b", completed: "#1e3a6e", cancelled: "#ef4444",
  };
  const sc = STATUS_COLOR[project.status] ?? "#64748b";

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      author: role === "client" ? project.clientName : "You",
      authorRole: role,
      content: message.trim(),
      createdAt: new Date().toISOString(),
    }]);
    setMessage("");
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  const fmtBytes = (n: number) => n < 1024 ? `${n}B` : n < 1048576 ? `${(n/1024).toFixed(1)}KB` : `${(n/1048576).toFixed(1)}MB`;

  const TABS = [
    { id:"overview",   label:"Overview",   badge: "" },
    { id:"files",      label:"Files",      badge: String(project.files?.length ?? 0) },
    { id:"discussion", label:"Discussion", badge: String(messages.length) },
  ] as const;

  return (
    <>
      <div onClick={close} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.3)", backdropFilter:"blur(2px)", zIndex:40, opacity:open?1:0, transition:"opacity .3s", pointerEvents:open?"auto":"none" }} />

      <div style={{
        position:"fixed", top:0, right:0, height:"100vh", width:"min(780px,100vw)",
        background:"#f8fafc", borderLeft:"1px solid #e2e8f0", zIndex:50,
        display:"flex", flexDirection:"column",
        transform:open?"translateX(0)":"translateX(100%)",
        transition:"transform .32s cubic-bezier(0.32,0,0.17,1)",
        boxShadow:"-8px 0 48px rgba(0,0,0,0.12)",
        fontFamily:"'Segoe UI',sans-serif",
      }}>

        {/* Header */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"16px 24px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <h2 style={{ fontSize:17, fontWeight:700, color:"#1e293b", margin:0 }}>{project.title}</h2>
                <span style={{ fontSize:10, fontWeight:600, color:sc, background:`${sc}18`, border:`1px solid ${sc}40`, padding:"2px 9px", borderRadius:20 }}>
                  {project.status.replace("_"," ").toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize:12, color:"#64748b" }}>
                Client: <strong style={{ color:"#334155" }}>{project.clientName}</strong>
                <span style={{ margin:"0 8px" }}>·</span>
                {fmtDate(project.startDate)} → {fmtDate(project.endDate)}
              </div>
            </div>
            <button onClick={close} style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:5, cursor:"pointer", color:"#64748b", display:"flex", flexShrink:0 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Progress */}
          <div style={{ marginTop:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:12, color:"#64748b" }}>Overall Progress</span>
              <span style={{ fontSize:12, fontWeight:600, color:"#1e3a6e" }}>{project.progress}%</span>
            </div>
            <div style={{ height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${project.progress}%`, background:project.progress===100?"#22c55e":"#1e3a6e", borderRadius:3 }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 24px", flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 14px", fontSize:13, fontWeight:500, color:tab===t.id?"#1e3a6e":"#64748b", background:"none", border:"none", borderBottom:`2px solid ${tab===t.id?"#1e3a6e":"transparent"}`, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
              {t.label}
              {t.badge && t.badge !== "0" && (
                <span style={{ fontSize:10, fontWeight:600, background:"#e2e8f0", color:"#475569", padding:"1px 5px", borderRadius:8 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto" }}>

          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>
              {/* Key info grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[
                  { label:"Priority",    value: project.priority.charAt(0).toUpperCase() + project.priority.slice(1) },
                  { label:"Tool Used",   value: project.tool || "—" },
                  { label:"Members",     value: `${project.members.length} assigned` },
                  { label:"Start Date",  value: fmtDate(project.startDate) },
                  { label:"Due Date",    value: fmtDate(project.endDate) },
                  { label:"Created By",  value: project.createdBy || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:11, color:"#94a3b8", marginBottom:4, textTransform:"uppercase" as const, letterSpacing:".06em" }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:16 }}>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#94a3b8", marginBottom:8 }}>Description</p>
                <p style={{ fontSize:13, color:"#334155", lineHeight:1.6, margin:0 }}>{project.description}</p>
              </div>

              {/* Tags */}
              {project.tags?.length > 0 && (
                <div>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#94a3b8", marginBottom:8 }}>Tags</p>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                    {project.tags.map(tag => (
                      <span key={tag} style={{ fontSize:12, color:"#1e3a6e", background:"#eff6ff", padding:"3px 10px", borderRadius:20, border:"1px solid #bfdbfe" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Team members */}
              <div>
                <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#94a3b8", marginBottom:10 }}>Team Members</p>
                <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                  {project.members.map((m, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:10 }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:`hsl(${(m.name.charCodeAt(0)*37)%360},55%,55%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>
                        {m.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#1e293b" }}>{m.name}</div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>{m.role}</div>
                      </div>
                    </div>
                  ))}
                  {project.members.length === 0 && (
                    <div style={{ textAlign:"center", padding:"20px", color:"#94a3b8", fontSize:13 }}>No team members assigned yet</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Files tab ── */}
          {tab === "files" && (
            <div style={{ padding:24 }}>
              {/* Drop zone — clients can upload requirement files */}
              {(role === "client" || role === "admin") && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); }}
                  onClick={() => fileRef.current?.click()}
                  style={{ border:`2px dashed ${dragging?"#1e3a6e":"#cbd5e1"}`, borderRadius:12, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:dragging?"#eff6ff":"#fff", marginBottom:20, transition:"all .15s" }}
                >
                  <input ref={fileRef} type="file" multiple style={{ display:"none" }} />
                  <div style={{ fontSize:24, marginBottom:8 }}>📎</div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#334155", marginBottom:4 }}>
                    {role === "client" ? "Upload requirement files" : "Upload project files"}
                  </div>
                  <div style={{ fontSize:12, color:"#94a3b8" }}>Drop files here or click to browse</div>
                </div>
              )}

              {/* File categories */}
              {["requirement", "output", "reference"].map(cat => {
                const catFiles = (project.files ?? []).filter(f => f.category === cat);
                return (
                  <div key={cat} style={{ marginBottom:20 }}>
                    <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#94a3b8", marginBottom:8 }}>
                      {cat === "requirement" ? "📋 Requirement Files" : cat === "output" ? "📤 Output Files" : "📁 Reference Files"}
                      <span style={{ marginLeft:6, fontSize:11, fontWeight:400, color:"#cbd5e1" }}>({catFiles.length})</span>
                    </p>
                    {catFiles.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"16px", color:"#94a3b8", fontSize:12, background:"#f8fafc", borderRadius:8, border:"1px dashed #e2e8f0" }}>
                        No {cat} files yet
                      </div>
                    ) : catFiles.map(file => (
                      <div key={file.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, marginBottom:6 }}>
                        <div style={{ fontSize:20, flexShrink:0 }}>📄</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>{fmtBytes(file.size)} · {file.uploadedBy} · {fmtDate(file.uploadedAt)}</div>
                        </div>
                        <button style={{ fontSize:12, color:"#1e3a6e", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:7, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                          ↓ Download
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Discussion tab ── */}
          {tab === "discussion" && (
            <div style={{ display:"flex", flexDirection:"column" as const, height:"100%" }}>
              <div style={{ flex:1, overflowY:"auto", padding:"16px 24px", display:"flex", flexDirection:"column" as const, gap:12 }}>
                {messages.length === 0 && (
                  <div style={{ textAlign:"center", padding:"48px 20px", color:"#94a3b8", fontSize:13 }}>
                    No messages yet. Start the discussion!
                  </div>
                )}
                {messages.map(msg => {
                  const isMe = msg.authorRole === role;
                  const roleColor = msg.authorRole === "client" ? "#7c3aed" : msg.authorRole === "admin" ? "#dc2626" : "#1e3a6e";
                  return (
                    <div key={msg.id} style={{ display:"flex", flexDirection:"column" as const, alignItems:isMe?"flex-end":"flex-start" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>
                          {msg.author[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:roleColor }}>{msg.author}</span>
                        <span style={{ fontSize:10, color:"#94a3b8" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                        </span>
                      </div>
                      <div style={{
                        maxWidth:"75%", padding:"10px 14px",
                        background:isMe?"#1e3a6e":"#fff",
                        color:isMe?"#fff":"#334155",
                        border:isMe?"none":"1px solid #e2e8f0",
                        borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",
                        fontSize:13, lineHeight:1.5,
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message input */}
              <div style={{ padding:"14px 24px", background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex", gap:10 }}>
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message… (Enter to send)"
                  style={{ flex:1, padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#1e293b", background:"#f8fafc", outline:"none", fontFamily:"inherit" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  style={{ padding:"10px 18px", background:message.trim()?"#1e3a6e":"#94a3b8", color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:message.trim()?"pointer":"not-allowed", fontFamily:"inherit" }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
