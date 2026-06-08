"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";

type UsedBy = { userId: string; email: string; name: string; usedAt: string };
type InviteCode = {
  _id: string; code: string; role: string; label: string;
  maxUses: number; usedCount: number; isActive: boolean;
  expiresAt: string | null; createdAt: string;
  usedBy: UsedBy[];
};

const INIT = { role:"employee", label:"", maxUses:"1", customCode:"", expiresAt:"" };

export default function InviteCodesPage() {
  const [codes, setCodes]       = useState<InviteCode[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied]     = useState("");
  const [form, setForm]         = useState(INIT);
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/invite-codes");
    const data = await res.json();
    setCodes(data.codes || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    const res  = await fetch("/api/admin/invite-codes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxUses: Number(form.maxUses) || 1 }),
    });
    const data = await res.json();
    if (res.ok) { setShowForm(false); setForm(INIT); load(); }
    else alert(data.error || "Failed to create code");
    setCreating(false);
  };

  const toggle = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/invite-codes", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this invite code?")) return;
    await fetch("/api/admin/invite-codes", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const INP = "mt-1 w-full rounded-lg border border-[color:var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/15";

  return (
    <Card className="w-full border-blue-100/70">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--text)]">Invite Codes</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Generate codes to allow employee and admin registration
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[color:var(--primary-dark)]">
          {showForm ? "Cancel" : "+ New Code"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-5">
          <h2 className="mb-4 text-base font-semibold text-[color:var(--text)]">Create New Invite Code</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Role *</label>
              <select className={INP} value={form.role} onChange={e => setF("role", e.target.value)}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Label (optional)</label>
              <input className={INP} placeholder="e.g. For GST team" value={form.label} onChange={e => setF("label", e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Custom Code (blank = auto)</label>
              <input className={INP} placeholder="e.g. GSTTEAM2025" value={form.customCode}
                onChange={e => setF("customCode", e.target.value.toUpperCase())}/>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Max Uses (-1 = unlimited)</label>
              <input type="number" className={INP} value={form.maxUses} onChange={e => setF("maxUses", e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Expires At (optional)</label>
              <input type="date" className={INP} value={form.expiresAt} onChange={e => setF("expiresAt", e.target.value)}/>
            </div>
          </div>
          <button onClick={create} disabled={creating}
            className="mt-4 rounded-lg bg-[color:var(--primary)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--primary-dark)] disabled:opacity-60">
            {creating ? "Creating…" : "Create Code"}
          </button>
        </div>
      )}

      {/* Codes table */}
      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-[color:var(--muted)]">Loading…</p>
        ) : codes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 py-12 text-center">
            <p className="text-2xl mb-2">🔑</p>
            <p className="text-sm font-semibold text-[color:var(--text)]">No invite codes yet</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">Create a code to allow employee or admin registration</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100">
                  {["Code","Role","Label","Uses","Used By","Status","Expires","Actions"].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c._id} className="border-b border-blue-50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-blue-50 px-2 py-1 font-mono text-sm font-bold text-blue-800">{c.code}</code>
                        <button onClick={() => copy(c.code)}
                          className="text-xs text-[color:var(--muted)] hover:text-[color:var(--primary)] transition">
                          {copied === c.code ? "✓ Copied!" : "Copy"}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--muted)]">{c.label || "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="text-[color:var(--text)]">{c.usedCount}</span>
                      <span className="text-[color:var(--muted)]"> / {c.maxUses === -1 ? "∞" : c.maxUses}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {c.usedBy && c.usedBy.length > 0 ? (
                        <div className="space-y-1">
                          {c.usedBy.map((u, i) => (
                            <div key={i} className="text-xs text-[color:var(--muted)]">
                              <span className="font-medium text-[color:var(--text)]">{u.name || u.email}</span>
                              <span className="ml-1 text-[10px]">({new Date(u.usedAt).toLocaleDateString("en-IN")})</span>
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-xs text-[color:var(--muted)]">—</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={() => toggle(c._id, !c.isActive)}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition ${c.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-[color:var(--muted)]">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                    </td>
                    <td className="py-3">
                      <button onClick={() => del(c._id)}
                        className="text-xs text-red-500 hover:text-red-700 transition">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How to use */}
      <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/30 p-5">
        <h2 className="text-sm font-semibold text-[color:var(--text)]">How invite codes work</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { step:"1", title:"Create a code", desc:"Click New Code, choose Employee or Admin role, set usage limit and expiry." },
            { step:"2", title:"Share the code", desc:"Copy the code and send it to the person who needs to register." },
            { step:"3", title:"They register", desc:"They go to /employee/register or /admin/register and enter the code." },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-xs font-bold text-white">{s.step}</div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--text)]">{s.title}</p>
                <p className="mt-0.5 text-xs text-[color:var(--muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}