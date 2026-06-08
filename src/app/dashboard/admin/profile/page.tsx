"use client";
import { useEffect, useState, useRef } from "react";
import Card from "@/components/Card";

export default function AdminProfile() {
  const [profile, setProfile]   = useState({ name:"", email:"", phone:"", photo:"", adminLevel:"" });
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ name:"", phone:"" });
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r=>r.json()).then(d => {
      const p = { name:d.name||"", email:d.email||"", phone:d.phone||"", photo:d.photo||"", adminLevel:d.adminLevel||"regular" };
      setProfile(p); setForm({ name:p.name, phone:p.phone });
    }).catch(()=>{});
  }, []);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", "avatar");
    const res  = await fetch("/api/upload", { method:"POST", body:fd });
    const data = await res.json();
    if (data.url) setProfile(p => ({ ...p, photo: data.url }));
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setProfile(p => ({ ...p, name:form.name, phone:form.phone }));
    setEditing(false); setSaving(false);
  };

  return (
    <Card className="w-full border-blue-100/70">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--text)]">Admin Profile</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Your account details</p>
        </div>
        <button onClick={() => setEditing(e=>!e)}
          className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] transition hover:bg-blue-50">
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <div className="relative">
          {profile.photo
            ? <img src={profile.photo} alt="Avatar" className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-100"/>
            : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a6e] to-[#2563eb] text-3xl font-bold text-white">{(profile.name||"A").charAt(0).toUpperCase()}</div>
          }
          <button onClick={()=>fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary)] text-white shadow-md hover:bg-[color:var(--primary-dark)]">
            {uploading ? "…" : "📷"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto}/>
        </div>
        <div>
          <p className="text-lg font-semibold text-[color:var(--text)]">{profile.name||"Admin"}</p>
          <p className="text-sm text-[color:var(--muted)]">{profile.email}</p>
          <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 capitalize">{profile.adminLevel} Admin</span>
        </div>
      </div>

      {!editing ? (
        <div className="mt-6 rounded-xl border border-blue-100 bg-white px-4">
          {[{l:"Full Name",v:profile.name},{l:"Email",v:profile.email},{l:"Phone",v:profile.phone},{l:"Role",v:`${profile.adminLevel} Admin`}].map(({l,v})=>(
            <div key={l} className="flex border-b border-blue-50 py-3 last:border-0">
              <span className="w-36 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{l}</span>
              <span className="text-sm text-[color:var(--text)]">{v||"—"}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Full Name</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              className="w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"/>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Phone</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
              className="w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"/>
          </div>
          <div className="sm:col-span-2">
            <button onClick={save} disabled={saving}
              className="rounded-lg bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--primary-dark)] disabled:opacity-60">
              {saving?"Saving…":"Save Changes"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
