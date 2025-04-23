import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface BulkActionRequest {
  userIds: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let requestData: BulkActionRequest;

    try {
      requestData = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid or missing JSON body" }, { status: 400 });
    }

    const { userIds } = requestData;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid or empty userIds array" }, { status: 400 });
    }

    // Extract action from URL
    const pathParts = req.nextUrl.pathname.split("/");
    const action = pathParts[pathParts.length - 1];

    await dbConnect();

    const users = await User.find({ _id: { $in: userIds } });

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: "Some user IDs are invalid" }, { status: 400 });
    }

    const isSuperAdminInTargets = users.some((user) => user.role === "super-admin");

    if (isSuperAdminInTargets && session.user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Cannot modify super-admin users" },
        { status: 403 }
      );
    }

    const isSelfTargeted = userIds.includes(session.user.id);
    if (isSelfTargeted && (action === "delete" || action === "block")) {
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
        return NextResponse.json({
          error: `Invalid action: '${action}'. Valid actions: block, unblock, promote, demote, delete.`,
        }, { status: 400 });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: update }
    );

    return NextResponse.json({
      message,
      modifiedCount: result.modifiedCount
    });
  } catch (error: unknown) {
    console.error("Bulk user operation error:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
