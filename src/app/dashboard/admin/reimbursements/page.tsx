"use client";
import { useEffect, useState } from "react";

const STATUS_COLOR: Record<string,string> = { pending:"#d97706", approved:"#059669", rejected:"#dc2626", paid:"#2563eb" };
const STATUS_BG:    Record<string,string> = { pending:"#fef3c7", approved:"#d1fae5", rejected:"#fee2e2", paid:"#dbeafe" };

type R = {
  _id:string; amount:number; category:string; description:string; date:string;
  status:string; reviewNote:string; paymentRef:string; receiptUrl:string; createdAt:string;
  submittedBy:{firstName:string;lastName:string;email:string;role:string}|null;
  projectId:{title:string}|null;
};

export default function AdminReimbursements() {
  const [items, setItems]     = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const [selected, setSel]    = useState<R|null>(null);
  const [note, setNote]       = useState("");
  const [payRef, setPayRef]   = useState("");
  const [acting, setActing]   = useState(false);
  const [search, setSearch]   = useState("");

  const load = () => {
    setLoading(true);
    const q = filter === "all" ? "" : `?status=${filter}`;
    fetch(`/api/reimbursements${q}`).then(r=>r.json()).then(d=>{ setItems(d.reimbursements||[]); setLoading(false); }).catch(()=>setLoading(false));
  };

  useEffect(()=>{ load(); }, [filter]);

  const act = async (action: string) => {
    if (!selected) return;
    setActing(true);
    const res  = await fetch("/api/reimbursements", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id:selected._id, action, reviewNote:note, paymentRef:payRef }) });
    const data = await res.json();
    if (res.ok) { setSel(null); setNote(""); setPayRef(""); load(); }
    setActing(false);
  };

  const filtered = items.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${r.submittedBy?.firstName} ${r.submittedBy?.lastName} ${r.submittedBy?.email} ${r.category} ${r.description}`.toLowerCase().includes(s);
  });

  const totalPending  = items.filter(r=>r.status==="pending").length;
  const totalApproved = items.filter(r=>r.status==="approved").length;
  const totalPaid     = items.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0);
  const totalPending$ = items.filter(r=>r.status==="pending").reduce((a,r)=>a+r.amount,0);

  const inp: React.CSSProperties = { width:"100%", padding:"8px 12px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit" };

  return (
    <div>
      <div className="ph">
        <h1>Reimbursements</h1>
        <p>Review and process all reimbursement requests</p>
      </div>

      <div className="stats-grid stats-4" style={{ marginBottom:20 }}>
        {[
          { label:"Pending Review",   value:totalPending,  note:"Need action",       color:"#d97706" },
          { label:"Pending Amount",   value:`₹${(totalPending$/100).toLocaleString("en-IN")}`, note:"To be reviewed" },
          { label:"Approved",         value:totalApproved, note:"Awaiting payment" },
          { label:"Total Reimbursed", value:`₹${(totalPaid/100).toLocaleString("en-IN")}`, note:"Paid out" },
        ].map(s=>(
          <div key={s.label} className="stat">
            <div className="stat-lbl">{s.label}</div>
            <div className="stat-val" style={{ fontSize:22, color:s.color||"#111827" }}>{s.value}</div>
            <div className="stat-note">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
        {["all","pending","approved","rejected","paid"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            className="btn" style={{ padding:"6px 14px", fontSize:12, background:filter===s?"#0d1f4c":"#f3f4f6", color:filter===s?"#fff":"#374151", textTransform:"capitalize" }}>
            {s}
          </button>
        ))}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, category…"
          style={{ marginLeft:"auto", padding:"7px 13px", border:"1.5px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", width:240 }}/>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {loading ? <p style={{ padding:24, fontSize:13, color:"#9ca3af" }}>Loading…</p>
        : filtered.length===0 ? <p style={{ padding:24, fontSize:13, color:"#9ca3af" }}>No requests found.</p>
        : (
          <table className="tbl">
            <thead><tr>{["Submitted By","Role","Date","Category","Description","Amount","Project","Receipt","Status","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
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
                  <td style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={r.description}>{r.description}</td>
                  <td style={{ fontWeight:700, color:"#111827" }}>₹{(r.amount/100).toLocaleString("en-IN")}</td>
                  <td>{r.projectId?.title||"—"}</td>
                  <td>{r.receiptUrl?<a href={r.receiptUrl} target="_blank" style={{ color:"#2563eb", fontSize:12, fontWeight:500 }}>View</a>:"—"}</td>
                  <td><span className="badge" style={{ background:STATUS_BG[r.status], color:STATUS_COLOR[r.status] }}>{r.status}</span></td>
                  <td>
                    {r.status==="pending" && (
                      <button onClick={()=>{ setSel(r); setNote(""); setPayRef(""); }} className="btn" style={{ padding:"4px 12px", fontSize:12, background:"#0d1f4c", color:"#fff" }}>Review</button>
                    )}
                    {r.status==="approved" && (
                      <button onClick={()=>{ setSel(r); setNote(""); setPayRef(""); }} className="btn" style={{ padding:"4px 12px", fontSize:12, background:"#059669", color:"#fff" }}>Mark Paid</button>
                    )}
                    {(r.status==="rejected"||r.status==="paid") && (
                      <span style={{ fontSize:11, color:"#9ca3af" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:24 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#111827" }}>{selected.status==="approved"?"Mark as Paid":"Review Request"}</h3>
              <button onClick={()=>setSel(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#9ca3af" }}>×</button>
            </div>

            <div style={{ background:"#f9fafb", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
              {[
                ["From",     `${selected.submittedBy?.firstName} ${selected.submittedBy?.lastName} (${selected.submittedBy?.role})`],
                ["Amount",   `₹${(selected.amount/100).toLocaleString("en-IN")}`],
                ["Category", selected.category],
                ["Date",     new Date(selected.date).toLocaleDateString("en-IN")],
                ["Description", selected.description],
              ].map(([l,v])=>(
                <div key={l} className="prof-row" style={{ padding:"8px 0" }}>
                  <div className="prof-row-lbl" style={{ width:100 }}>{l}</div>
                  <div className="prof-row-val">{v}</div>
                </div>
              ))}
              {selected.receiptUrl && (
                <div style={{ marginTop:10 }}>
                  <a href={selected.receiptUrl} target="_blank" style={{ fontSize:12, color:"#2563eb", fontWeight:500 }}>View Receipt →</a>
                </div>
              )}
            </div>

            {selected.status === "pending" && (
              <div style={{ marginBottom:16 }}>
                <label className="inp-lbl">Note (optional)</label>
                <textarea style={{ ...inp, resize:"vertical", minHeight:70 }} placeholder="Add a note to the requester…" value={note} onChange={e=>setNote(e.target.value)}/>
              </div>
            )}

            {selected.status === "approved" && (
              <div style={{ marginBottom:16 }}>
                <label className="inp-lbl">Payment Reference <span style={{color:"#dc2626"}}>*</span></label>
                <input style={inp} placeholder="NEFT/IMPS reference or transaction ID" value={payRef} onChange={e=>setPayRef(e.target.value)}/>
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              {selected.status==="pending" && (
                <>
                  <button onClick={()=>act("approve")} disabled={acting} className="btn" style={{ flex:1, background:"#059669", color:"#fff", justifyContent:"center" }}>
                    {acting?"…":"✓ Approve"}
                  </button>
                  <button onClick={()=>act("reject")} disabled={acting} className="btn" style={{ flex:1, background:"#dc2626", color:"#fff", justifyContent:"center" }}>
                    {acting?"…":"✗ Reject"}
                  </button>
                </>
              )}
              {selected.status==="approved" && (
                <button onClick={()=>act("paid")} disabled={acting||!payRef.trim()} className="btn" style={{ flex:1, background:"#2563eb", color:"#fff", justifyContent:"center", opacity:payRef.trim()?1:0.5 }}>
                  {acting?"Processing…":"Mark as Paid"}
                </button>
              )}
              <button onClick={()=>setSel(null)} className="btn btn-outline" style={{ flex:1, justifyContent:"center" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}