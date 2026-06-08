"use client";
import { useEffect, useRef } from "react";
import { LogEntry, JobStatus } from "@/lib/toolTypes";

interface Props { logs: LogEntry[]; status: JobStatus; }

const B: Record<string, { bg: string; color: string; label: string }> = {
  info: { bg: "#1e3a6e", color: "#93c5fd", label: "INFO" },
  ok:   { bg: "#14532d", color: "#4ade80", label: "OK" },
  warn: { bg: "#78350f", color: "#fbbf24", label: "WARN" },
  err:  { bg: "#7f1d1d", color: "#f87171", label: "ERR" },
};

export default function LogsTab({ logs, status }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  const running = status === "running" || status === "uploading";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 20px", background:"#fff", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
        <span style={{ fontSize:12, color:"#94a3b8" }}>{logs.length} entries</span>
        {running && (
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#3b82f6", fontWeight:500 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#3b82f6", animation:"lb 1.2s ease-in-out infinite" }} />
            Live
          </span>
        )}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"6px 0", fontFamily:"'Cascadia Code','Consolas',monospace", fontSize:12, background:"#0f172a" }}>
        {logs.length === 0 ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", color:"#475569", fontFamily:"'Segoe UI',sans-serif" }}>
            {running ? "Waiting for output…" : "Run the tool to see logs here."}
          </div>
        ) : logs.map(log => {
          const b = B[log.level] ?? B.info;
          return (
            <div key={log.id} style={{ display:"flex", alignItems:"baseline", gap:10, padding:"3px 16px" }}>
              <span style={{ color:"#475569", fontSize:11, whiteSpace:"nowrap", flexShrink:0 }}>{log.ts}</span>
              <span style={{ fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:4, background:b.bg, color:b.color, flexShrink:0, minWidth:32, textAlign:"center" as const }}>{b.label}</span>
              <span style={{ color:log.level==="ok"?"#4ade80":log.level==="warn"?"#fbbf24":log.level==="err"?"#f87171":"#94a3b8", flex:1, wordBreak:"break-word", lineHeight:1.6 }}>{log.msg}</span>
            </div>
          );
        })}
        {running && logs.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", color:"#3b82f6", fontSize:11, fontFamily:"'Segoe UI',sans-serif" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#3b82f6", animation:"lb 1.2s ease-in-out infinite" }} />
            Processing…
          </div>
        )}
        <div ref={ref} />
      </div>
      <style>{`@keyframes lb{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
