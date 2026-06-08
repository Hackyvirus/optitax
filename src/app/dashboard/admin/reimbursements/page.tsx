"use client";
import { useEffect, useState } from "react";

const CATEGORIES = ["Travel","Food","Office Supplies","Software","Training","Client Entertainment","Medical","Utilities","Other"];
const STATUS_COLOR: Record<string,string> = { pending:"#d97706", approved:"#059669", rejected:"#dc2626", paid:"#2563eb" };
const STATUS_BG:    Record<string,string> = { pending:"#fef3c7", approved:"#d1fae5", rejected:"#fee2e2", paid:"#dbeafe" };

type R = {
  _id:string; amount:number; category:string; description:string; date:string;
  status:string; reviewNote:string; paymentRef:string; receiptUrl:string; createdAt:string;
  submittedBy:{firstName:string;lastName:string;email:string;role:string}|null;
  projectId:{title:string}|null;
};

export default function AdminReimbursements() {
  const [tab, setTab]         = useState<"all"|"mine"|"new">("all");
  const [allItems, setAll]    = useState<R[]>([]);
  const [myItems, setMine]    = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [selected, setSel]    = useState<R|null>(null);
  const [note, setNote]       = useState("");
  const [payRef, setPayRef]   = useState("");
  const [acting, setActing]   = useState(false);
  const [search, setSearch]   = useState("");
  const [projects, setProjects] = useState<{_id:string;title:string}[]>([]);

  // Submit form state
  const [form, setForm]       = useState({ amount:"", category:"Travel", description:"", date:"", projectId:"", receiptUrl:"", receiptName:"" });
  const [uploading, setUp]    = useState(false);
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const loadAll = () => {
    const q = filter === "all" ? "" : `?status=${filter}`;
    fetch(`/api/reimbursements${q}`).then(r=>r.json()).then(d=>{ setAll(d.reimbursements||[]); setLoading(false); }).catch(()=>setLoading(false));
  };

  const loadMine = () => {
    fetch("/api/reimbursements?mine=true").then(r=>r.json()).then(d=>setMine(d.reimbursements||[])).catch(()=>{});
  };

  useEffect(() => {
    setLoading(true);
    loadAll();
    loadMine();
    fetch("/api/projects").then(r=>r.json()).then(d=>setProjects(d.projects||[])).catch(()=>{});
  }, [filter]);

  const [actError, setActError] = useState("");

  const act = async (action: string) => {
    if (!selected) return;
    setActing(true); setActError("");
    const res  = await fetch("/api/reimbursements", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id:selected._id, action, reviewNote:note, paymentRef:payRef }) });
    const data = await res.json();
    if (res.ok) { setSel(null); setNote(""); setPayRef(""); setActError(""); loadAll(); }
    else setActError(data.error || "Action failed");
    setActing(false);
  };

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
    setSuccess("Request submitted successfully.");
    setForm({ amount:"", category:"Travel", description:"", date:"", projectId:"", receiptUrl:"", receiptName:"" });
    setSub(false); setTab("mine"); loadMine();
  };

  const inp: React.CSSProperties = { width:"100%", padding:"9px 13px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13.5, outline:"none", fontFamily:"inherit", background:"#fff" };

  const filtered = allItems.filter(r => {
    if (!search) return true;
    return `${r.submittedBy?.firstName} ${r.submittedBy?.lastName} ${r.submittedBy?.email} ${r.category} ${r.description}`.toLowerCase().includes(search.toLowerCase());
  });

  const totalPending$  = allItems.filter(r=>r.status==="pending").reduce((a,r)=>a+r.amount,0);
  const totalPaid      = allItems.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0);

  return (
    <div>
      <div className="ph">
        <h1>Reimbursements</h1>
        <p>Review all requests and manage your own</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[
          { key:"all",  label:"All Requests" },
          { key:"mine", label:"My Requests" },
          { key:"new",  label:"+ Submit Request" },
        ].map(t => (
          <button key={t.key} onClick={()=>setTab(t.key as typeof tab)}
            className="btn" style={{ background:tab===t.key?"#0d1f4c":"#f3f4f6", color:tab===t.key?"#fff":"#374151" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ALL REQUESTS (Finance desk) ───────────────────────── */}
      {tab === "all" && (
        <div>
          <div className="stats-grid stats-4" style={{ marginBottom:20 }}>
            {[
              { label:"Pending Review",   value:allItems.filter(r=>r.status==="pending").length, note:"Need action" },
              { label:"Pending Amount",   value:`₹${(totalPending$/100).toLocaleString("en-IN")}`, note:"To be reviewed" },
              { label:"Approved",         value:allItems.filter(r=>r.status==="approved").length, note:"Awaiting payment" },
              { label:"Total Reimbursed", value:`₹${(totalPaid/100).toLocaleString("en-IN")}`, note:"Paid out" },
            ].map(s=>(
              <div key={s.label} className="stat">
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val" style={{ fontSize:22 }}>{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center" }}>
            {["all","pending","approved","rejected","paid"].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} className="btn"
                style={{ padding:"6px 14px", fontSize:12, background:filter===s?"#0d1f4c":"#f3f4f6", color:filter===s?"#fff":"#374151", textTransform:"capitalize" }}>
                {s}
              </button>
            ))}
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
              style={{ marginLeft:"auto", padding:"7px 13px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", width:220 }}/>
          </div>

          <div className="card" style={{ overflow:"hidden" }}>
            {loading ? <p style={{ padding:24, fontSize:13, color:"#9ca3af" }}>Loading…</p>
            : filtered.length===0 ? <p style={{ padding:24, fontSize:13, color:"#9ca3af" }}>No requests found.</p>
            : (
              <table className="tbl">
                <thead><tr>{["Submitted By","Role","Date","Category","Amount","Receipt","Status","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(r=>(
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight:600, fontSize:13, color:"#111827" }}>{r.submittedBy?.firstName} {r.submittedBy?.lastName}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{r.submittedBy?.email}</div>
                      </td>
                      <td><span className="badge b-blue" style={{ textTransform:"capitalize" }}>{r.submittedBy?.role}</span></td>
                      <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                      <td><span className="badge b-gray">{r.category}</span></td>
                      <td style={{ fontWeight:700, color:"#111827" }}>₹{(r.amount/100).toLocaleString("en-IN")}</td>
                      <td>{r.receiptUrl?<a href={r.receiptUrl} target="_blank" style={{ color:"#2563eb", fontSize:12, fontWeight:500 }}>View</a>:"—"}</td>
                      <td><span className="badge" style={{ background:STATUS_BG[r.status], color:STATUS_COLOR[r.status] }}>{r.status}</span></td>
                      <td>
                        {r.status==="pending" && <button onClick={()=>{ setSel(r); setNote(""); setPayRef(""); }} className="btn" style={{ padding:"4px 12px", fontSize:12, background:"#0d1f4c", color:"#fff" }}>Review</button>}
                        {r.status==="approved" && <button onClick={()=>{ setSel(r); setNote(""); setPayRef(""); }} className="btn" style={{ padding:"4px 12px", fontSize:12, background:"#059669", color:"#fff" }}>Mark Paid</button>}
                        {(r.status==="rejected"||r.status==="paid") && <span style={{ fontSize:11, color:"#9ca3af" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── MY REQUESTS ───────────────────────────────────────── */}
      {tab === "mine" && (
        <div>
          <div className="stats-grid stats-4" style={{ marginBottom:20 }}>
            {[
              { label:"Total",    value:myItems.length },
              { label:"Pending",  value:myItems.filter(r=>r.status==="pending").length,  note:"Awaiting review" },
              { label:"Approved", value:myItems.filter(r=>r.status==="approved").length, note:"Finance approved" },
              { label:"Paid",     value:`₹${myItems.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0)/100|0}`, note:"Total received" },
            ].map(s=>(
              <div key={s.label} className="stat">
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val" style={{ fontSize:24 }}>{s.value}</div>
                <div className="stat-note">{s.note||""}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ overflow:"hidden" }}>
            {myItems.length===0 ? (
              <div style={{ padding:"48px 24px", textAlign:"center" }}>
                <p style={{ fontSize:14, color:"#9ca3af", marginBottom:12 }}>You haven't submitted any requests yet.</p>
                <button onClick={()=>setTab("new")} className="btn btn-primary" style={{ fontSize:12 }}>Submit a request</button>
              </div>
            ) : (
              <table className="tbl">
                <thead><tr>{["Date","Category","Description","Amount","Receipt","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {myItems.map(r=>(
                    <tr key={r._id}>
                      <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                      <td><span className="badge b-gray">{r.category}</span></td>
                      <td style={{ maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.description}</td>
                      <td style={{ fontWeight:700 }}>₹{(r.amount/100).toLocaleString("en-IN")}</td>
                      <td>{r.receiptUrl?<a href={r.receiptUrl} target="_blank" style={{ color:"#2563eb", fontSize:12 }}>View</a>:"—"}</td>
                      <td><span className="badge" style={{ background:STATUS_BG[r.status], color:STATUS_COLOR[r.status] }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── SUBMIT NEW ─────────────────────────────────────────── */}
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
              <div style={{ border:"1.5px dashed #e5e7eb", borderRadius:8, padding:16, textAlign:"center", background:"#f9fafb" }}>
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
            <button type="submit" disabled={submitting} className="btn btn-primary">{submitting?"Submitting…":"Submit Request"}</button>
          </form>
        </div>
      )}

      {/* ── REVIEW MODAL ───────────────────────────────────────── */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#111827" }}>{selected.status==="approved"?"Mark as Paid":"Review Request"}</h3>
              <button onClick={()=>setSel(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#9ca3af" }}>×</button>
            </div>
            <div style={{ background:"#f9fafb", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
              {[
                ["From",        `${selected.submittedBy?.firstName} ${selected.submittedBy?.lastName} (${selected.submittedBy?.role})`],
                ["Amount",      `₹${(selected.amount/100).toLocaleString("en-IN")}`],
                ["Category",    selected.category],
                ["Date",        new Date(selected.date).toLocaleDateString("en-IN")],
                ["Description", selected.description],
              ].map(([l,v])=>(
                <div key={l} className="prof-row" style={{ padding:"8px 0" }}>
                  <div className="prof-row-lbl" style={{ width:100 }}>{l}</div>
                  <div className="prof-row-val">{v}</div>
                </div>
              ))}
              {selected.receiptUrl && <div style={{ marginTop:10 }}><a href={selected.receiptUrl} target="_blank" style={{ fontSize:12, color:"#2563eb", fontWeight:500 }}>View Receipt →</a></div>}
            </div>
            {actError && <div style={{ padding:"10px 14px", background:"#fee2e2", border:"1px solid #fecaca", borderRadius:8, fontSize:13, color:"#991b1b", marginBottom:14 }}>⚠ {actError}</div>}
            {selected.status==="pending" && (
              <div style={{ marginBottom:16 }}>
                <label className="inp-lbl">Note (optional)</label>
                <textarea style={{...inp, resize:"vertical", minHeight:70}} placeholder="Add a note…" value={note} onChange={e=>setNote(e.target.value)}/>
              </div>
            )}
            {selected.status==="approved" && (
              <div style={{ marginBottom:16 }}>
                <label className="inp-lbl">Payment Reference <span style={{color:"#dc2626"}}>*</span></label>
                <input style={inp} placeholder="NEFT/IMPS reference or transaction ID" value={payRef} onChange={e=>setPayRef(e.target.value)}/>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              {selected.status==="pending" && <>
                <button onClick={()=>act("approve")} disabled={acting} className="btn" style={{ flex:1, background:"#059669", color:"#fff", justifyContent:"center" }}>{acting?"…":"✓ Approve"}</button>
                <button onClick={()=>act("reject")}  disabled={acting} className="btn" style={{ flex:1, background:"#dc2626", color:"#fff", justifyContent:"center" }}>{acting?"…":"✗ Reject"}</button>
              </>}
              {selected.status==="approved" && (
                <button onClick={()=>act("paid")} disabled={acting||!payRef.trim()} className="btn" style={{ flex:1, background:"#2563eb", color:"#fff", justifyContent:"center", opacity:payRef.trim()?1:0.5 }}>{acting?"Processing…":"Mark as Paid"}</button>
              )}
              <button onClick={()=>setSel(null)} className="btn btn-outline" style={{ flex:1, justifyContent:"center" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}