"use client";
import { useRef, useState, DragEvent } from "react";
import { Tool, ToolInput } from "@/lib/toolTypes";

interface Props {
  tool: Tool;
  selectedVersion: string | null;
  onVersionChange: (v: string) => void;
  uploadedFiles: Record<string, File>;
  config: Record<string, string>;
  onFilesChange: (f: Record<string, File>) => void;
  onConfigChange: (c: Record<string, string>) => void;
}

export default function UploadTab({ tool, selectedVersion, onVersionChange, uploadedFiles, config, onFilesChange, onConfigChange }: Props) {
  const [dragging, setDragging] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const fmtBytes = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(1)} MB`;
  const getExt  = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";
  const addFile = (key: string, file: File) => onFilesChange({ ...uploadedFiles, [key]: file });
  const removeFile = (key: string) => { const u = { ...uploadedFiles }; delete u[key]; onFilesChange(u); };

  const activeVersion = tool.versions?.find(v => v.id === selectedVersion);
  const activeInputs: ToolInput[] = activeVersion?.inputs ?? tool.inputs ?? [];

  const renderFile = (inp: ToolInput) => {
    const file = uploadedFiles[inp.key];
    const isDragging = dragging === inp.key;
    if (file) {
      return (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#065f46", background:"#d1fae5", padding:"3px 7px", borderRadius:6, flexShrink:0 }}>{getExt(file.name)}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</div>
            <div style={{ fontSize:11, color:"#64748b" }}>{fmtBytes(file.size)}</div>
          </div>
          <button onClick={() => removeFile(inp.key)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94a3b8", padding:"2px 6px", lineHeight:1 }}>×</button>
        </div>
      );
    }
    return (
      <div
        onClick={() => refs.current[inp.key]?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(inp.key); }}
        onDragLeave={() => setDragging(null)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(null); const f = e.dataTransfer.files[0]; if (f) addFile(inp.key, f); }}
        style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", border:`1.5px dashed ${isDragging ? tool.accent : "#cbd5e1"}`, borderRadius:12, cursor:"pointer", background:isDragging ? `${tool.accent}08` : "#fff", transition:"all .15s" }}
      >
        <input ref={el => { refs.current[inp.key] = el; }} type="file" accept={inp.accept} style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) addFile(inp.key, f); }} />
        <svg width="20" height="20" fill="none" viewBox="0 0 20 20" style={{ color:isDragging ? tool.accent : "#94a3b8", flexShrink:0 }}>
          <path d="M10 13V4M6 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{inp.label}{inp.required && <span style={{ color:"#ef4444" }}> *</span>}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Drop file or click · {inp.accept}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", gap:24 }}>
      {tool.versions && tool.versions.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#94a3b8", marginBottom:10 }}>Select Version</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {tool.versions.map(v => {
              const sel = selectedVersion === v.id;
              return (
                <button key={v.id} onClick={() => { onVersionChange(v.id); onFilesChange({}); }}
                  style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", background:sel ? `${tool.accent}08` : "#fff", border:`1.5px solid ${sel ? tool.accent : "#e2e8f0"}`, borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${sel ? tool.accent : "#cbd5e1"}`, background:sel ? tool.accent : "transparent", flexShrink:0, marginTop:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {sel && <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:sel ? tool.color : "#334155", marginBottom:2 }}>{v.label}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.4, marginBottom:6 }}>{v.description}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                      {v.inputs.map(inp => (
                        <span key={inp.key} style={{ fontSize:10, fontWeight:500, background:"#f1f5f9", color:"#64748b", padding:"2px 7px", borderRadius:10, border:"1px solid #e2e8f0" }}>
                          {inp.label}{inp.required ? " *" : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tool.config.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#94a3b8", marginBottom:10 }}>Configuration</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {tool.config.map(f => (
              <label key={f.key} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:12, fontWeight:500, color:"#475569", width:180, flexShrink:0 }}>{f.label}</span>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={config[f.key] ?? ""}
                  onChange={e => onConfigChange({ ...config, [f.key]: e.target.value })}
                  style={{ flex:1, padding:"7px 10px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1e293b", background:"#fff", outline:"none", fontFamily:"inherit" }}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {(!tool.versions || selectedVersion) && activeInputs.length > 0 && (
        <div>
          <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#94a3b8", marginBottom:10 }}>
            Input Files{activeVersion && <span style={{ marginLeft:8, textTransform:"none", fontSize:11, fontWeight:400, color:tool.accent }}> — {activeVersion.label}</span>}
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {activeInputs.map(inp => <div key={inp.key}>{renderFile(inp)}</div>)}
          </div>
        </div>
      )}

      {tool.versions && !selectedVersion && (
        <div style={{ padding:"24px 20px", background:"#f8fafc", border:"1.5px dashed #e2e8f0", borderRadius:12, textAlign:"center", color:"#94a3b8", fontSize:13 }}>
          ↑ Select a version above to see the required input files
        </div>
      )}
    </div>
  );
}
