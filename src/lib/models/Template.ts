import mongoose, { Schema, Document } from "mongoose";

export interface ITemplate extends Document {
  _id: string;
  title: string;
  description: string;
  questions: {
    id: string;
    type:
      | "text"
      | "multiple-choice"
      | "checkbox"
      | "dropdown"
      | "date"
      | "time"
      | "rating";
    question: string;
    description?: string;
    options?: string[];
    required: boolean;
  }[];
  category: string;
  owner: mongoose.Types.ObjectId;
  isPublic: boolean;
  likes: mongoose.Types.ObjectId[];
  comments: {
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
    replies: {
      user: mongoose.Types.ObjectId;
      text: string;
      createdAt: Date;
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: [
            "text",
            "multiple-choice",
            "checkbox",
            "dropdown",
            "date",
            "time",
            "rating",
          ],
        },
        question: { type: String, required: true },
        description: { type: String },
        options: [String],
        required: { type: Boolean, default: false },
      },
    ],
    category: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublic: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        replies: [
          {
            user: { type: Schema.Types.ObjectId, ref: "User", required: true },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Template ||
  mongoose.model<ITemplate>("Template", TemplateSchema);
