"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setError("");
      try {
        const response = await fetch("/api/dashboard");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error || "Couldn't load your dashboard.");
          return;
        }
        setDashboard(data);
      } catch {
        setError("Couldn't load your dashboard.");
      }
    }
    loadDashboard();
  }, []);

  return (
    <AppShell>
      <Card className="w-full border-blue-100/70">
        <h1 className="text-3xl font-bold text-[color:var(--text)]">Dashboard</h1>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {!dashboard ? (
          <p className="mt-4 text-[color:var(--muted)]">Loading your dashboard...</p>
        ) : (
          <>
            <p className="mt-3 text-[color:var(--muted)]">
              Hey <span className="font-semibold text-[color:var(--text)]">{dashboard.name}</span>
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="GST Filed"    value={String(dashboard.stats?.gstFiled    ?? 0)} />
              <StatCard label="GST Pending"  value={String(dashboard.stats?.gstPending  ?? 0)} />
              <StatCard label="IT Returns"   value={String(dashboard.stats?.itReturns   ?? 0)} />
              <StatCard label="Subscription" value={String(dashboard.stats?.subscription ?? "free")} />
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/90 p-4 shadow-[0_8px_24px_rgba(17,52,133,0.1)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{value}</p>
    </div>
  );
}