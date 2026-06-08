import connectDB from "./mongodb";

interface AuditEntry {
  userId:    string;
  userEmail?: string;
  userRole?:  string;
  action:    string;
  entity?:   string;
  entityId?: string;
  details?:  Record<string, unknown>;
  ip?:       string;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await connectDB();
    const AuditLog = (await import("@/models/AuditLog")).default;
    await AuditLog.create(entry);
  } catch (err) {
    console.error("[AuditLog]", err); // never crash main flow
  }
}