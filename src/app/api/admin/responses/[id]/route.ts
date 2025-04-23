// src/app/api/admin/responses/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/utils/dbConnect";
import Response from "@/lib/models/Response";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: responseId } = await context.params;

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

    const response = await Response.findById(responseId)
      .populate("form", "title questions")
      .populate("user", "name email");

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error fetching response:", error);
    return NextResponse.json(
      { error: "Failed to fetch response" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: responseId } = await context.params;

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

    const body = await request.json();
    const response = await Response.findById(responseId);

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    response.answers = body.answers;
    await response.save();

    return NextResponse.json(
      { message: "Response updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating response:", error);
    return NextResponse.json(
      { error: "Failed to update response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: responseId } = await context.params;

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

    const response = await Response.findById(responseId);

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    await Response.findByIdAndDelete(responseId);

    return NextResponse.json(
      { message: "Response deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}