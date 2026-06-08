"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";

type Filing = { _id:string; type:string; period:string; status:string; dueDate:string };

const STYLE: Record<string,string> = {
  Filed:  "bg-green-100 text-green-700",
  Pending:"bg-yellow-100 text-yellow-700",
  Due:    "bg-red-100 text-red-600",
  "N/A":  "bg-gray-100 text-gray-400",
};

export default function ClientAnalysis() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [stats, setStats]     = useState({ gstFiled:0, gstPending:0, itrStatus:"N/A", compliance:"—" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/filings")
      .then(r => r.json())
      .then(d => {
        const fs: Filing[] = d.filings || [];
        setFilings(fs);
        setStats({
          gstFiled:    fs.filter(f => f.status==="Filed").length,
          gstPending:  fs.filter(f => f.status==="Pending" || f.status==="Due").length,
          itrStatus:   fs.find(f => f.type==="ITR")?.status || "N/A",
          compliance:  fs.length ? `${Math.round((fs.filter(f=>f.status==="Filed").length/fs.length)*100)}%` : "N/A",
        });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const upcoming = filings.filter(f => f.status === "Due" || f.status === "Pending").slice(0, 5);

  return (
    <Card className="w-full border-blue-100/70">
      <h1 className="text-2xl font-semibold text-[color:var(--text)]">Analysis</h1>
      <p className="mt-1 text-sm text-[color:var(--muted)]">Your compliance filing history and upcoming deadlines</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label:"GST Filed",   value:String(stats.gstFiled),   note:"This year" },
          { label:"GST Pending", value:String(stats.gstPending), note:"This cycle" },
          { label:"ITR Status",  value:stats.itrStatus,          note:"Current FY" },
          { label:"Compliance",  value:stats.compliance,         note:"Score" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/90 px-4 py-4 shadow-[0_8px_24px_rgba(17,52,133,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{c.value}</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">{c.note}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-base font-semibold text-[color:var(--text)]">Filing History</h2>
      {loading ? (
        <p className="mt-3 text-sm text-[color:var(--muted)]">Loading filings…</p>
      ) : filings.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-blue-200 py-10 text-center">
          <p className="text-sm text-[color:var(--muted)]">No filing records yet.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-blue-100">
          <table className="w-full text-sm">
            <thead className="bg-blue-50/60">
              <tr>{["Period","Type","Status","Due Date"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filings.map(f => (
                <tr key={f._id} className="border-t border-blue-50">
                  <td className="px-4 py-3 font-medium text-[color:var(--text)]">{f.period}</td>
                  <td className="px-4 py-3 text-[color:var(--muted)]">{f.type}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLE[f.status]||""}`}>{f.status}</span></td>
                  <td className="px-4 py-3 text-[color:var(--muted)]">{f.dueDate||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="mt-8 text-base font-semibold text-[color:var(--text)]">Upcoming Deadlines</h2>
          <div className="mt-3 space-y-3">
            {upcoming.map(f => (
              <div key={f._id} className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text)]">{f.type} — {f.period}</p>
                  <p className="text-xs text-[color:var(--muted)]">Due: {f.dueDate||"TBD"}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STYLE[f.status]||""}`}>{f.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}