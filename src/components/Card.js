"use client";

export default function Card({ children, className = "" }) {
  return (
    <section
      className={`w-full rounded-2xl border border-[color:var(--border)] bg-white/90 p-8 shadow-[0_22px_60px_rgba(16,47,112,0.18)] backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}
