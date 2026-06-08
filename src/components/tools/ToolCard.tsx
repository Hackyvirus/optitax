"use client";
import { Tool } from "@/lib/toolTypes";

interface Props {
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
}

export default function ToolCard({ tool, isActive, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative", display: "flex", flexDirection: "column",
        alignItems: "flex-start", gap: 10, padding: 20,
        background: isActive ? `linear-gradient(160deg,#fff 60%,${tool.accent}10)` : "#fff",
        border: `1.5px solid ${isActive ? tool.accent : "#e2e8f0"}`,
        borderRadius: 14, cursor: "pointer", textAlign: "left", width: "100%",
        boxShadow: isActive ? `0 0 0 2px ${tool.accent},0 6px 24px rgba(0,0,0,0.1)` : "none",
        transform: isActive ? "translateY(-2px)" : "none",
        transition: "all 0.2s", fontFamily: "'Segoe UI',sans-serif",
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{tool.icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: tool.color, lineHeight: 1.2 }}>{tool.name}</span>
      <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
        {tool.description}
      </span>
      {tool.versions && (
        <span style={{ fontSize: 10, fontWeight: 600, background: `${tool.accent}15`, color: tool.accent, padding: "2px 8px", borderRadius: 20, border: `1px solid ${tool.accent}30` }}>
          {tool.versions.length} versions
        </span>
      )}
    </button>
  );
}
