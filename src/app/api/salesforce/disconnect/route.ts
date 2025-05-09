// app/api/salesforce/disconnect/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/lib/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/utils/dbConnect";
import { Session } from "next-auth";

// Type for authenticated session with user
interface AuthenticatedSession extends Session {
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}

// Opt out of caching
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await dbConnect();
    
    // Get session with proper typing
    const session = await getServerSession(authOptions) as AuthenticatedSession | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Perform the disconnect operation
    const { modifiedCount } = await User.updateOne(
      { _id: session.user.id },
      {
        $unset: {
          salesforceAccessToken: "",
          salesforceRefreshToken: "",
          salesforceInstanceUrl: "",
          crmData: ""
        }
      }
    );

    if (modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes made - user may not exist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Successfully disconnected from Salesforce"
    });

  } catch (error: unknown) {
    console.error("Disconnect error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { 
        error: "Failed to disconnect",
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}