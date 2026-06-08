import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import User from "@/models/User";
import { requireAuth } from "@/lib/apiAuth";
import { notifications } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;

  await connectDB();

  const { searchParams } = req.nextUrl;
  const status   = searchParams.get("status");
  const search   = searchParams.get("search");
  const page     = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit    = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const skip     = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (role === "client")   filter.clientId   = userId;
  if (role === "employee") filter.assignedTo = userId;
  if (status && status !== "all") filter.status = status;
  if (search) filter.$or = [
    { title:       { $regex: search, $options: "i" } },
    { description: { $regex: search, $options: "i" } },
    { type:        { $regex: search, $options: "i" } },
  ];

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("clientId",   "firstName lastName email businessName")
      .populate("assignedTo", "firstName lastName email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return NextResponse.json({
    projects,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  if (role === "client") return NextResponse.json({ error: "Clients cannot create projects" }, { status: 403 });

  await connectDB();
  const body    = await req.json();
  const project = await Project.create({ ...body, createdBy: userId });
  const populated = await project.populate([
    { path: "clientId",   select: "firstName lastName email businessName" },
    { path: "assignedTo", select: "firstName lastName email" },
  ]);

  // Notify client
  try {
    const client = await User.findById(body.clientId);
    if (client) {
      notifications.projectUpdated({
        clientEmail:  client.email,
        clientName:   client.firstName,
        projectTitle: body.title,
        status:       "Pending",
        progress:     0,
        updatedBy:    "OptiTax Team",
        note:         "A new project has been assigned to your account.",
      });
    }
  } catch {}

  return NextResponse.json({ success: true, project: populated }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;

  await connectDB();
  const { id, comment, assignedTo, ...updates } = await req.json();

  const project = await Project.findById(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Handle comment
  if (comment) {
    const user = await User.findById(userId).select("firstName lastName role");
    project.comments.push({
      author:     userId,
      authorName: `${user?.firstName} ${user?.lastName}`.trim(),
      authorRole: role,
      content:    comment,
    });
    // Notify other party
    try {
      if (role === "client") {
        // Notify assigned employees
        for (const empId of project.assignedTo) {
          const emp = await User.findById(empId).select("email firstName");
          if (emp) notifications.projectComment({ recipientEmail:emp.email, recipientName:emp.firstName, commenterName:user?.firstName||"Client", projectTitle:project.title, comment, role:"employee" });
        }
      } else {
        // Notify client
        const client = await User.findById(project.clientId).select("email firstName");
        if (client) notifications.projectComment({ recipientEmail:client.email, recipientName:client.firstName, commenterName:user?.firstName||"Team", projectTitle:project.title, comment, role:"client" });
      }
    } catch {}
  }

  // Handle employee assignment
  if (assignedTo !== undefined) {
    if (role !== "admin") return NextResponse.json({ error: "Only admins can assign employees" }, { status: 403 });
    project.assignedTo = assignedTo;
  }

  // Apply other updates
  const prevStatus = project.status;
  Object.assign(project, updates);
  await project.save();

  // Notify client on status change
  if (updates.status && updates.status !== prevStatus) {
    try {
      const client = await User.findById(project.clientId);
      if (client) notifications.projectUpdated({ clientEmail:client.email, clientName:client.firstName, projectTitle:project.title, status:updates.status, progress:project.progress||0, updatedBy:"OptiTax Team" });
    } catch {}
  }

  return NextResponse.json({ success: true, project });
}

export async function DELETE(req: NextRequest) {
  const { role, response } = await requireAuth() as { userId:string; role:string; response:NextResponse|null };
  if (response) return response;
  if (role !== "admin") return NextResponse.json({ error: "Only admins can delete projects" }, { status: 403 });

  await connectDB();
  const { id } = await req.json();
  await Project.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}