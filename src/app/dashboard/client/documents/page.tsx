"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";

type Doc = { _id:string; name:string; fileType:string; fileSize:string; category:string; createdAt:string };
const CATS = ["All","Registration","Identity","Financial","Customs","Legal"];
const ICON: Record<string,string> = { PDF:"📄", Excel:"📊", Word:"📝", Image:"🖼️" };

export default function ClientDocuments() {
  const [docs, setDocs]         = useState<Doc[]>([]);
  const [filter, setFilter]     = useState("All");
  const [loading, setLoading]   = useState(true);
  const [dragging, setDragging] = useState(false);

  const load = (cat = filter) => {
    const q = cat !== "All" ? `?category=${cat}` : "";
    fetch(`/api/documents${q}`)
      .then(r => r.json())
      .then(d => { setDocs(d.documents || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (cat: string) => { setFilter(cat); load(cat); };

  const del = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch("/api/documents", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id }) });
    setDocs(d => d.filter(x => x._id !== id));
  };

  return (
    <Card className="w-full border-blue-100/70">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--text)]">Documents</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Upload and manage your compliance documents</p>
        </div>
        <label className="cursor-pointer rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--primary-dark)]">
          Upload File
          <input type="file" className="hidden" onChange={e => { if(e.target.files?.[0]) alert("Connect to file upload API (Cloudinary / S3)"); }}/>
        </label>
      </div>

      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);alert("Connect to file upload API");}}
        className={`mt-5 rounded-xl border-2 border-dashed p-8 text-center transition ${dragging?"border-[color:var(--primary)] bg-blue-50":"border-blue-200 bg-[#f8fafc]"}`}>
        <p className="text-2xl">📁</p>
        <p className="mt-2 text-sm font-medium text-[color:var(--text)]">Drag & drop files here</p>
        <p className="mt-1 text-xs text-[color:var(--muted)]">PDF, Excel, Word — up to 20 MB</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {CATS.map(c => (
          <button key={c} onClick={() => handleFilter(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter===c ? "bg-[color:var(--primary)] text-white" : "border border-blue-100 text-[color:var(--muted)] hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[color:var(--muted)]">Loading documents…</p>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-blue-200 py-10 text-center">
            <p className="text-sm text-[color:var(--muted)]">No documents yet. Upload your first file.</p>
          </div>
        ) : docs.map(doc => (
          <div key={doc._id} className="flex items-center gap-4 rounded-xl border border-blue-100 bg-white px-4 py-3 transition hover:shadow-sm">
            <span className="text-2xl">{ICON[doc.fileType] || "📄"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[color:var(--text)]">{doc.name}</p>
              <p className="text-xs text-[color:var(--muted)]">{doc.fileSize} · {new Date(doc.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{doc.category}</span>
            <button onClick={() => del(doc._id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
          </div>
        ))}
      </div>
    </Card>
  );
}