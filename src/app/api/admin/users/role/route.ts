// /app/api/admin/users/role/route.ts
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

    const { userId, role } = await req.json();
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only super-admin can promote to super-admin or demote other super-admins
    if (
      (role === "super-admin" || user.role === "super-admin") &&
      session.user.role !== "super-admin"
    ) {
      return NextResponse.json(
        { error: "Insufficient privileges" },
        { status: 403 }
      );
    }

    user.role = role;
    await user.save();

    return NextResponse.json({
      message: `User role updated to ${role} successfully`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}