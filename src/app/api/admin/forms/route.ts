import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/utils/dbConnect";
import Form from "@/lib/models/Form";


// Schema for form validation

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check authorization (admin or super-admin only)
    if (session.user?.role !== "admin" && session.user?.role !== "super-admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get all forms with populated owner
    const forms = await Form.find({})
      .populate("owner", "name email")
      .lean();

    return NextResponse.json({ forms }, { status: 200 });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

