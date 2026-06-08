interface Props { steps: string[]; current: number; color: string; }
export default function StepBar({ steps, current, color }: Props) {
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
      {steps.map((label, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex: i < steps.length-1 ? 1 : undefined }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, background: i<current?"#22c55e":i===current?color:"#f1f5f9", color: i<=current?"#fff":"#94a3b8" }}>
              {i < current ? "✓" : i+1}
            </div>
            <span style={{ fontSize:9, color:i===current?color:"#94a3b8", fontWeight:i===current?600:400, whiteSpace:"nowrap" }}>{label}</span>
          </div>
          {i < steps.length-1 && <div style={{ flex:1, height:2, background:i<current?"#22c55e":"#f1f5f9", margin:"0 3px", marginBottom:14 }} />}
        </div>
      ))}
    </div>
  );
}
