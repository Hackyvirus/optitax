import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadFile(
  file: Buffer,
  options: { folder: string; filename?: string; resource_type?: "image" | "raw" | "auto" }
): Promise<{ url: string; publicId: string; bytes: number; format: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: options.folder, public_id: options.filename, resource_type: options.resource_type || "auto", unique_filename: true },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id, bytes: result.bytes, format: result.format });
      }
    );
    stream.end(file);
  });
}

export async function deleteFile(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export function getFileSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}