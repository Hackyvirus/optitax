"use client";
import { useEffect, useState } from "react";

const CATEGORIES = ["Travel","Food","Office Supplies","Software","Training","Client Entertainment","Medical","Utilities","Other"];
const STATUS_MAP: Record<string,{label:string;color:string;bg:string}> = {
  pending:          { label:"Pending",          color:"#d97706", bg:"#fef3c7" },
  finance_approved: { label:"Finance Approved", color:"#0369a1", bg:"#e0f2fe" },
  admin_pending:    { label:"Awaiting Admin",   color:"#7c3aed", bg:"#ede9fe" },
  approved:         { label:"Approved",         color:"#059669", bg:"#d1fae5" },
  rejected:         { label:"Rejected",         color:"#dc2626", bg:"#fee2e2" },
  paid:             { label:"Paid",             color:"#0d1f4c", bg:"#dbeafe" },
};

type R = {
  _id:string; amount:number; category:string; description:string; date:string;
  status:string; financeStatus:string; adminStatus:string;
  financeNote:string; adminNote:string; paymentRef:string;
  receiptUrl:string; requiresAdminApproval:boolean;
  submittedBy:{firstName:string;lastName:string;email:string;role:string;department:string}|null;
  financeReviewBy:{firstName:string;lastName:string}|null;
  adminReviewBy:{firstName:string;lastName:string}|null;
  projectId:{title:string}|null;
};

export default function AdminReimbursements() {
  const [tab, setTab]           = useState<"all"|"mine"|"new">("all");
  const [allItems, setAll]      = useState<R[]>([]);
  const [myItems, setMine]      = useState<R[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [selected, setSel]      = useState<R|null>(null);
  const [note, setNote]         = useState("");
  const [payRef, setPayRef]     = useState("");
  const [acting, setActing]     = useState(false);
  const [actError, setActErr]   = useState("");
  const [search, setSearch]     = useState("");
  const [projects, setProjects] = useState<{_id:string;title:string}[]>([]);
  const [form, setForm]         = useState({ amount:"", category:"Travel", description:"", date:"", projectId:"", receiptUrl:"", receiptName:"" });
  const [uploading, setUp]      = useState(false);
  const [submitting, setSub]    = useState(false);
  const [subError, setSubErr]   = useState("");
  const [subSuccess, setSubOk]  = useState("");

  const loadAll = () => {
    setLoading(true);
    const q = filter==="all" ? "" : `?status=${filter}`;
    fetch(`/api/reimbursements${q}`).then(r=>r.json()).then(d=>{ setAll(d.reimbursements||[]); setLoading(false); }).catch(()=>setLoading(false));
  };
  const loadMine = () => {
    fetch("/api/reimbursements?mine=true").then(r=>r.json()).then(d=>setMine(d.reimbursements||[])).catch(()=>{});
  };

  useEffect(() => {
    loadAll(); loadMine();
    fetch("/api/projects").then(r=>r.json()).then(d=>setProjects(d.projects||[])).catch(()=>{});
  }, [filter]);

  const act = async (action: string) => {
    if (!selected) return;
    setActing(true); setActErr("");
    const res  = await fetch("/api/reimbursements",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selected._id,action,note,paymentRef:payRef})});
    const data = await res.json();
    if (res.ok) { setSel(null); setNote(""); setPayRef(""); loadAll(); loadMine(); }
    else setActErr(data.error||"Action failed");
    setActing(false);
  };

  const uploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUp(true);
    const fd = new FormData(); fd.append("file",file);
    const res  = await fetch("/api/reimbursements/upload",{method:"POST",body:fd});
    const data = await res.json();
    if (data.url) setForm(f=>({...f,receiptUrl:data.url,receiptName:file.name}));
    setUp(false);
  };

  const submitMine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSub(true); setSubErr(""); setSubOk("");
    const res  = await fetch("/api/reimbursements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const data = await res.json();
    if (!res.ok) { setSubErr(data.error||"Failed"); setSub(false); return; }
    setSubOk("Request submitted successfully.");
    setForm({amount:"",category:"Travel",description:"",date:"",projectId:"",receiptUrl:"",receiptName:""});
    setSub(false); setTab("mine"); loadMine();
  };

  const inp: React.CSSProperties = { width:"100%",padding:"9px 13px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13.5,outline:"none",fontFamily:"inherit",background:"#fff" };
  const filtered = allItems.filter(r => {
    if (!search) return true;
    return `${r.submittedBy?.firstName} ${r.submittedBy?.lastName} ${r.category} ${r.description} ${r.submittedBy?.department}`.toLowerCase().includes(search.toLowerCase());
  });

  const pendingFinance = allItems.filter(r=>r.financeStatus==="pending").length;
  const pendingAdmin   = allItems.filter(r=>r.status==="admin_pending").length;
  const totalPaid      = allItems.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0);

  return (
    <div>
      <div className="ph">
        <h1>Reimbursements</h1>
        <p>Finance review, management approval, and your own requests</p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[{k:"all",l:"All Requests"},{k:"mine",l:"My Requests"},{k:"new",l:"+ Submit Request"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as typeof tab)} className="btn"
            style={{background:tab===t.k?"#0d1f4c":"#f3f4f6",color:tab===t.k?"#fff":"#374151",position:"relative"}}>
            {t.l}
            {t.k==="all"&&pendingAdmin>0&&<span style={{marginLeft:6,background:"#7c3aed",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11}}>{pendingAdmin} admin</span>}
            {t.k==="all"&&pendingFinance>0&&<span style={{marginLeft:4,background:"#d97706",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11}}>{pendingFinance} finance</span>}
          </button>
        ))}
      </div>

      {tab==="all" && (
        <div>
          <div className="stats-grid stats-4" style={{marginBottom:20}}>
            {[
              {label:"Finance Pending", value:pendingFinance,  note:"Need finance review"},
              {label:"Admin Pending",   value:pendingAdmin,    note:"Need final approval"},
              {label:"Approved",        value:allItems.filter(r=>r.status==="approved").length, note:"Ready to pay"},
              {label:"Total Paid",      value:`Rs.${(totalPaid/100|0).toLocaleString("en-IN")}`, note:"Disbursed"},
            ].map(s=>(
              <div key={s.label} className="stat">
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val" style={{fontSize:22}}>{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:6,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
            {["all","pending","finance_approved","admin_pending","approved","rejected","paid"].map(s=>(
              <button key={s} onClick={()=>setFilter(s)} className="btn"
                style={{padding:"5px 11px",fontSize:11.5,background:filter===s?"#0d1f4c":"#f3f4f6",color:filter===s?"#fff":"#374151"}}>
                {s.replace(/_/g," ")}
              </button>
            ))}
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, dept..."
              style={{marginLeft:"auto",padding:"7px 13px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:13,outline:"none",width:200}}/>
          </div>

          <div className="card" style={{overflow:"hidden"}}>
            {loading ? <p style={{padding:24,fontSize:13,color:"#9ca3af"}}>Loading...</p>
            : filtered.length===0 ? <p style={{padding:24,fontSize:13,color:"#9ca3af"}}>No requests found.</p>
            : (
              <table className="tbl">
                <thead><tr>{["From","Dept","Date","Category","Amount","Status","Finance By","Admin By","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(r=>{
                    const st = STATUS_MAP[r.status]||{label:r.status,color:"#6b7280",bg:"#f3f4f6"};
                    return (
                      <tr key={r._id}>
                        <td>
                          <div style={{fontWeight:600,fontSize:13,color:"#111827"}}>{r.submittedBy?.firstName} {r.submittedBy?.lastName}</div>
                          <div style={{fontSize:11,color:"#9ca3af",textTransform:"capitalize"}}>{r.submittedBy?.role}</div>
                        </td>
                        <td style={{fontSize:12,color:"#6b7280"}}>{r.submittedBy?.department||"—"}</td>
                        <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                        <td><span className="badge b-gray">{r.category}</span></td>
                        <td style={{fontWeight:700,color:"#111827"}}>
                          Rs.{(r.amount/100).toLocaleString("en-IN")}
                          {r.requiresAdminApproval&&<div style={{fontSize:10,color:"#7c3aed",marginTop:1}}>2-stage</div>}
                        </td>
                        <td><span className="badge" style={{background:st.bg,color:st.color}}>{st.label}</span></td>
                        <td style={{fontSize:12,color:"#6b7280"}}>{r.financeReviewBy?`${r.financeReviewBy.firstName}`:"—"}</td>
                        <td style={{fontSize:12,color:"#6b7280"}}>{r.adminReviewBy?`${r.adminReviewBy.firstName}`:r.requiresAdminApproval?"Needed":"—"}</td>
                        <td>
                          {r.status==="pending"&&<button onClick={()=>{setSel(r);setNote("");setPayRef("");setActErr("");}} className="btn" style={{padding:"4px 10px",fontSize:12,background:"#0d1f4c",color:"#fff"}}>Finance Review</button>}
                          {r.status==="admin_pending"&&<button onClick={()=>{setSel(r);setNote("");setPayRef("");setActErr("");}} className="btn" style={{padding:"4px 10px",fontSize:12,background:"#7c3aed",color:"#fff"}}>Admin Review</button>}
                          {r.status==="approved"&&<button onClick={()=>{setSel(r);setNote("");setPayRef("");setActErr("");}} className="btn" style={{padding:"4px 10px",fontSize:12,background:"#059669",color:"#fff"}}>Mark Paid</button>}
                          {(r.status==="rejected"||r.status==="paid")&&<span style={{fontSize:11,color:"#9ca3af"}}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab==="mine" && (
        <div>
          <div className="stats-grid stats-4" style={{marginBottom:20}}>
            {[
              {label:"Total",     value:myItems.length,                                                                              note:"All my requests"},
              {label:"In Review", value:myItems.filter(r=>["pending","finance_approved","admin_pending"].includes(r.status)).length, note:"Awaiting approval"},
              {label:"Approved",  value:myItems.filter(r=>r.status==="approved").length,                                            note:"Ready for payment"},
              {label:"Paid",      value:`Rs.${(myItems.filter(r=>r.status==="paid").reduce((a,r)=>a+r.amount,0)/100|0).toLocaleString("en-IN")}`, note:"Total received"},
            ].map(s=>(
              <div key={s.label} className="stat">
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val" style={{fontSize:22}}>{s.value}</div>
                <div className="stat-note">{s.note}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{overflow:"hidden"}}>
            {myItems.length===0
              ? <div style={{padding:"48px 24px",textAlign:"center"}}><p style={{fontSize:14,color:"#9ca3af",marginBottom:12}}>No requests yet.</p><button onClick={()=>setTab("new")} className="btn btn-primary" style={{fontSize:12}}>Submit a request</button></div>
              : (
                <table className="tbl">
                  <thead><tr>{["Date","Category","Amount","Finance","Admin","Status","Note"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {myItems.map(r=>{
                      const st = STATUS_MAP[r.status]||{label:r.status,color:"#6b7280",bg:"#f3f4f6"};
                      return (
                        <tr key={r._id}>
                          <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                          <td><span className="badge b-gray">{r.category}</span></td>
                          <td style={{fontWeight:700}}>Rs.{(r.amount/100).toLocaleString("en-IN")}{r.requiresAdminApproval&&<span style={{fontSize:10,color:"#7c3aed",marginLeft:4}}>2-stage</span>}</td>
                          <td style={{fontSize:12,color:"#6b7280",textTransform:"capitalize"}}>{r.financeStatus.replace(/_/g," ")}</td>
                          <td style={{fontSize:12,color:"#6b7280"}}>{r.requiresAdminApproval?r.adminStatus.replace(/_/g," "):"—"}</td>
                          <td><span className="badge" style={{background:st.bg,color:st.color}}>{st.label}</span></td>
                          <td style={{fontSize:12,color:"#6b7280",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.financeNote||r.adminNote||"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      )}

      {tab==="new" && (
        <div className="card card-p" style={{maxWidth:640}}>
          <div className="sec-h" style={{marginBottom:20}}>Submit Reimbursement Request</div>
          {subError && <div style={{padding:"10px 14px",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,fontSize:13,color:"#991b1b",marginBottom:14}}>⚠ {subError}</div>}
          {subSuccess && <div style={{padding:"10px 14px",background:"#d1fae5",border:"1px solid #a7f3d0",borderRadius:8,fontSize:13,color:"#065f46",marginBottom:14}}>✓ {subSuccess}</div>}
          <form onSubmit={submitMine}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><label className="inp-lbl">Amount (Rs.) *</label><input type="number" min="1" step="0.01" style={inp} value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/></div>
              <div><label className="inp-lbl">Category *</label>
                <select style={inp} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="inp-lbl">Date *</label><input type="date" style={inp} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required/></div>
              <div><label className="inp-lbl">Project</label>
                <select style={inp} value={form.projectId} onChange={e=>setForm(f=>({...f,projectId:e.target.value}))}>
                  <option value="">None</option>{projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginBottom:14}}><label className="inp-lbl">Description *</label><textarea style={{...inp,resize:"vertical",minHeight:72}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>
            <div style={{marginBottom:16}}>
              <label className="inp-lbl">Receipt</label>
              <div style={{border:"1.5px dashed #e5e7eb",borderRadius:8,padding:14,textAlign:"center",background:"#f9fafb"}}>
                {form.receiptUrl
                  ? <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{fontSize:13,color:"#059669",fontWeight:500}}>✓ {form.receiptName}</span><button type="button" onClick={()=>setForm(f=>({...f,receiptUrl:"",receiptName:""}))} style={{fontSize:11,color:"#dc2626",background:"none",border:"none",cursor:"pointer"}}>Remove</button></div>
                  : <label style={{cursor:"pointer"}}><div style={{fontSize:13,color:"#6b7280"}}>{uploading?"Uploading...":"Click to upload receipt"}</div><input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={uploadReceipt} disabled={uploading}/></label>
                }
              </div>
            </div>
            <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12.5,color:"#92400e"}}>
              Note: Your request will be reviewed by another admin or Finance head — you cannot approve your own requests.
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary">{submitting?"Submitting...":"Submit Request"}</button>
          </form>
        </div>
      )}

      {selected && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:500,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:700,color:"#111827"}}>
                {selected.status==="pending"?"Stage 1 — Finance Review":selected.status==="admin_pending"?"Stage 2 — Management Approval":"Mark as Paid"}
              </h3>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#9ca3af"}}>×</button>
            </div>

            {actError && <div style={{padding:"10px 14px",background:"#fee2e2",border:"1px solid #fecaca",borderRadius:8,fontSize:13,color:"#991b1b",marginBottom:14}}>⚠ {actError}</div>}

            {selected.requiresAdminApproval && (
              <div style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12.5,color:"#5b21b6"}}>
                This request exceeds Rs.5,000 and requires both Finance and Management approval.
                {selected.status==="admin_pending" && " Finance has approved — your final approval is needed."}
              </div>
            )}

            <div style={{background:"#f9fafb",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
              {[
                ["From",        `${selected.submittedBy?.firstName} ${selected.submittedBy?.lastName} (${selected.submittedBy?.role}${selected.submittedBy?.department?` · ${selected.submittedBy.department}`:""})`],
                ["Amount",      `Rs.${(selected.amount/100).toLocaleString("en-IN")}`],
                ["Category",    selected.category],
                ["Date",        new Date(selected.date).toLocaleDateString("en-IN")],
                ["Description", selected.description],
              ].map(([l,v])=>(
                <div key={l} className="prof-row" style={{padding:"7px 0"}}>
                  <div className="prof-row-lbl" style={{width:90}}>{l}</div>
                  <div className="prof-row-val" style={{fontSize:13}}>{v}</div>
                </div>
              ))}
              {selected.receiptUrl && <div style={{marginTop:10}}><a href={selected.receiptUrl} target="_blank" style={{fontSize:12,color:"#2563eb",fontWeight:500}}>View Receipt →</a></div>}
            </div>

            {selected.status!=="approved" && (
              <div style={{marginBottom:14}}>
                <label className="inp-lbl">Note (optional)</label>
                <textarea style={{...inp,resize:"vertical",minHeight:60}} value={note} onChange={e=>setNote(e.target.value)}/>
              </div>
            )}
            {selected.status==="approved" && (
              <div style={{marginBottom:14}}>
                <label className="inp-lbl">Payment Reference *</label>
                <input style={inp} placeholder="NEFT/IMPS ref or transaction ID" value={payRef} onChange={e=>setPayRef(e.target.value)}/>
              </div>
            )}

            <div style={{display:"flex",gap:10}}>
              {selected.status==="pending" && <>
                <button onClick={()=>act("finance_approve")} disabled={acting} className="btn" style={{flex:1,background:"#059669",color:"#fff",justifyContent:"center"}}>{acting?"...":"✓ Finance Approve"}</button>
                <button onClick={()=>act("finance_reject")}  disabled={acting} className="btn" style={{flex:1,background:"#dc2626",color:"#fff",justifyContent:"center"}}>{acting?"...":"✗ Reject"}</button>
              </>}
              {selected.status==="admin_pending" && <>
                <button onClick={()=>act("admin_approve")} disabled={acting} className="btn" style={{flex:1,background:"#7c3aed",color:"#fff",justifyContent:"center"}}>{acting?"...":"✓ Final Approve"}</button>
                <button onClick={()=>act("admin_reject")}  disabled={acting} className="btn" style={{flex:1,background:"#dc2626",color:"#fff",justifyContent:"center"}}>{acting?"...":"✗ Reject"}</button>
              </>}
              {selected.status==="approved" && (
                <button onClick={()=>act("paid")} disabled={acting||!payRef.trim()} className="btn" style={{flex:1,background:"#2563eb",color:"#fff",justifyContent:"center",opacity:payRef.trim()?1:0.5}}>{acting?"Processing...":"Mark as Paid"}</button>
              )}
              <button onClick={()=>setSel(null)} className="btn btn-outline" style={{flex:1,justifyContent:"center"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}