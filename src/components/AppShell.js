"use client";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute right-[-4rem] top-28 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
      </div>

      <Navbar />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex w-full flex-col gap-4 md:flex-row md:gap-6">
          <Sidebar />
          <main className="min-w-0 md:basis-4/5 md:flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
