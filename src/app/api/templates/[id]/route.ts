import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/route";
import Template from "@/lib/models/Template";

// GET /api/templates/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Extract id from params
    const { id } = params;

    const template = await Template.findById(id)
      .populate("owner", "name email")
      .populate("likes", "name email")
      .populate("comments.user", "name email")
      .populate("comments.replies.user", "name email");

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Restrict private template access
    if (!template.isPublic && session?.user?.id !== template.owner._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract id from params
    const { id } = params;

    const template = await Template.findById(id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedData = await request.json();
    Object.assign(template, updatedData);
    await template.save();

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract id from params
    const { id } = params;

    const template = await Template.findById(id);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await template.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}