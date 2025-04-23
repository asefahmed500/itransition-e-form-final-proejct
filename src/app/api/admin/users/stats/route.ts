// /app/api/admin/users/stats/route.ts
import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const [totalUsers, activeUsers, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: false }),
      User.countDocuments({ role: { $in: ["admin", "super-admin"] } }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      blockedUsers: totalUsers - activeUsers,
      admins,
    });
  } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Server error";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    } 
    

}