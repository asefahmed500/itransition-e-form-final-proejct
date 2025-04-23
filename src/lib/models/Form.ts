// src/lib/models/Form.ts
import { Schema, Document, model, models, Types } from "mongoose";

export interface IComment {
  _id: Types.ObjectId;
  user: Types.ObjectId | { _id: Types.ObjectId; name: string; email: string; image?: string };
  text: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface IQuestion {
  id: string;
  type: "text" | "multiple-choice" | "checkbox" | "dropdown" | "date" | "time" | "rating";
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
}

export interface IForm extends Document {
  _id: Types.ObjectId | string;
  title: string;
  description: string;
  questions: IQuestion[];
  isPublic: boolean;
  isPublished: boolean;
  requireLogin: boolean;
  owner: Types.ObjectId | { _id: Types.ObjectId; name: string; email: string };
  category: string;
  likes: Types.ObjectId[];
  comments: IComment[];
  responses: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
const CommentSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const QuestionSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "multiple-choice", "checkbox", "dropdown", "date", "time", "rating"],
    },
    question: { type: String, required: true },
    description: { type: String },
    options: { type: [String] },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const FormSchema: Schema<IForm> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    questions: [QuestionSchema],
    isPublic: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    requireLogin: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, default: "general" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [CommentSchema],
    responses: [{ type: Schema.Types.ObjectId, ref: "Response" }],
  },
  { timestamps: true }
);

export default models.Form || model<IForm>("Form", FormSchema);