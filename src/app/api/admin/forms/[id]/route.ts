import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import dbConnect from "@/lib/utils/dbConnect";
import Form from "@/lib/models/Form";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Validation schema
// Update your FormUpdateSchema to make questions optional
 const FormUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().optional(), // Make ID optional for new questions
        type: z.enum([
          "text",
          "multiple-choice",
          "checkbox",
          "dropdown",
          "date",
          "time",
          "rating",
        ]).default("text"), // Add default type
        question: z.string().optional(), // Remove min(1) requirement
        description: z.string().optional(),
        options: z.array(z.string()).optional(),
        required: z.boolean().default(false),
      })
    )
    .optional()
    .default([]), // Default to empty array if not provided
  isPublic: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  requireLogin: z.boolean().default(false),
  category: z.string().min(1, "Category is required"),
});

// GET /api/admin/forms/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const formId = params.id;

    const form = await Form.findById(formId).populate("owner", "name email");

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (
      !form.isPublic &&
      session?.user?.id !== form.owner._id.toString() &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super-admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/forms/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    if (
      form.owner.toString() !== session.user.id &&
      session.user.role !== "admin" &&
      session.user.role !== "super-admin"
    ) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own forms" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = FormUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(
        (err) => `${err.path.join(".")} - ${err.message}`
      );
      return NextResponse.json(
        { error: "Validation error", details: errors },
        { status: 400 }
      );
    }

    Object.assign(form, validationResult.data);
    await form.save();

    const updatedForm = await Form.findById(formId).populate(
      "owner",
      "name email"
    );

    return NextResponse.json({
      form: updatedForm,
      message: "Form updated successfully",
    });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/forms/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const formId = params.id;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (
      form.owner.toString() !== session.user.id &&
      session.user.role !== "admin" &&
      session.user.role !== "super-admin"
    ) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own forms" },
        { status: 403 }
      );
    }

    await form.deleteOne();
    return NextResponse.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}
