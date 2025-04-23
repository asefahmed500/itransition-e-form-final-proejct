import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../auth/[...nextauth]/route";
import Template from "@/lib/models/Template";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");

    const query: Record<string, unknown> = {};

    if (isPublic) {
      query.isPublic = true;
    } else if (userId) {
      query.owner = userId;
    } else if (session?.user?.id) {
      query.$or = [
        { owner: session.user.id },
        { isPublic: true }
      ];
    } else {
      query.isPublic = true;
    }

    if (category) {
      query.category = category;
    }

    const templates = await Template.find(query)
      .populate("owner", "name email")
      .populate("likes", "name email")
      .populate("comments.user", "name email")
      .populate("comments.replies.user", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templateData = await request.json();

    const newTemplate = new Template({
      ...templateData,
      owner: session.user.id,
    });

    await newTemplate.save();

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
