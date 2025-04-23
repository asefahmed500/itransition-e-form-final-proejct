// src/app/api/admin/responses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import dbConnect from "@/lib/utils/dbConnect";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user?.role !== "admin" && session.user?.role !== "super-admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    await dbConnect();

    const responses = await Response.find({})
      .populate({
        path: "form",
        select: "title",
        model: Form // Explicitly specify the model
      })
      .populate({
        path: "user",
        select: "name email",
        model: User // Explicitly specify the model
      })
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ responses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}