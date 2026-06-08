import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { rateLimit } from "@/lib/rateLimit";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED  = ["application/pdf","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","image/jpeg","image/png","image/webp"];

function getFileType(mime: string) {
  if (mime.includes("pdf"))   return "PDF";
  if (mime.includes("sheet") || mime.includes("excel")) return "Excel";
  if (mime.includes("word"))  return "Word";
  if (mime.includes("image")) return "Image";
  return "File";
}
function getFileSize(bytes: number) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}

export async function POST(req: NextRequest) {
  const { userId, response } = await requireAuth();
  if (response) return response;

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`upload:${ip}`, 20, 60*60*1000)) {
    return NextResponse.json({ error: "Upload limit reached. Try again in 1 hour." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const purpose  = formData.get("purpose") as string || "document";
    const category = formData.get("category") as string || "General";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "File type not allowed." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    if (process.env.CLOUDINARY_API_KEY) {
      const { uploadFile, getFileSize: cloudSize } = await import("@/lib/cloudinary");
      const folder   = purpose === "avatar" ? "optitax/avatars" : `optitax/documents/${userId}`;
      const uploaded = await uploadFile(buffer, {
        folder,
        filename:      purpose === "avatar" ? `avatar_${userId}` : undefined,
        resource_type: file.type.startsWith("image/") ? "image" : "raw",
      });

      await connectDB();
      if (purpose === "avatar") {
        await User.findByIdAndUpdate(userId, { photo: uploaded.url });
        return NextResponse.json({ success: true, url: uploaded.url });
      }

      const Document = (await import("@/models/Document")).default;
      const clientId = formData.get("clientId") as string || userId;
      const doc = await Document.create({
        name: file.name, fileUrl: uploaded.url,
        fileType: getFileType(file.type), fileSize: cloudSize(uploaded.bytes),
        category, clientId, uploadedBy: userId,
        projectId: formData.get("projectId") || undefined,
      });
      return NextResponse.json({ success: true, document: doc }, { status: 201 });
    }

    return NextResponse.json({
      error: "File storage not configured. Add CLOUDINARY_API_KEY to .env.local",
      hint:  "Get free keys at cloudinary.com"
    }, { status: 501 });

  } catch (err) {
    console.error("upload error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}