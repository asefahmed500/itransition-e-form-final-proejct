import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, password }: SignupRequest = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" }, 
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" }, 
        { status: 400 }
      );
    }

    const newUser = new User({
      name,
      email,
      password,
      role: "user",
      isBlocked: false,
      authProvider: "credentials",
    });

    await newUser.save();

    return NextResponse.json(
      { 
        success: true, 
        message: "Account created successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}