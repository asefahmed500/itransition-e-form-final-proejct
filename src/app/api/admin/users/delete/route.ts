// /app/api/admin/users/delete/route.ts
import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting super-admin unless current user is super-admin
    if (user.role === "super-admin" && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Cannot delete super-admin" },
        { status: 403 }
      );
    }

    // Prevent deleting yourself
    if (user._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete yourself" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(userId);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}