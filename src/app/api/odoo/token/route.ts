import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import User from "@/lib/models/User";
import crypto from "crypto";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { 
        odooToken: token,
        odooTokenGeneratedAt: generatedAt 
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      token,
      generatedAt,
      expiresAt
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate API token' },
      { status: 500 }
    );
  }
}