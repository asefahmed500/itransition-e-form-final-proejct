import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin" | "super-admin";
  isBlocked: boolean;
  authProvider?: "google" | "credentials";
  emailVerified?: Date;
  lastLogin?: Date;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
  odooToken?: string;
  odooTokenGeneratedAt?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => /\S+@\S+\.\S+/.test(v),
        message: (props: { value: string }) =>
          `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return this.authProvider === "credentials";
      },
      select: false,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "super-admin"],
      default: "user",
    },
    isBlocked: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: ["google", "credentials"],
      default: "credentials",
    },
    emailVerified: { type: Date },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    odooToken: { type: String, select: false },
    odooTokenGeneratedAt: { type: Date, select: false },
  },

  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (this.authProvider !== "credentials" || !this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.post(
  "save",
  function (
    error: mongoose.Error,
    doc: IUser,
    next: (err?: mongoose.Error) => void
  ) {
    if (
      error.name === "MongoServerError" &&
      (error as mongoose.Error & { code?: number }).code === 11000
    ) {
      next(new Error("Email already exists"));
    } else {
      next(error);
    }
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
