import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/utils/dbConnect";
import Template from "@/lib/models/Template";


export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, text, commentId } = await request.json();

    if (!templateId || !text) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const template = await Template.findById(templateId);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (!template.isPublic && template.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (commentId) {
      // Add reply to existing comment
      const comment = template.comments.id(commentId);
      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }

      comment.replies.push({
        user: session.user.id,
        text
      });
    } else {
      // Add new comment
      template.comments.push({
        user: session.user.id,
        text
      });
    }

    await template.save();

    const updatedTemplate = await Template.findById(templateId)
      .populate('comments.user', 'name email')
      .populate('comments.replies.user', 'name email');

    return NextResponse.json(updatedTemplate.comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}