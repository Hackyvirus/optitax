"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = ["Travel","Food","Office Supplies","Software","Training","Client Entertainment","Medical","Utilities","Other"];

const STATUS_COLOR: Record<string,string> = {
  pending:"#d97706", approved:"#059669", rejected:"#dc2626", paid:"#2563eb"
};
const STATUS_BG: Record<string,string> = {
  pending:"#fef3c7", approved:"#d1fae5", rejected:"#fee2e2", paid:"#dbeafe"
};

type R = {
  _id:string; amount:number; category:string; description:string;
  date:string; status:string; reviewNote:string; paymentRef:string;
  projectId:{title:string}|null; receiptUrl:string; createdAt:string;
};

export default function ClientReimbursements() {
  const [tab, setTab]         = useState<"list"|"new">("list");
  const [items, setItems]     = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{_id:string;title:string}[]>([]);
  const [form, setForm]       = useState({ amount:"", category:"Travel", description:"", date:"", projectId:"", receiptUrl:"", receiptName:"" });
  const [uploading, setUp]    = useState(false);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/reimbursements").then(r=>r.json()).then(d=>{ setItems(d.reimbursements||[]); setLoading(false); }).catch(()=>setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/projects").then(r=>r.json()).then(d=>setProjects(d.projects||[])).catch(()=>{});
  }, []);

  const uploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUp(true);
    const fd = new FormData();
    fd.append("file", file);
    const res  = await fetch("/api/reimbursements/upload", { method:"POST", body:fd });
    const data = await res.json();
    if (data.url) setForm(f=>({...f, receiptUrl:data.url, receiptName:file.name}));
    else setError(data.error || "Upload failed");
    setUp(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description || !form.date) { setError("Please fill all required fields"); return; }
    setSub(true); setError(""); setSuccess("");
    const res  = await fetch("/api/reimbursements", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error||"Failed"); setSub(false); return; }
    setSuccess("Request submitted! Finance team has been notified.");
    setForm({ amount:"", category:"Travel", description:"", date:"", projectId:"", receiptUrl:"", receiptName:"" });
    setSub(false); setTab("list"); load();
  };

  const inp: React.CSSProperties = { width:"100%", padding:"9px 13px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13.5, outline:"none", fontFamily:"inherit", background:"#fff" };

  return (
    <div>
      <div className="ph">
        <h1>Reimbursements</h1>
        <p>Submit and track your reimbursement requests</p>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <button onClick={()=>setTab("list")} className="btn" style={{ background:tab==="list"?"#0d1f4c":"#f3f4f6", color:tab==="list"?"#fff":"#374151" }}>My Requests</button>
        <button onClick={()=>setTab("new")}  className="btn" style={{ background:tab==="new" ?"#0d1f4c":"#f3f4f6", color:tab==="new" ?"#fff":"#374151" }}>+ New Request</button>
      </div>

      {tab === "new" && (
        <div className="card card-p" style={{ maxWidth:640 }}>
          <div className="sec-h" style={{ marginBottom:20 }}>Submit Reimbursement Request</div>

          {error   && <div style={{ padding:"10px 14px", background:"#fee2e2", border:"1px solid #fecaca", borderRadius:8, fontSize:13, color:"#991b1b", marginBottom:14 }}>⚠ {error}</div>}
          {success && <div style={{ padding:"10px 14px", background:"#d1fae5", border:"1px solid #a7f3d0", borderRadius:8, fontSize:13, color:"#065f46", marginBottom:14 }}>✓ {success}</div>}

          <form onSubmit={submit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <label className="inp-lbl">Amount (₹) <span style={{color:"#dc2626"}}>*</span></label>
                <input type="number" min="1" step="0.01" style={inp} placeholder="e.g. 1500" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/>
              </div>
              <div>
                <label className="inp-lbl">Category <span style={{color:"#dc2626"}}>*</span></label>
                <select style={inp} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="inp-lbl">Date <span style={{color:"#dc2626"}}>*</span></label>
                <input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/>
              </div>
              <div>
                <label className="inp-lbl">Linked Project (optional)</label>
                <select style={inp} value={form.projectId} onChange={e=>setForm(f=>({...f,projectId:e.target.value}))}>
                  <option value="">None</option>
                  {projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label className="inp-lbl">Description <span style={{color:"#dc2626"}}>*</span></label>
              <textarea style={{...inp, resize:"vertical", minHeight:80}} placeholder="Explain the purpose of this expense…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label className="inp-lbl">Receipt (optional)</label>
              <div style={{ border:"1.5px dashed #e5e7eb", borderRadius:8, padding:"16px", textAlign:"center", background:"#f9fafb" }}>
                {form.receiptUrl ? (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                    <span style={{ fontSize:13, color:"#059669", fontWeight:500 }}>✓ {form.receiptName}</span>
                    <button type="button" onClick={()=>setForm(f=>({...f,receiptUrl:"",receiptName:""}))} style={{ fontSize:11, color:"#dc2626", background:"none", border:"none", cursor:"pointer" }}>Remove</button>
                  </div>
                ) : (
                  <label style={{ cursor:"pointer" }}>
                    <div style={{ fontSize:13, color:"#6b7280" }}>{uploading?"Uploading…":"Click to upload receipt (PDF or image, max 10MB)"}</div>
                    <input type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={uploadReceipt} disabled={uploading}/>
                  </label>
                )}
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting?"Submitting…":"Submit Request"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" && (
        <div>
          {/* Summary */}
          <div className="stats-grid stats-4" style={{ marginBottom:20 }}>
            {[
              { label:"Total",    value:items.length,                                          note:"All requests" },
              { label:"Pending",  value:items.filter(r=>r.status==="pending").length,          note:"Awaiting review" },
              { label:"Approved", value:items.filter(r=>r.status==="approved").length,         note:"Finance approved" },
              { label:"Paid",     value:`₹${items.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0)/100|0}`, note:"Total reimbursed" },
            ].map(s=>(
              <div key={s.label} className="stat">
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val" style={{ fontSize:24 }}>{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflow:"hidden" }}>
            {loading ? <p style={{ padding:24, fontSize:13, color:"#9ca3af" }}>Loading…</p>
            : items.length===0 ? (
              <div style={{ padding:"48px 24px", textAlign:"center" }}>
                <p style={{ fontSize:14, color:"#9ca3af", marginBottom:12 }}>No reimbursement requests yet.</p>
                <button onClick={()=>setTab("new")} className="btn btn-primary" style={{ fontSize:12 }}>Submit your first request</button>
              </div>
            ) : (
              <table className="tbl">
                <thead><tr>{["Date","Category","Description","Amount","Project","Receipt","Status","Submitted"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {items.map(r=>(
                    <tr key={r._id}>
                      <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                      <td><span className="badge b-gray">{r.category}</span></td>
                      <td style={{ maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.description}</td>
                      <td style={{ fontWeight:600, color:"#111827" }}>₹{(r.amount/100).toLocaleString("en-IN")}</td>
                      <td>{r.projectId?.title||"—"}</td>
                      <td>{r.receiptUrl?<a href={r.receiptUrl} target="_blank" style={{ color:"#2563eb", fontSize:12, fontWeight:500 }}>View</a>:"—"}</td>
                      <td><span className="badge" style={{ background:STATUS_BG[r.status], color:STATUS_COLOR[r.status] }}>{r.status}</span></td>
                      <td style={{ color:"#9ca3af" }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}