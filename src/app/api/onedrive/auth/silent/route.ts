import { NextResponse } from 'next/server';
import Token from '@/lib/models/Token';
import dbConnect from '@/lib/utils/dbConnect';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


export async function POST(request: Request) {
  await dbConnect();
  try {
    const { userId } = await request.json();
    const session = await getServerSession(authOptions);
    
    // Verify the requesting user matches the session
    if (session?.user?.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = await Token.findOne<{ refreshToken?: string }>({ 
      service: 'onedrive',
      userId 
    }).lean();

    if (!token?.refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      );
    }

    // Refresh the token silently
    const refreshResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/onedrive/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        refresh_token: token.refreshToken,
        user_id: userId
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Silent auth failed' },
      { status: 500 }
    );
  }
}