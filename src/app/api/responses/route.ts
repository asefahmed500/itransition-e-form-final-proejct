import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../auth/[...nextauth]/route";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    
    const query: { form?: string | { $in: string[] } } = {};
    
    if (formId) {
      // Check if the user owns this form
      const form = await Form.findById(formId);
      if (!form) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }
      if (form.owner.toString() !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query.form = formId;
    } else {
      // Get all responses for forms owned by the user
      const forms = await Form.find({ owner: session.user.id }).select('_id');
      query.form = { $in: forms.map(f => f._id) };
    }
    
    // Ensure we're including all answer fields and populating user references
    const responses = await Response.find(query)
      .populate('form', 'title')
      .populate('user', 'name email')
      .select('form user answers submittedAt')
      .sort({ submittedAt: -1 });
    
    return NextResponse.json(responses);
  } catch (error: unknown) {
    console.error("Error fetching responses:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    const { form: formId, answers } = await request.json();
    
    // For POST, we don't require session if the form is public
    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    
    // Check if form is published
    if (!form.isPublished) {
      return NextResponse.json({ error: "Form is not published" }, { status: 400 });
    }
    
    // Check if form requires login
    if (form.requireLogin && !session?.user) {
      return NextResponse.json({ error: "Login required to submit this form" }, { status: 401 });
    }
    
    // Check if form is public or user is owner
    if (!form.isPublic && (!session?.user || form.owner.toString() !== session.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const newResponse = new Response({
      form: formId,
      user: session?.user?.id || null,
      answers
    });
    
    await newResponse.save();
    
    // Add response to form's responses array
    form.responses.push(newResponse._id);
    await form.save();
    
    return NextResponse.json(
      { success: true, message: "Response submitted successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error submitting response:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}