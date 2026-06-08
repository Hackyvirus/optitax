"use client";
import { useState } from "react";
import { Tool } from "@/lib/toolTypes";
import ToolCard from "@/components/tools/ToolCard";
import ToolRunnerPanel from "@/components/tools/ToolRunnerPanel";

// Employee sees ALL tools but cannot manage them — run only
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
      { key: "client",  label: "Client Name",    type: "text", placeholder: "Client / Company name" },
      { key: "doctype", label: "Document Type",  type: "text", placeholder: "e.g. Invoices, Certificates" },
    ],
    inputs: [
      { key: "docs", label: "Documents (PDF / Excel / Images)", accept: ".pdf,.xlsx,.jpg,.png", required: true },
    ],
  },
];

export default function EmployeeToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  return (
    <div style={{ padding: "32px 36px", minHeight: "100%", fontFamily: "'Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e3a6e", margin: "0 0 6px", letterSpacing: "-.02em" }}>
          Tools
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
          Quick access to your most-used services.
        </p>
      </div>

      {/* Tool grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 14 }}>
        {TOOLS.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            isActive={activeTool?.id === tool.id}
            onClick={() => setActiveTool(prev => prev?.id === tool.id ? null : tool)}
          />
        ))}
      </div>

      {/* Sliding panel — run only, no management options */}
      {activeTool && (
        <ToolRunnerPanel
          tool={activeTool}
          onClose={() => setActiveTool(null)}
          canManage={false}
        />
      )}
    </div>
  );
}
