"use client";

import Navbar from "./Navbar";

export default function PageShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5rem] top-24 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute right-[-5rem] bottom-16 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-7xl items-center justify-center px-4 py-10 md:px-6 md:py-14">
        {children}
      </main>
    </div>
  );
}
