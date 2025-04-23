import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Form from "@/lib/models/Form";

export async function POST(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract id and ensure it's valid before using
    const formId = params.id;
    if (!formId) {
      return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
    }

    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Initialize likes array if it doesn't exist
    if (!form.likes) {
      form.likes = [];
    }

    const userId = session.user.id;
    const isLiked: boolean = form.likes.some((id: string | null) => 
      id && id.toString() === userId.toString()
    );

    if (isLiked) {
      // Unlike
      form.likes = form.likes.filter(
        (id: string | null): boolean => id !== null && id.toString() !== userId.toString()
      );
    } else {
      // Like
      form.likes.push(userId);
    }

    await form.save();

    return NextResponse.json({
      success: true,
      isLiked: !isLiked,
      likesCount: form.likes.length
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}