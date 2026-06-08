import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const category  = formData.get("category") as string || "requirement";

    if (!file || !projectId) return NextResponse.json({ error: "File and projectId required" }, { status: 400 });

    await connectDB();
    const project = await Project.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    let fileUrl  = "";
    let fileSize = `${(file.size/1024).toFixed(1)} KB`;
    const fileType = file.type.includes("pdf")?"PDF":file.type.includes("sheet")?"Excel":file.type.includes("image")?"Image":"File";

    if (process.env.CLOUDINARY_API_KEY) {
      const { uploadFile, getFileSize } = await import("@/lib/cloudinary");
      const buffer   = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadFile(buffer, {
        folder:        `optitax/projects/${projectId}`,
        resource_type: file.type.startsWith("image/") ? "image" : "raw",
      });
      fileUrl  = uploaded.url;
      fileSize = getFileSize(uploaded.bytes);
    } else {
      return NextResponse.json({ error: "File storage not configured. Add CLOUDINARY_API_KEY to .env.local" }, { status: 501 });
    }

    project.files.push({ name:file.name, fileUrl, fileType, fileSize, category, uploadedBy:userId });
    await project.save();
    return NextResponse.json({ success: true, file: { name:file.name, fileUrl, fileType, fileSize, category } }, { status: 201 });
  } catch (err) {
    console.error("project file upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const { projectId, fileId } = await req.json();
  await connectDB();
  await Project.findByIdAndUpdate(projectId, { $pull: { files: { _id: fileId } } });
  return NextResponse.json({ success: true });
}