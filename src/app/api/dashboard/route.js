import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { requireAuth } from "@/lib/apiAuth";
import User from "@/models/User";

export async function GET() {
  try {
    const { userId, response } = await requireAuth();
    if (response) return response;

    await connectDB();
    const user = await User.findById(userId).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const role = user.role;
    let stats = {};

    try {
      if (role === "client") {
        const Project  = (await import("@/models/Project")).default;
        const Message  = (await import("@/models/Message")).default;
        const Document = (await import("@/models/Document")).default;
        const Filing   = (await import("@/models/Filing")).default;
        const [activeProjects, pendingDocs, completed, unreadMsgs, filings] = await Promise.all([
          Project.countDocuments({ clientId: userId, status: { $in: ["In Progress","Pending"] } }),
          Document.countDocuments({ clientId: userId }),
          Project.countDocuments({ clientId: userId, status: "Completed" }),
          Message.countDocuments({ roomId: `client_${userId}`, read: false }),
          Filing.countDocuments({ clientId: userId, status: "Filed" }),
        ]);
        stats = { activeProjects, pendingDocs, completed, unreadMsgs, gstFiled: filings, subscription: user.subscription || "free" };
      } else {
        const Project = (await import("@/models/Project")).default;
        const Message = (await import("@/models/Message")).default;
        const [totalClients, totalProjects, activeProjects, unreadMsgs] = await Promise.all([
          User.countDocuments({ role: "client" }),
          Project.countDocuments({}),
          Project.countDocuments({ status: "In Progress" }),
          Message.countDocuments({ read: false }),
        ]);
        stats = { totalClients, totalProjects, activeProjects, unreadMsgs, gstFiled: 0, gstPending: 0, itReturns: 0, subscription: "N/A" };
      }
    } catch {
      // Models not yet available — return zeros
      stats = role === "client"
        ? { activeProjects:0, pendingDocs:0, completed:0, unreadMsgs:0, gstFiled:0, subscription: user.subscription||"free" }
        : { totalClients:0, totalProjects:0, activeProjects:0, unreadMsgs:0, gstFiled:0, gstPending:0, itReturns:0, subscription:"N/A" };
    }

    return NextResponse.json({
      name:         user.firstName || user.name || "User",
      email:        user.email     || "",
      phone:        user.phone     || "",
      photo:        user.photo     || "",
      role,
      businessName: user.businessName      || "",
      gstin:        user.gstin             || "",
      pan:          user.pan               || "",
      address:      user.registeredAddress || "",
      department:   user.department        || "",
      designation:  user.designation       || "",
      adminLevel:   user.adminLevel        || "",
      specializations: user.specializations || [],
      stats,
    });
  } catch (error) {
    console.error("Dashboard route error:", error);
    return NextResponse.json({ error: "Couldn't load dashboard." }, { status: 500 });
  }
}
