import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v||"").replace(/"/g,'""')}"`;
  return [
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  if (role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") || "clients";
  await connectDB();

  let csv = "";
  let filename = "";

  if (type === "clients") {
    const clients = await User.find({ role:"client" }).lean();
    csv = toCSV(
      ["Name","Email","Phone","Business","GSTIN","PAN","Services","Registered"],
      clients.map(c => [
        `${c.firstName} ${c.lastName}`,
        c.email, c.phone||"",
        c.businessName||"", c.gstin||"", c.pan||"",
        (c.servicesNeeded||[]).join("; "),
        new Date(c.createdAt as Date).toLocaleDateString("en-IN"),
      ])
    );
    filename = `optitax-clients-${Date.now()}.csv`;
  }

  else if (type === "employees") {
    const employees = await User.find({ role:{ $in:["employee","admin"] } }).lean();
    csv = toCSV(
      ["Name","Email","Department","Designation","Registered"],
      employees.map(e => [
        `${e.firstName} ${e.lastName}`,
        e.email, e.department||"", e.designation||"",
        new Date(e.createdAt as Date).toLocaleDateString("en-IN"),
      ])
    );
    filename = `optitax-employees-${Date.now()}.csv`;
  }

  else if (type === "projects") {
    const Project = (await import("@/models/Project")).default;
    const projects = await Project.find().populate("clientId","firstName lastName businessName").lean();
    csv = toCSV(
      ["Title","Type","Status","Priority","Progress","Client","Due Date","Created"],
      projects.map((p: Record<string,unknown>) => {
        const client = p.clientId as Record<string,string>|null;
        return [
          p.title as string, p.type as string||"", p.status as string, p.priority as string||"",
          `${p.progress}%`,
          client?.businessName||`${client?.firstName||""} ${client?.lastName||""}`.trim(),
          p.endDate as string||"", new Date(p.createdAt as Date).toLocaleDateString("en-IN"),
        ];
      })
    );
    filename = `optitax-projects-${Date.now()}.csv`;
  }

  else if (type === "subscriptions") {
    const Subscription = (await import("@/models/Subscription")).default;
    const subs = await Subscription.find().populate("clientId","firstName lastName email businessName").lean();
    csv = toCSV(
      ["Client","Email","Plan","Billing","Amount","Status","Valid Until"],
      subs.map((s: Record<string,unknown>) => {
        const client = s.clientId as Record<string,string>|null;
        return [
          client?.businessName||`${client?.firstName||""} ${client?.lastName||""}`.trim(),
          client?.email||"",
          s.plan as string, s.billingCycle as string,
          `₹${((s.amount as number)||0)/100}`,
          s.status as string,
          s.currentPeriodEnd ? new Date(s.currentPeriodEnd as Date).toLocaleDateString("en-IN") : "",
        ];
      })
    );
    filename = `optitax-subscriptions-${Date.now()}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}