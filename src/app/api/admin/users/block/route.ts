import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: Request, 
  { params }: { params: { action: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userIds } = await req.json();
    // Fixed: Make sure params is treated as a Promise and awaited properly
    const { action } = params;
    await dbConnect();

    // Get all users to check for super-admin
    const users = await User.find({ _id: { $in: userIds } });
    
    // Check if any user is super-admin and current user is not super-admin
    if (
      users.some((user) => user.role === "super-admin") &&
      session.user.role !== "super-admin"
    ) {
      return NextResponse.json(
        { error: "Cannot modify super-admin users" },
        { status: 403 }
      );
    }

    // For self-modification, only allow in certain cases
    const includingSelf = userIds.includes(session.user.id);
    if (includingSelf && (action === "delete" || action === "block")) {
      return NextResponse.json(
        { error: "Cannot perform this bulk action on yourself" },
        { status: 400 }
      );
    }

    let update: Partial<{ isBlocked: boolean; role: string }> = {};
    let message = "";

    switch (action) {
      case "block":
        update = { isBlocked: true };
        message = "Users blocked successfully";
        break;
      case "unblock":
        update = { isBlocked: false };
        message = "Users unblocked successfully";
        break;
      case "promote":
        update = { role: "admin" };
        message = "Users promoted to admin successfully";
        break;
      case "demote":
        update = { role: "user" };
        message = "Users demoted to regular users successfully";
        break;
      case "delete":
        await User.deleteMany({ _id: { $in: userIds } });
        return NextResponse.json({ message: "Users deleted successfully" });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: update }
    );

    return NextResponse.json({ message });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}