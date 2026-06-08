"use client";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/30 bg-gradient-to-r from-[#102a72] via-[#173f9f] to-[#1e4dbb] text-white shadow-[0_14px_40px_rgba(9,26,74,0.38)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">OptiTax</p>
          <p className="text-xs text-blue-100/90">Built for everyday tax work</p>
        </div>
        <div className="hidden rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 md:block">
          Secure Team Panel
        </div>
      </div>
    </header>
  );
}
