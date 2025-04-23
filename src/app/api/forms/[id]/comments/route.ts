import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import Form from "@/lib/models/Form";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Extract id and ensure it's valid before using
    const formId = params.id;
    if (!formId) {
      return NextResponse.json({ error: "Form ID is required" }, { status: 400 });
    }

    const form = await Form.findById(formId)
      .populate('comments.user', 'name email image')
      .select('comments');
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Initialize comments array if it doesn't exist
    if (!form.comments) {
      form.comments = [];
    }

    const newComment = {
      user: session.user.id,
      text,
      createdAt: new Date()
    };

    form.comments.push(newComment);
    await form.save();

    // Populate the user data for the response
    const populatedForm = await Form.populate(form, {
      path: 'comments.user',
      select: 'name email image'
    });

    const addedComment = populatedForm.comments[populatedForm.comments.length - 1];

    return NextResponse.json(addedComment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}