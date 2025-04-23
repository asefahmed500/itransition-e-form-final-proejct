// app/api/forms/create-from-template/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/utils/dbConnect";
import { authOptions } from "../../auth/[...nextauth]/route";
import Template from "@/lib/models/Template";
import Form from "@/lib/models/Form";


export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await request.json();
    
    // Get the template
    const template = await Template.findById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check if user has permission to use this template
    if (!template.isPublic && template.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create new form based on template
    const newForm = new Form({
      title: template.title + " (Copy)",
      description: template.description,
      questions: template.questions,
      owner: session.user.id,
      isPublic: true,
      category: template.category, // Add the category from template
      templateSource: template._id
    });

    await newForm.save();

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error("Error creating form from template:", error);
    return NextResponse.json(
      { error: "Failed to create form from template" },
      { status: 500 }
    );
  }
}