"use client";
import { useState, useEffect } from "react";
import { ValidationResult, OutputSheet } from "@/lib/toolTypes";

interface Props {
  validations: ValidationResult[];
  outputs: OutputSheet[];
  jobId: string | null;
}

const S = {
  pass: { icon: "✓", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  warn: { icon: "!", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  fail: { icon: "✗", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
};

type SheetData = {
  headers: string[];
  rows: Record<string, string | number>[];
  sheetName: string;
  sheetNames: string[];
  totalRows: number;
  availableOutputs?: string[];
  availableInputs?: string[];
};

type InputFile = { name: string; key: string; filePath: string; label: string };

// ── Reusable Excel table ───────────────────────────────────────────────────
function ExcelTable({ data, jobId, filePath }: { data: SheetData; jobId: string; filePath: string }) {
  const [activeSheet, setActiveSheet] = useState(data.sheetName);
  const [sheetData, setSheetData] = useState<SheetData>(data);
  const [loading, setLoading] = useState(false);

  const switchSheet = async (sheet: string) => {
    if (sheet === activeSheet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/jobs/${jobId}/preview?file=${encodeURIComponent(filePath)}&sheet=${encodeURIComponent(sheet)}`);
      const json = await res.json();
      if (res.ok) { setSheetData(json); setActiveSheet(sheet); }
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* Sheet tabs */}
      {sheetData.sheetNames.length > 1 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 8, padding: "0 0 4px" }}>
          {sheetData.sheetNames.map(s => (
            <button key={s} onClick={() => switchSheet(s)}
              style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, border: `1px solid ${activeSheet===s?"#1e3a6e":"#e2e8f0"}`, background: activeSheet===s?"#1e3a6e":"#fff", color: activeSheet===s?"#fff":"#64748b", cursor: "pointer", fontFamily: "inherit" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
        {sheetData.headers.length} columns · {sheetData.totalRows} rows
        {sheetData.totalRows >= 500 && " (showing first 500)"}
      </div>

      {loading ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading sheet…</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8, maxHeight: 320, overflowY: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontFamily: "monospace", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "6px 10px", borderBottom: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 11, textAlign: "right" as const, minWidth: 32 }}>#</th>
                {sheetData.headers.map((h, i) => (
                  <th key={i} style={{ padding: "6px 10px", borderBottom: "1px solid #e2e8f0", borderLeft: "1px solid #e2e8f0", color: "#334155", fontWeight: 600, textAlign: "left" as const, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri%2===0?"#fff":"#fafafa" }}>
                  <td style={{ padding: "4px 10px", color: "#94a3b8", textAlign: "right" as const, borderBottom: "1px solid #f1f5f9", fontSize: 11 }}>{ri+1}</td>
                  {sheetData.headers.map((h, ci) => (
                    <td key={ci} style={{ padding: "4px 10px", color: "#1e293b", borderBottom: "1px solid #f1f5f9", borderLeft: "1px solid #f1f5f9", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {String(row[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── File preview card ──────────────────────────────────────────────────────
function FileCard({ name, filePath, jobId, accent }: { name: string; filePath: string; jobId: string; accent: string }) {
  const [data, setData]     = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const [open, setOpen]     = useState(false);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (data) return;
    setLoading(true); setErr("");
    try {
      const res  = await fetch(`/api/tools/jobs/${jobId}/preview?file=${encodeURIComponent(filePath)}`);
      const json = await res.json();
      if (!res.ok) {
        // Show available files in the error
        const avail = [...(json.availableOutputs ?? []), ...(json.availableInputs ?? [])].filter(Boolean);
        setErr(`${json.error}${avail.length ? `\nAvailable: ${avail.join(", ")}` : ""}`);
      } else {
        setData(json);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ border: `1px solid ${open ? accent : "#e2e8f0"}`, borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
      <button onClick={toggle}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: open ? `${accent}08` : "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>📄</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ fontSize: 11, color: accent, fontWeight: 500, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 12px 12px", background: "#fafafa" }}>
          <div style={{ height: 1, background: "#e2e8f0", margin: "0 0 10px" }} />
          {loading && <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading preview…</div>}
          {err && (
            <div style={{ padding: "10px 12px", color: "#991b1b", fontSize: 12, background: "#fef2f2", borderRadius: 6, whiteSpace: "pre-wrap" }}>
              ⚠ {err}
            </div>
          )}
          {data && <ExcelTable data={data} jobId={jobId} filePath={filePath} />}
        </div>
      )}
    </div>
  );
}

// ── Auto rules ─────────────────────────────────────────────────────────────
function computeAutoRules(validations: ValidationResult[], outputs: OutputSheet[]): ValidationResult[] {
  const main = outputs.filter(o => o.type === "main");
  const back = outputs.filter(o => o.type === "back");
  const fails = validations.filter(v => v.status === "fail");
  const hasMain = outputs.some(o => o.name.toLowerCase().includes("dbk working") || o.name.toLowerCase().includes("main dbk"));
  return [
    { group: "Auto Rules", label: "Main output files produced",  status: main.length > 0 ? "pass" : "fail", value: `${main.length} file(s)` },
    { group: "Auto Rules", label: "Backworking files produced",  status: back.length > 0 ? "pass" : "warn", value: `${back.length} file(s)` },
    { group: "Auto Rules", label: "DBK Working Sheet present",   status: hasMain ? "pass" : "fail",          value: hasMain ? "Found" : "Missing" },
    { group: "Auto Rules", label: "No pipeline failures",        status: fails.length === 0 ? "pass" : "fail", value: fails.length === 0 ? "All clear" : `${fails.length} failure(s)` },
  ];
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ValidationTab({ validations, outputs, jobId }: Props) {
  const [tab, setTab] = useState<"checks" | "data">("checks");
  const [inputFiles, setInputFiles] = useState<InputFile[]>([]);
  const [inputsLoaded, setInputsLoaded] = useState(false);

  // Load input file list when switching to data tab
  useEffect(() => {
    if (tab !== "data" || !jobId || inputsLoaded) return;
    fetch(`/api/tools/jobs/${jobId}/inputs`)
      .then(r => r.json())
      .then(d => { setInputFiles(d.inputs ?? []); setInputsLoaded(true); })
      .catch(() => setInputsLoaded(true));
  }, [tab, jobId, inputsLoaded]);

  const autoRules = computeAutoRules(validations, outputs);
  const all    = [...autoRules, ...validations];
  const total  = all.length;
  const pass   = all.filter(v => v.status === "pass").length;
  const warn   = all.filter(v => v.status === "warn").length;
  const fail   = all.filter(v => v.status === "fail").length;
  const groups = [...new Set(all.map(v => v.group))];
  const accent = "#1e3a6e";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Summary bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" as const }}>
        {[{n:pass,l:"Passed",c:"#166534"},{n:warn,l:"Warnings",c:"#92400e"},{n:fail,l:"Failed",c:"#991b1b"}].map(({n,l,c}) => (
          <div key={l} style={{ display:"flex", flexDirection:"column" as const, alignItems:"center", minWidth:52 }}>
            <span style={{ fontSize:20, fontWeight:700, color:c, lineHeight:1 }}>{n}</span>
            <span style={{ fontSize:10, color:"#94a3b8" }}>{l}</span>
          </div>
        ))}
        <div style={{ flex:1, minWidth:80, height:5, borderRadius:3, overflow:"hidden", background:"#f1f5f9", display:"flex", marginLeft:8 }}>
          <div style={{ width:`${(pass/total)*100}%`, background:"#22c55e", transition:"width .5s" }} />
          <div style={{ width:`${(warn/total)*100}%`, background:"#f59e0b", transition:"width .5s" }} />
          <div style={{ width:`${(fail/total)*100}%`, background:"#ef4444", transition:"width .5s" }} />
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex", background:"#f8fafc", borderBottom:"1px solid #e2e8f0", padding:"0 20px" }}>
        {([
          ["checks", "Validation Checks", `${pass}/${total}`],
          ["data",   "Input & Output Data", `${inputFiles.length + outputs.length}`],
        ] as const).map(([id, label, badge]) => (
          <button key={id} onClick={() => setTab(id as "checks"|"data")}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 10px", fontSize:12, fontWeight:500, color:tab===id?accent:"#64748b", background:"none", border:"none", borderBottom:`2px solid ${tab===id?accent:"transparent"}`, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {label}
            <span style={{ fontSize:10, fontWeight:600, background:tab===id?`${accent}15`:"#e2e8f0", color:tab===id?accent:"#64748b", padding:"1px 5px", borderRadius:8 }}>{badge}</span>
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto" }}>

        {/* ── Checks tab ── */}
        {tab === "checks" && (
          <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column" as const, gap:20 }}>
            {all.length === 0
              ? <div style={{ textAlign:"center", padding:"32px", color:"#94a3b8", fontSize:13 }}>Run the tool to see validation results</div>
              : groups.map(group => (
                <div key={group}>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#94a3b8", marginBottom:8 }}>{group}</p>
                  {all.filter(v => v.group === group).map((item, i) => {
                    const s = S[item.status];
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:10, border:`1px solid ${s.border}`, background:s.bg, marginBottom:6 }}>
                        <span style={{ width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, border:`1.5px solid ${s.border}`, color:s.color, flexShrink:0 }}>{s.icon}</span>
                        <span style={{ flex:1, fontSize:13, color:"#334155" }}>{item.label}</span>
                        <span style={{ fontSize:12, fontWeight:600, fontFamily:"monospace", whiteSpace:"nowrap" as const, color:s.color }}>{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              ))
            }
          </div>
        )}

        {/* ── Data tab — split layout ── */}
        {tab === "data" && jobId && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", height:"100%", minHeight:0 }}>

            {/* LEFT — Input files */}
            <div style={{ borderRight:"1px solid #e2e8f0", overflowY:"auto" }}>
              <div style={{ padding:"10px 14px", background:"#f0f9ff", borderBottom:"1px solid #bae6fd", position:"sticky", top:0, zIndex:1 }}>
                <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369a1" }}>
                  📥 Input Files
                </span>
                <span style={{ fontSize:11, color:"#0369a1", marginLeft:6 }}>({inputFiles.length})</span>
              </div>
              <div style={{ padding:"12px" }}>
                {!inputsLoaded && (
                  <div style={{ textAlign:"center", padding:"24px", color:"#94a3b8", fontSize:13 }}>Loading…</div>
                )}
                {inputsLoaded && inputFiles.length === 0 && (
                  <div style={{ textAlign:"center", padding:"24px", color:"#94a3b8", fontSize:13 }}>
                    No input files found.<br/>
                    <span style={{ fontSize:11 }}>Run the tool first.</span>
                  </div>
                )}
                {inputFiles.map((f, i) => (
                  <FileCard key={i} name={f.name} filePath={f.filePath} jobId={jobId} accent="#0891b2" />
                ))}
              </div>
            </div>

            {/* RIGHT — Output files */}
            <div style={{ overflowY:"auto" }}>
              <div style={{ padding:"10px 14px", background:"#f0fdf4", borderBottom:"1px solid #bbf7d0", position:"sticky", top:0, zIndex:1 }}>
                <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#166534" }}>
                  📤 Output Files
                </span>
                <span style={{ fontSize:11, color:"#166534", marginLeft:6 }}>({outputs.length})</span>
              </div>
              <div style={{ padding:"12px" }}>
                {outputs.length === 0 && (
                  <div style={{ textAlign:"center", padding:"24px", color:"#94a3b8", fontSize:13 }}>
                    No output files yet.<br/>
                    <span style={{ fontSize:11 }}>Run the tool to generate outputs.</span>
                  </div>
                )}
                {outputs.map((o, i) => (
                  <FileCard key={i} name={o.name} filePath={o.filePath} jobId={jobId} accent="#166534" />
                ))}
              </div>
            </div>

          </div>
        )}

        {tab === "data" && !jobId && (
          <div style={{ textAlign:"center", padding:"48px 20px", color:"#94a3b8", fontSize:13 }}>
            Run the tool first to see input and output data
          </div>
        )}

      </div>
    </div>
  );
}
