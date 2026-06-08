"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";

type FileEntry = { _id:string; name:string; fileUrl:string; fileType:string; fileSize:string; category:string };
type Comment   = { _id:string; authorName:string; authorRole:string; content:string; createdAt:string };
type Project   = {
  _id:string; title:string; type:string; status:string; priority:string;
  progress:number; endDate:string; description:string;
  assignedTo:{firstName:string;lastName:string}[];
  files:FileEntry[]; comments:Comment[];
};

const STATUS: Record<string,string> = {
  "Pending":"bg-yellow-100 text-yellow-700", "In Progress":"bg-blue-100 text-blue-700",
  "Completed":"bg-green-100 text-green-700", "On Hold":"bg-gray-100 text-gray-500",
};
const FILE_ICON: Record<string,string> = { PDF:"📄", Excel:"📊", Word:"📝", Image:"🖼️", File:"📎" };

export default function ClientProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project|null>(null);
  const [loading, setLoading]   = useState(true);
  const [comment, setComment]   = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects||[]);
    if (selected) {
      const updated = (data.projects||[]).find((p:Project)=>p._id===selected._id);
      if (updated) setSelected(updated);
    }
    setLoading(false);
  };

  useEffect(()=>{ load(); },[]);

  const sendComment = async () => {
    if (!comment.trim()||!selected) return;
    await fetch("/api/projects",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:selected._id,comment:comment.trim()}) });
    setComment(""); load();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file||!selected) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file",file);
    fd.append("projectId",selected._id);
    fd.append("category","requirement");
    await fetch("/api/projects/files",{method:"POST",body:fd});
    setUploading(false); load();
  };

  return (
    <Card className="w-full border-blue-100/70">
      <h1 className="text-2xl font-semibold text-[color:var(--text)]">My Projects</h1>
      <p className="mt-1 text-sm text-[color:var(--muted)]">View and collaborate on your compliance projects</p>

      <div className="mt-5 flex gap-4" style={{minHeight:500}}>
        {/* List */}
        <div className="w-72 flex-shrink-0 space-y-3 overflow-y-auto">
          {loading && <p className="text-sm text-[color:var(--muted)]">Loading…</p>}
          {!loading&&projects.length===0&&<div className="rounded-xl border border-dashed border-blue-200 py-10 text-center"><p className="text-sm text-[color:var(--muted)]">No projects yet.</p></div>}
          {projects.map(p=>(
            <div key={p._id} onClick={()=>setSelected(p)}
              className={`cursor-pointer rounded-xl border px-4 py-3 transition hover:shadow-sm ${selected?._id===p._id?"border-[color:var(--primary)] bg-[#eff6ff]":"border-blue-100 bg-white"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[color:var(--text)] leading-tight">{p.title}</p>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS[p.status]||""}`}>{p.status}</span>
              </div>
              <p className="mt-1 text-xs text-[color:var(--muted)]">{p.type}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-blue-50">
                <div className="h-full rounded-full bg-[color:var(--primary)]" style={{width:`${p.progress}%`}}/>
              </div>
              <p className="mt-1 text-right text-xs font-semibold text-[color:var(--primary)]">{p.progress}%</p>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-blue-100">
          {!selected?(
            <div className="flex h-full items-center justify-center"><div className="text-center"><p className="text-3xl mb-2">📋</p><p className="text-sm text-[color:var(--muted)]">Select a project to view details</p></div></div>
          ):(
            <div className="p-5">
              <h2 className="text-lg font-semibold text-[color:var(--text)]">{selected.title}</h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{selected.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Type</p><p className="mt-1 text-sm text-[color:var(--text)]">{selected.type}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Due Date</p><p className="mt-1 text-sm text-[color:var(--text)]">{selected.endDate||"—"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Team</p><p className="mt-1 text-sm text-[color:var(--text)]">{selected.assignedTo?.map(u=>u.firstName).join(", ")||"Unassigned"}</p></div>
              </div>

              {/* Files */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[color:var(--text)]">Files ({selected.files?.length||0})</h3>
                  <label className={`cursor-pointer rounded-lg border border-[color:var(--primary)] px-3 py-1 text-xs font-semibold text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:text-white transition ${uploading?"opacity-60":""}`}>
                    {uploading?"Uploading…":"Upload Document"}
                    <input type="file" className="hidden" disabled={uploading} onChange={uploadFile}/>
                  </label>
                </div>
                <div className="space-y-2">
                  {(selected.files||[]).map(f=>(
                    <div key={f._id} className="flex items-center gap-3 rounded-lg border border-blue-50 bg-white px-3 py-2">
                      <span className="text-lg">{FILE_ICON[f.fileType]||"📎"}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[color:var(--text)]">{f.name}</p><p className="text-[10px] text-[color:var(--muted)]">{f.fileSize} · {f.category}</p></div>
                      <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-[color:var(--primary)] hover:underline">Download</a>
                    </div>
                  ))}
                  {(!selected.files||selected.files.length===0)&&<p className="text-xs text-[color:var(--muted)]">No files yet. Upload documents to share with your team.</p>}
                </div>
              </div>

              {/* Comments */}
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold text-[color:var(--text)]">Discussion ({selected.comments?.length||0})</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {(selected.comments||[]).map(c=>(
                    <div key={c._id} className="rounded-lg border border-blue-50 bg-white px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[color:var(--text)]">{c.authorName}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${c.authorRole==="client"?"bg-green-100 text-green-700":"bg-blue-100 text-blue-700"}`}>{c.authorRole}</span>
                        <span className="ml-auto text-[10px] text-[color:var(--muted)]">{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <p className="text-xs text-[color:var(--text)]">{c.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendComment()}
                    placeholder="Ask a question or leave an update…"
                    className="flex-1 rounded-lg border border-[color:var(--border)] bg-[#f8fafc] px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"/>
                  <button onClick={sendComment} className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-xs font-semibold text-white">Post</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
