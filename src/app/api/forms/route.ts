import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../auth/[...nextauth]/route";
import Form from "@/lib/models/Form";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");

    let session = null;
    if (!isPublic) {
      session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const query: Record<string, unknown> = {};

    if (isPublic) {
      query.isPublic = true;
      query.isPublished = true;
    } else if (userId) {
      query.owner = userId;
    } else {
      query.owner = session?.user?.id;
    }

    if (category) {
      query.category = category;
    }

    const forms = await Form.find(query)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.json();

    const newForm = new Form({
      ...formData,
      owner: session.user.id,
    });

    await newForm.save();

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
