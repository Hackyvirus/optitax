"use client";
import { useState } from "react";
import { OutputSheet } from "@/lib/toolTypes";

interface Props { outputs: OutputSheet[]; jobId: string | null; }

export default function OutputsTab({ outputs, jobId }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const download = async (filePath: string, name: string) => {
    if (!jobId) return;
    setLoading(filePath);
    try {
      const res = await fetch(`/api/tools/jobs/${jobId}/download?file=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${name}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); } finally { setLoading(null); }
  };

  if (outputs.length === 0) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, padding:"48px 20px", color:"#94a3b8", textAlign:"center" }}>
      <svg width="40" height="40" fill="none" viewBox="0 0 40 40"><rect x="8" y="4" width="24" height="32" rx="4" stroke="#cbd5e1" strokeWidth="1.5"/><path d="M14 14h12M14 19h12M14 24h8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <p style={{ fontSize:13, maxWidth:200, lineHeight:1.5 }}>Output files appear here after processing</p>
    </div>
  );

  const renderGroup = (title: string, sheets: OutputSheet[], accent: string) => (
    <div style={{ marginBottom:24 }} key={title}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#94a3b8" }}>{title}</span>
        <button onClick={() => sheets.forEach(s => download(s.filePath, s.name))}
          style={{ fontSize:12, fontWeight:500, background:"none", border:"none", cursor:"pointer", color:accent, fontFamily:"inherit" }}>
          ↓ Download all
        </button>
      </div>
      {sheets.map((s, idx) => (
        <div key={`${s.name}-${idx}`} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, marginBottom:6 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:`${accent}15`, color:accent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
            <div style={{ fontSize:11, color:"#94a3b8" }}>{s.rows > 0 ? `${s.rows.toLocaleString()} rows` : "Ready to download"}</div>
          </div>
          <button onClick={() => download(s.filePath, s.name)} disabled={loading === s.filePath}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", border:`1px solid ${accent}`, borderRadius:7, background:"#fff", color:accent, fontSize:12, fontWeight:500, cursor:loading===s.filePath?"not-allowed":"pointer", fontFamily:"inherit", opacity:loading===s.filePath?0.5:1 }}>
            {loading === s.filePath ? "…" : "↓ Download"}
          </button>
        </div>
      ))}
    </div>
  );

  const main = outputs.filter(o => o.type === "main");
  const back = outputs.filter(o => o.type === "back");

  return (
    <div style={{ padding:20 }}>
      {main.length > 0 && renderGroup("Main Report", main, "#1e3a6e")}
      {back.length > 0 && renderGroup("Backworking Sheets", back, "#7c3aed")}
    </div>
  );
}
