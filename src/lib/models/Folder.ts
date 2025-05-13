// lib/models/Folder.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IFolder extends Document {
  folderId: string;
  name: string;
  webUrl: string;
  service: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    folderId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    webUrl: { type: String, required: true },
    service: { type: String, required: true, default: "onedrive" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Export both the model and the interface
const Folder = mongoose.models?.Folder || mongoose.model<IFolder>("Folder", FolderSchema);
export default Folder;
