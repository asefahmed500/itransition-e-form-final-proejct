import Token from "@/lib/models/Token";
import dbConnect from "@/lib/utils/dbConnect";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    const token = await Token.findOne<{ expiresAt?: Date }>({ 
      service: 'onedrive',
      ...(session?.user?.id && { userId: session.user.id }) 
    }).lean();

    return NextResponse.json({
      authenticated: !!token,
      expiresAt: token?.expiresAt || null,
      message: token ? 'Authenticated with OneDrive' : 'Not authenticated',
      userId: session?.user?.id || null
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check authentication status',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}