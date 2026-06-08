"use client";
import { useState } from "react";
import { Tool } from "@/lib/toolTypes";
import ToolCard from "@/components/tools/ToolCard";
import ToolRunnerPanel from "@/components/tools/ToolRunnerPanel";

// Admin sees ALL tools + management controls
const TOOLS: Tool[] = [
  {
    id: "brand-rate", name: "Brand Rate / DBK", icon: "📊", accent: "#1e3a6e", color: "#1e3a6e",
    description: "Duty Drawback automation. Select version, upload files, generate all DBK statements.",
    config: [
      { key: "month",                label: "Processing Month",       type: "text", placeholder: "e.g. June 2025" },
      { key: "brand_rate",           label: "Brand Rate No.",         type: "text", placeholder: "e.g. 43" },
      { key: "Aplication_no",        label: "Application No.",        type: "text", placeholder: "e.g. 51 - MAY 2025" },
      { key: "company",              label: "Company Name",           type: "text", placeholder: "e.g. Autoliv India Pvt Limited" },
      { key: "office_address",       label: "Office Address",         type: "text", placeholder: "Plot No, Area, City, PIN" },
      { key: "plant_code",           label: "Plant Code",             type: "text", placeholder: "e.g. INBD-ICD" },
      { key: "commencement_date",    label: "Commencement Date",      type: "text", placeholder: "e.g. 01-04-2023" },
      { key: "product_description",  label: "Product Description",    type: "text", placeholder: "e.g. Safety Air Bags, Seat Belts..." },
      { key: "place_left",           label: "Place (Left Signature)", type: "text", placeholder: "e.g. Pune" },
      { key: "place_right",          label: "Place (Right Signature)",type: "text", placeholder: "e.g. Bengaluru" },
      { key: "CA_place",             label: "CA Place",               type: "text", placeholder: "e.g. Pune" },
      { key: "Application_Place",    label: "Application Place",      type: "text", placeholder: "e.g. Mumbai" },
      { key: "Engineer_Name",        label: "Engineer Name",          type: "text", placeholder: "e.g. Avinash Pawar" },
      { key: "Designation",          label: "Engineer Designation",   type: "text", placeholder: "e.g. Chartered Engineer" },
      { key: "Designation_Address",  label: "Engineer Address",       type: "text", placeholder: "Office address of engineer" },
      { key: "Branch",               label: "Engineer Branch/Reg.",   type: "text", placeholder: "e.g. The Institution of Engineers..." },
      { key: "NameAdd",              label: "Membership No. & Date",  type: "text", placeholder: "e.g. AM-093032-9 dated 30.08.2005" },
    ],
    versions: [
      {
        id: "v1", label: "Version 1", scriptKey: "brand-rate-v1",
        description: "Uses BOE Entry Utilization (date range X to Y)",
        inputs: [
          { key: "sb",  label: "Shipping Bill",               accept: ".xlsx,.xls", required: true },
          { key: "boe", label: "BOE Entry Utilization (X–Y)", accept: ".xlsx,.xls", required: true },
          { key: "bom", label: "BOM Working (sheet: main)",   accept: ".xlsx,.xls", required: true },
        ],
      },
      {
        id: "v2", label: "Version 2", scriptKey: "brand-rate-v2",
        description: "Uses BOE Master Sheet — consolidated single BOE file",
        inputs: [
          { key: "sb",         label: "Shipping Bill",             accept: ".xlsx,.xls", required: true },
          { key: "boe_master", label: "BOE Master Sheet",          accept: ".xlsx,.xls", required: true },
          { key: "bom",        label: "BOM Working (sheet: main)", accept: ".xlsx,.xls", required: true },
        ],
      },
    ],
  },
  {
    id: "gst-filing", name: "GST Filing", icon: "🧾", accent: "#059669", color: "#064e3b",
    description: "Automated GST return preparation — GSTR-1, GSTR-3B reconciliation and filing.",
    config: [
      { key: "period", label: "Filing Period", type: "text", placeholder: "e.g. Jan 2025" },
      { key: "gstin",  label: "GSTIN",         type: "text", placeholder: "22AAAAA0000A1Z5" },
    ],
    inputs: [
      { key: "sales",    label: "Sales Register",    accept: ".xlsx,.xls,.csv", required: true },
      { key: "purchase", label: "Purchase Register", accept: ".xlsx,.xls,.csv", required: true },
    ],
  },
  {
    id: "itr-filing", name: "ITR Filing", icon: "📁", accent: "#7c3aed", color: "#4c1d95",
    description: "Income Tax Return computation and form generation with automated schedule filling.",
    config: [
      { key: "ay",  label: "Assessment Year", type: "text", placeholder: "e.g. 2024-25" },
      { key: "pan", label: "PAN Number",      type: "text", placeholder: "ABCDE1234F" },
    ],
    inputs: [
      { key: "form16", label: "Form 16 / TDS Certificate", accept: ".pdf,.xlsx", required: true },
      { key: "bank",   label: "Bank Statements",           accept: ".pdf,.xlsx,.csv", required: false },
    ],
  },
  {
    id: "document-upload", name: "Document Upload", icon: "📤", accent: "#0891b2", color: "#164e63",
    description: "Bulk document ingestion, OCR extraction and structured data parsing.",
    config: [
      { key: "client",  label: "Client Name",   type: "text", placeholder: "Client / Company name" },
      { key: "doctype", label: "Document Type", type: "text", placeholder: "e.g. Invoices, Certificates" },
    ],
    inputs: [
      { key: "docs", label: "Documents (PDF / Excel / Images)", accept: ".pdf,.xlsx,.jpg,.png", required: true },
    ],
  },
];

type ToolStatus = "active" | "inactive";
const DEFAULT_STATUS: Record<string, ToolStatus> = {
  "brand-rate": "active",
  "gst-filing": "active",
  "itr-filing": "active",
  "document-upload": "active",
};

export default function AdminToolsPage() {
  const [activeTool, setActiveTool]   = useState<Tool | null>(null);
  const [managing, setManaging]       = useState(false);
  const [toolStatus, setToolStatus]   = useState<Record<string, ToolStatus>>(DEFAULT_STATUS);

  const toggleStatus = (id: string) => {
    setToolStatus(prev => ({ ...prev, [id]: prev[id] === "active" ? "inactive" : "active" }));
  };

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", fontFamily: "'Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" as const }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e3a6e", margin: "0 0 6px", letterSpacing: "-.02em" }}>
            Tools
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
            {managing ? "Manage tool availability for employees." : "Run tools or switch to manage mode."}
          </p>
        </div>

        {/* Manage toggle — admin only */}
        <button
          onClick={() => { setManaging(m => !m); setActiveTool(null); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 16px",
            background: managing ? "#1e3a6e" : "#fff",
            color: managing ? "#fff" : "#1e3a6e",
            border: "1.5px solid #1e3a6e",
            borderRadius: 10, cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            transition: "all .15s", flexShrink: 0,
          }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
            <path d="M7.5 9.5a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M12.5 7.5h-.6m-8.8 0H2.5m5-5v-.6m0 10.6v-.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {managing ? "Done Managing" : "Manage Tools"}
        </button>
      </div>

      {/* Tool grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 }}>
        {TOOLS.map(tool => {
          const status = toolStatus[tool.id] ?? "active";

          if (managing) {
            // Management card — toggle on/off
            return (
              <div
                key={tool.id}
                style={{
                  padding: 20, background: "#fff",
                  border: `1.5px solid ${status === "active" ? "#e2e8f0" : "#fca5a5"}`,
                  borderRadius: 14,
                  opacity: status === "active" ? 1 : 0.6,
                  transition: "all .2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{tool.icon}</span>
                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleStatus(tool.id)}
                    style={{
                      width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: status === "active" ? "#22c55e" : "#e2e8f0",
                      position: "relative", flexShrink: 0, transition: "background .2s",
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3,
                      left: status === "active" ? 21 : 3,
                      width: 18, height: 18, borderRadius: "50%", background: "#fff",
                      transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{tool.name}</div>
                <div style={{ fontSize: 12, color: status === "active" ? "#059669" : "#94a3b8", fontWeight: 500 }}>
                  {status === "active" ? "● Active — employees can use" : "○ Inactive — hidden from employees"}
                </div>
                {tool.versions && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                    {tool.versions.length} versions available
                  </div>
                )}
              </div>
            );
          }

          // Normal run card — only show active tools
          if (status === "inactive") return null;

          return (
            <ToolCard
              key={tool.id}
              tool={tool}
              isActive={activeTool?.id === tool.id}
              onClick={() => setActiveTool(prev => prev?.id === tool.id ? null : tool)}
            />
          );
        })}
      </div>

      {/* Inactive tools info in manage mode */}
      {managing && Object.values(toolStatus).some(s => s === "inactive") && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e" }}>
          ⚠ Inactive tools are hidden from employees. Toggle them on to restore access.
        </div>
      )}

      {/* Sliding panel — admin gets canManage=true */}
      {activeTool && !managing && (
        <ToolRunnerPanel
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          canManage={true}
        />
      )}
    </div>
  );
}
