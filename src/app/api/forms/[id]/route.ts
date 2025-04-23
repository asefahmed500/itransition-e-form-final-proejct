import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/route";
import Form from "@/lib/models/Form";


export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    // Ensure params.id is a valid string
    const formId = params.id;
    
    const form = await Form.findById(formId).populate('owner', 'name email');
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    
    // Only owner can view private forms
    if (!form.isPublic && session?.user?.id !== form.owner._id.toString()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formId = params.id;
    const form = await Form.findById(formId);
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    
    if (form.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await request.json();
    
    Object.assign(form, formData);
    await form.save();
    
    return NextResponse.json(form);
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formId = params.id;
    const form = await Form.findById(formId);
    
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    
    if (form.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await form.deleteOne();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}