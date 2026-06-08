import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  projectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  roomId:     { type: String, required: true }, // e.g. "client_<userId>" for direct
  text:       { type: String, required: true, trim: true },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);