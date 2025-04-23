import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../auth/[...nextauth]/route";
import Form from "@/lib/models/Form";
import Template from "@/lib/models/Template";
import { Types } from "mongoose";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get ID from params instead of body
    const formId = params.id;
    if (!formId) {
      return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
    }

    const { itemType } = await request.json();
    
    if (!itemType) {
      return NextResponse.json({ error: "Missing itemType" }, { status: 400 });
    }

    let model;
    switch (itemType) {
      case "form":
        model = Form;
        break;
      case "template":
        model = Template;
        break;
      default:
        return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    const item = await model.findById(formId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const userIdStr = session.user.id.toString();
    const alreadyLiked = item.likes.some(
      (like: string | Types.ObjectId) => like.toString() === userIdStr
    );

    if (alreadyLiked) {
      // Unlike
      item.likes = item.likes.filter(
        (like: string | Types.ObjectId) => like.toString() !== userIdStr
      );
    } else {
      // Like
      item.likes.push(session.user.id);
    }

    await item.save();

    return NextResponse.json({ success: true, likes: item.likes.length });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}