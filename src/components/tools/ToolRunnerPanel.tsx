"use client";
import { useState, useEffect, useRef } from "react";
import { Tool, JobState, JobStatus } from "@/lib/toolTypes";
import UploadTab from "@/components/tools/tabs/UploadTab";
import LogsTab from "@/components/tools/tabs/LogsTab";
import OutputsTab from "@/components/tools/tabs/OutputsTab";
import ValidationTab from "@/components/tools/tabs/ValidationTab";

interface Props { tool: Tool; onClose: () => void; canManage?: boolean; }

const SC: Record<JobStatus, string> = { idle:"#64748b", uploading:"#f59e0b", running:"#3b82f6", done:"#10b981", failed:"#ef4444" };
const SL: Record<JobStatus, string> = { idle:"Ready", uploading:"Uploading…", running:"Processing…", done:"Completed", failed:"Failed" };
const TABS = [
  { id:"upload",     label:"Upload" },
  { id:"logs",       label:"Logs" },
  { id:"outputs",    label:"Outputs" },
  { id:"validation", label:"Validation" },
];
const MIN_W = 420;

export default function ToolRunnerPanel({ tool, onClose, canManage = false }: Props) {
  const [tab, setTab]               = useState("upload");
  const [open, setOpen]             = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [width, setWidth]           = useState(700);
  const [job, setJob]               = useState<JobState>({
    jobId:null, status:"idle", logs:[], outputs:[], validations:[],
    uploadedFiles:{}, config:{}, selectedVersion:null,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const drag    = useRef({ active:false, startX:0, startW:700 });
  const isDragging = useRef(false);

  useEffect(() => { setTimeout(() => setOpen(true), 10); }, []);
  const stopPoll = () => { if (pollRef.current) clearInterval(pollRef.current); };
  useEffect(() => () => stopPoll(), []);

  // Global mouse move/up for resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const delta = drag.current.startX - e.clientX;
      const newW  = Math.min(Math.max(drag.current.startW + delta, MIN_W), window.innerWidth - 40);
      setWidth(newW);
    };
    const onUp = () => {
      drag.current.active = false;
      isDragging.current  = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    drag.current = { active:true, startX:e.clientX, startW:width };
    isDragging.current         = true;
    document.body.style.cursor     = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const close = () => { setOpen(false); setTimeout(onClose, 320); };

  const canRun        = job.status === "idle" || job.status === "done" || job.status === "failed";
  const activeVersion = tool.versions?.find(v => v.id === job.selectedVersion);
  const activeInputs  = activeVersion?.inputs ?? tool.inputs ?? [];
  const reqReady      = activeInputs.filter(i => i.required).every(i => !!job.uploadedFiles[i.key]);
  const verReady      = !tool.versions || !!job.selectedVersion;
  const runDisabled   = !verReady || !reqReady;
  const warnCount     = job.validations.filter(v => v.status !== "pass").length;
  const sc            = SC[job.status];

  const handleRun = async () => {
    if (runDisabled) return;
    setJob(j => ({ ...j, status:"uploading", logs:[], outputs:[], validations:[] }));
    setTab("logs");
    try {
      const form = new FormData();
      form.append("toolId",    tool.id);
      form.append("scriptKey", activeVersion?.scriptKey ?? tool.id);
      form.append("config",    JSON.stringify(job.config));
      Object.entries(job.uploadedFiles).forEach(([k, f]) => form.append(k, f));

      const res  = await fetch("/api/tools/run", { method:"POST", body:form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");

      setJob(j => ({ ...j, status:"running", jobId:data.jobId }));

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/tools/jobs/${data.jobId}`);
          const d = await r.json();
          setJob(j => ({ ...j, status:d.status, logs:d.logs??[], outputs:d.outputs??[], validations:d.validations??[] }));
          if (d.status === "done" || d.status === "failed") {
            stopPoll();
            if (d.status === "done") setTab("outputs");
          }
        } catch { /* ignore poll errors */ }
      }, 1500);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setJob(j => ({
        ...j, status:"failed",
        logs:[...j.logs,{ id:Date.now(), ts:new Date().toLocaleTimeString(), level:"err", msg }],
      }));
    }
  };

  const panelW = fullscreen ? "100vw" : `${width}px`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position:"fixed", inset:0,
          background:"rgba(15,23,42,0.3)", backdropFilter:"blur(2px)",
          zIndex:40, opacity:open?1:0, transition:"opacity .3s",
          pointerEvents:open?"auto":"none",
        }}
      />

      {/* Panel */}
      <div style={{
        position:"fixed", top:0, right:0,
        height:"100vh", width:panelW,
        background:"#f8fafc",
        borderLeft: fullscreen ? "none" : "1px solid #e2e8f0",
        zIndex:50, display:"flex", flexDirection:"column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .32s cubic-bezier(0.32,0,0.17,1)",
        boxShadow:"-8px 0 48px rgba(0,0,0,0.14)",
        fontFamily:"'Segoe UI',sans-serif",
      }}>

        {/* ── Drag handle (left edge) ── */}
        {!fullscreen && (
          <div
            onMouseDown={onDragStart}
            style={{
              position:"absolute", left:0, top:0, bottom:0, width:6,
              cursor:"ew-resize", zIndex:10,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            <div style={{
              width:3, height:40, borderRadius:2,
              background:"#cbd5e1", opacity:0,
              transition:"opacity .2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity="1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity="0"; }}
            />
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"14px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
            <span style={{ fontSize:22, flexShrink:0, lineHeight:1, marginTop:2 }}>{tool.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:tool.color, margin:"0 0 2px", letterSpacing:"-.01em", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" as const }}>
                {tool.name}
                {activeVersion && (
                  <span style={{ fontSize:12, fontWeight:500, color:tool.accent }}>— {activeVersion.label}</span>
                )}
                {canManage && (
                  <span style={{ fontSize:10, fontWeight:600, background:"#fef3c7", color:"#92400e", padding:"2px 7px", borderRadius:10 }}>Admin</span>
                )}
              </h2>
              <p style={{ fontSize:12, color:"#94a3b8", margin:0, lineHeight:1.4 }}>{tool.description}</p>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              {/* Status pill */}
              <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:500, color:sc, background:`${sc}18`, border:`1px solid ${sc}40`, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:sc }} />
                {SL[job.status]}
              </span>

              {/* Fullscreen toggle */}
              <button
                onClick={() => setFullscreen(f => !f)}
                title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
                style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:"5px 7px", cursor:"pointer", color:"#64748b", display:"flex", alignItems:"center" }}
              >
                {fullscreen ? (
                  /* compress icon */
                  <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
                    <path d="M10 1v4h4M5 1v4H1M10 14v-4h4M5 14v-4H1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  /* expand icon */
                  <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
                    <path d="M1 5V1h4M14 5V1h-4M1 10v4h4M14 10v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Close */}
              <button
                onClick={close}
                style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:8, padding:5, cursor:"pointer", color:"#64748b", display:"flex" }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 20px", flexShrink:0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"10px 14px", fontSize:13, fontWeight:500,
                color: tab===t.id ? tool.color : "#64748b",
                background:"none", border:"none",
                borderBottom:`2px solid ${tab===t.id ? tool.accent : "transparent"}`,
                cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
              }}
            >
              {t.label}
              {t.id==="logs"       && job.logs.length>0    && <span style={{ fontSize:10,fontWeight:600,background:"#e2e8f0", color:"#475569",padding:"1px 5px",borderRadius:8 }}>{job.logs.length}</span>}
              {t.id==="outputs"    && job.outputs.length>0 && <span style={{ fontSize:10,fontWeight:600,background:"#d1fae5",color:"#065f46",padding:"1px 5px",borderRadius:8 }}>{job.outputs.length}</span>}
              {t.id==="validation" && warnCount>0           && <span style={{ fontSize:10,fontWeight:600,background:"#fef3c7",color:"#78350f",padding:"1px 5px",borderRadius:8 }}>{warnCount}</span>}
            </button>
          ))}

          {/* Width indicator — far right */}
          {!fullscreen && (
            <span style={{ marginLeft:"auto", fontSize:11, color:"#cbd5e1", alignSelf:"center", paddingRight:4, userSelect:"none" }}>
              {width}px
            </span>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden" }}>
          {tab==="upload"     && (
            <UploadTab
              tool={tool}
              selectedVersion={job.selectedVersion}
              onVersionChange={v => setJob(j => ({...j, selectedVersion:v}))}
              uploadedFiles={job.uploadedFiles}
              config={job.config}
              onFilesChange={f => setJob(j => ({...j, uploadedFiles:f}))}
              onConfigChange={c => setJob(j => ({...j, config:c}))}
            />
          )}
          {tab==="logs"       && <LogsTab logs={job.logs} status={job.status} />}
          {tab==="outputs"    && <OutputsTab outputs={job.outputs} jobId={job.jobId} />}
          {tab==="validation" && <ValidationTab validations={job.validations} outputs={job.outputs} jobId={job.jobId} />}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:"12px 20px", background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          {canRun ? (
            <button
              onClick={handleRun}
              disabled={runDisabled}
              title={!verReady ? "Select a version first" : !reqReady ? "Upload required files first" : ""}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"9px 20px",
                background: runDisabled ? "#94a3b8" : tool.accent,
                color:"#fff", border:"none", borderRadius:10,
                fontSize:14, fontWeight:600,
                cursor: runDisabled ? "not-allowed" : "pointer",
                fontFamily:"inherit", flexShrink:0,
                opacity: runDisabled ? 0.5 : 1,
              }}
            >
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 13 13">
                <path d="M2.5 1.5l9 5-9 5v-10z"/>
              </svg>
              Run {activeVersion ? activeVersion.label : tool.name}
            </button>
          ) : (
            <button
              disabled
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 20px", background:"#64748b", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:600, fontFamily:"inherit", cursor:"not-allowed", flexShrink:0 }}
            >
              <span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"ps .7s linear infinite" }} />
              {SL[job.status]}
            </button>
          )}

          <span style={{ fontSize:12, color:"#94a3b8" }}>
            {!verReady
              ? "Select a version to continue"
              : Object.keys(job.uploadedFiles).length > 0
              ? `${Object.keys(job.uploadedFiles).length} file(s) ready`
              : "No files uploaded yet"}
          </span>

          {!fullscreen && (
            <span style={{ marginLeft:"auto", fontSize:11, color:"#cbd5e1", userSelect:"none" }}>
              ← drag edge to resize
            </span>
          )}
        </div>
      </div>

      <style>{`@keyframes ps { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}