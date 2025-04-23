// src/lib/models/Response.ts
import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export interface IResponse extends Document {
  _id: string;
  form: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  answers: IAnswer[];
  submittedAt: Date;
}

const AnswerSchema: Schema = new Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ResponseSchema: Schema<IResponse> = new Schema(
  {
    form: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    answers: [AnswerSchema],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Response || model<IResponse>("Response", ResponseSchema);