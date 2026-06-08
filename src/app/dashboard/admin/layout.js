import Sidebar from "@/components/Sidebar";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main style={{ flex:1, padding:"28px 32px", minWidth:0 }}>
        {children}
      </main>
    </div>
  );
}