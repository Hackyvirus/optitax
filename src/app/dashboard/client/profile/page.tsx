"use client";
import { useEffect, useState, useRef } from "react";
import Card from "@/components/Card";

export default function ClientProfile() {
  const [profile, setProfile] = useState({ name:"", email:"", phone:"", businessName:"", gstin:"", pan:"", address:"", photo:"" });
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ ...profile });
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r=>r.json()).then(d => {
      const p = { name:d.name||"", email:d.email||"", phone:d.phone||"", businessName:d.businessName||"", gstin:d.gstin||"", pan:d.pan||"", address:d.address||"", photo:d.photo||"" };
      setProfile(p); setForm(p);
    }).catch(()=>{});
  }, []);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { alert("Image must be under 5MB"); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("purpose", "avatar");
    const res  = await fetch("/api/upload", { method:"POST", body:fd });
    const data = await res.json();
    if (data.url) {
      setProfile(p => ({ ...p, photo: data.url }));
      setForm(f    => ({ ...f, photo: data.url }));
    }
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setProfile(form); setEditing(false); setSaving(false);
  };

  const initials = (profile.name || profile.email || "C").charAt(0).toUpperCase();

  const Row = ({ label, value }: { label:string; value:string }) => (
    <div className="flex border-b border-blue-50 py-3 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{label}</span>
      <span className="text-sm text-[color:var(--text)]">{value||"—"}</span>
    </div>
  );

  return (
    <Card className="w-full border-blue-100/70">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--text)]">My Profile</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Your account and business details</p>
        </div>
        <button onClick={()=>setEditing(e=>!e)}
          className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-[color:var(--primary)] transition hover:bg-blue-50">
          {editing?"Cancel":"Edit Profile"}
        </button>
      </div>

      {/* Avatar */}
      <div className="mt-6 flex items-center gap-5">
        <div className="relative">
          {profile.photo ? (
            <img src={profile.photo} alt="Profile" className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-100"/>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a6e] to-[#2563eb] text-3xl font-bold text-white">
              {initials}
            </div>
          )}
          <button onClick={()=>fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary)] text-white shadow-md transition hover:bg-[color:var(--primary-dark)]"
            title="Change photo">
            {uploading ? "…" : "📷"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto}/>
        </div>
        <div>
          <p className="text-lg font-semibold text-[color:var(--text)]">{profile.name||"Client"}</p>
          <p className="text-sm text-[color:var(--muted)]">{profile.email}</p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">{uploading?"Uploading photo…":"Click 📷 to change photo"}</p>
        </div>
      </div>

      {!editing ? (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Personal</h2>
            <div className="rounded-xl border border-blue-100 bg-white px-4">
              <Row label="Full Name" value={profile.name}/>
              <Row label="Email"     value={profile.email}/>
              <Row label="Phone"     value={profile.phone}/>
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Business</h2>
            <div className="rounded-xl border border-blue-100 bg-white px-4">
              <Row label="Business Name" value={profile.businessName}/>
              <Row label="GSTIN"         value={profile.gstin}/>
              <Row label="PAN"           value={profile.pan}/>
              <Row label="Address"       value={profile.address}/>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[{k:"name",l:"Full Name"},{k:"phone",l:"Phone"},{k:"businessName",l:"Business Name"},{k:"gstin",l:"GSTIN"},{k:"pan",l:"PAN"},{k:"address",l:"Address"}].map(({k,l})=>(
            <div key={k}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{l}</label>
              <input value={(form as Record<string,string>)[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                className="w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/15"/>
            </div>
          ))}
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
