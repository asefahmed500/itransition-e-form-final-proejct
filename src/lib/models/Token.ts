import mongoose, { Document, Schema } from "mongoose";

export interface IToken extends Document {
  service: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema = new Schema<IToken>(
  {
    service: { 
      type: String, 
      required: true,
      enum: ['onedrive'] 
    },
    accessToken: { 
      type: String, 
      required: true 
    },
    refreshToken: { 
      type: String, 
      required: true 
    },
    expiresAt: { 
      type: Date, 
      required: true,
      index: { expires: '0s' } // Auto-delete expired tokens
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for faster lookups
TokenSchema.index({ service: 1, userId: 1 }, { unique: true });

const Token = mongoose.models?.Token || mongoose.model<IToken>("Token", TokenSchema);
export default Token;