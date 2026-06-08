import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    if (process.env.CLOUDINARY_API_KEY) {
      const { uploadFile } = await import("@/lib/cloudinary");
      const buffer   = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadFile(buffer, {
        folder:        "optitax/receipts",
        resource_type: file.type.startsWith("image/") ? "image" : "raw",
      });
      return NextResponse.json({ url: uploaded.url, name: file.name });
    }

    return NextResponse.json({ error: "File storage not configured" }, { status: 501 });
  } catch (err) {
    console.error("receipt upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}