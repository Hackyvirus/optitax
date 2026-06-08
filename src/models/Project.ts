import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  fileUrl:    { type: String, required: true },
  fileType:   { type: String },
  fileSize:   { type: String },
  category:   { type: String, default: "requirement" }, // requirement | deliverable | reference
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  publicId:   { type: String }, // Cloudinary public_id for deletion
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  author:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String },
  authorRole: { type: String },
  content:    { type: String, required: true },
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type:        { type: String, trim: true }, // GST Filing, ITR, Brand Rate, MOOWR, SEZ
  status:      { type: String, enum: ["Pending","In Progress","Completed","On Hold","Cancelled"], default: "Pending" },
  priority:    { type: String, enum: ["Low","Medium","High","Urgent"], default: "Medium" },
  progress:    { type: Number, default: 0, min: 0, max: 100 },
  startDate:   { type: String },
  endDate:     { type: String },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tags:        [{ type: String }],
  notes:       { type: String },
  files:       [FileSchema],
  comments:    [CommentSchema],
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
