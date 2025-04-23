// /app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find().select("-password");
    return NextResponse.json({ users });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}