import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  fileUrl:    { type: String, required: true },
  fileType:   { type: String, trim: true },  // PDF, Excel, Word, Image
  fileSize:   { type: String, trim: true },  // "245 KB"
  category:   { type: String, trim: true },  // Registration, Identity, Financial, Customs, Legal
  clientId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);