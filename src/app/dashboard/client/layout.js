import Sidebar from "@/components/Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f0f2f8" }}>
      <Sidebar />
      <main style={{ flex:1, padding:"28px 32px", minWidth:0 }}>
        {children}
      </main>
    </div>
  );
}