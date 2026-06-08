"use client";
import { Project, ProjectStatus, ProjectPriority } from "@/lib/projectTypes";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#166534", bg: "#f0fdf4" },
  on_hold:   { label: "On Hold",   color: "#92400e", bg: "#fffbeb" },
  completed: { label: "Completed", color: "#1e3a6e", bg: "#eff6ff" },
  cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fef2f2" },
};

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; color: string }> = {
  low:    { label: "Low",    color: "#64748b" },
  medium: { label: "Medium", color: "#d97706" },
  high:   { label: "High",   color: "#dc2626" },
  urgent: { label: "Urgent", color: "#7c3aed" },
};

interface Props {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: Props) {
  const status   = STATUS_CONFIG[project.status];
  const priority = PRIORITY_CONFIG[project.priority];

  const daysLeft = () => {
    const end  = new Date(project.endDate);
    const now  = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: "#dc2626" };
    if (diff === 0) return { text: "Due today", color: "#d97706" };
    return { text: `${diff}d left`, color: "#64748b" };
  };

  const dl = daysLeft();

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", border: "1.5px solid #e2e8f0",
        borderRadius: 14, padding: 20, cursor: "pointer",
        transition: "all .2s", fontFamily: "'Segoe UI',sans-serif",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1e3a6e";
        (e.currentTarget as HTMLElement).style.boxShadow  = "0 4px 20px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.transform  = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
        (e.currentTarget as HTMLElement).style.boxShadow  = "none";
        (e.currentTarget as HTMLElement).style.transform  = "none";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.title}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{project.clientName}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: status.color, background: status.bg, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
          {status.label}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
        {project.description}
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#64748b" }}>Progress</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1e3a6e" }}>{project.progress}%</span>
        </div>
        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${project.progress}%`, background: project.progress === 100 ? "#22c55e" : "#1e3a6e", borderRadius: 3, transition: "width .5s" }} />
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Member avatars */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {project.members.slice(0, 4).map((m, i) => (
            <div key={i} title={m.name} style={{
              width: 26, height: 26, borderRadius: "50%",
              background: `hsl(${(m.name.charCodeAt(0) * 37) % 360},55%,55%)`,
              border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600, color: "#fff",
              zIndex: project.members.length - i,
            }}>
              {m.name[0].toUpperCase()}
            </div>
          ))}
          {project.members.length > 4 && (
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#e2e8f0", border: "2px solid #fff", marginLeft: -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#64748b", fontWeight: 600 }}>
              +{project.members.length - 4}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: priority.color }}>
            ● {priority.label}
          </span>
          <span style={{ fontSize: 11, color: dl.color, fontWeight: 500 }}>
            {dl.text}
          </span>
        </div>
      </div>

      {/* Tool tag */}
      {project.tool && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 10, fontWeight: 500, color: "#1e3a6e", background: "#eff6ff", padding: "2px 8px", borderRadius: 20, border: "1px solid #bfdbfe" }}>
            📊 {project.tool}
          </span>
        </div>
      )}
    </div>
  );
}
