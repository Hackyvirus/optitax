"use client";
import { useEffect, useState, useRef } from "react";

const card: React.CSSProperties = { background:"#fff", borderRadius:12, padding:"24px", border:"1px solid #e8ecf0" };
const inp:  React.CSSProperties = { width:"100%", padding:"9px 12px", border:"1px solid #e8ecf0", borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

export default function EmployeeProfile() {
  const [profile, setProfile]     = useState({ name:"", email:"", phone:"", photo:"", department:"", designation:"", specializations:[] as string[] });
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ name:"", phone:"" });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r=>r.json()).then(d => {
      const p = { name:d.name||"", email:d.email||"", phone:d.phone||"", photo:d.photo||"", department:d.department||"", designation:d.designation||"", specializations:d.specializations||[] };
      setProfile(p); setForm({ name:p.name, phone:p.phone });
    }).catch(()=>{});
  }, []);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file",file); fd.append("purpose","avatar");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if (data.url) setProfile(p=>({...p,photo:data.url}));
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    setProfile(p=>({...p,name:form.name,phone:form.phone}));
    setEditing(false); setSaving(false);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 4px" }}>My Profile</h1>
        <p style={{ fontSize:14, color:"#64748b", margin:0 }}>Your account details</p>
      </div>

      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ position:"relative" }}>
              {profile.photo
                ? <img src={profile.photo} alt="Avatar" style={{ width:72,height:72,borderRadius:"50%",objectFit:"cover",border:"2px solid #e8ecf0" }}/>
                : <div style={{ width:72,height:72,borderRadius:"50%",background:"#0f1f4a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:"#fff" }}>{(profile.name||"E").charAt(0).toUpperCase()}</div>
              }
              <button onClick={()=>fileRef.current?.click()} disabled={uploading}
                style={{ position:"absolute",bottom:-2,right:-2,width:24,height:24,borderRadius:"50%",background:"#0f1f4a",border:"2px solid #fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff" }}>
                {uploading?"…":"✎"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={uploadPhoto}/>
            </div>
            <div>
              <p style={{ fontSize:17,fontWeight:700,color:"#0f172a",margin:"0 0 3px" }}>{profile.name||"Employee"}</p>
              <p style={{ fontSize:13,color:"#64748b",margin:"0 0 4px" }}>{profile.email}</p>
              <p style={{ fontSize:12,color:"#94a3b8",margin:0 }}>{profile.designation}{profile.department?` · ${profile.department}`:""}</p>
            </div>
          </div>
          <button onClick={()=>setEditing(e=>!e)}
            style={{ padding:"8px 16px",borderRadius:8,border:"1px solid #e8ecf0",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#475569" }}>
            {editing?"Cancel":"Edit"}
          </button>
        </div>

        {!editing ? (
          <div>
            {[{l:"Full Name",v:profile.name},{l:"Email",v:profile.email},{l:"Phone",v:profile.phone||"—"},{l:"Department",v:profile.department||"—"},{l:"Designation",v:profile.designation||"—"}].map(({l,v})=>(
              <div key={l} style={{ display:"flex",padding:"12px 0",borderBottom:"1px solid #f1f5f9" }}>
                <span style={{ width:140,flexShrink:0,fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em" }}>{l}</span>
                <span style={{ fontSize:13,color:"#0f172a" }}>{v}</span>
              </div>
            ))}
            {profile.specializations.length>0&&(
              <div style={{ paddingTop:16 }}>
                <p style={{ fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 10px" }}>Specializations</p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                  {profile.specializations.map(s=><span key={s} style={{ padding:"4px 12px",borderRadius:20,background:"#f1f5f9",fontSize:12,fontWeight:500,color:"#475569" }}>{s}</span>)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:6 }}>Full Name</label>
              <input style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:"#475569",display:"block",marginBottom:6 }}>Phone</label>
              <input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <button onClick={save} disabled={saving}
                style={{ padding:"10px 24px",background:"#0f1f4a",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",opacity:saving?0.6:1 }}>
                {saving?"Saving…":"Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}