// app/api/onedrive/tokens/route.ts
import { NextResponse } from 'next/server';
import Token from '@/lib/models/Token';
import dbConnect from '@/lib/utils/dbConnect';

interface TokensResponse {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  expiresAt: string;
  expiresIn: string;
  debug: {
    clientId: boolean;
    redirectUri: string | undefined;
    authSuccessful: boolean;
  };
}

export async function GET() {
  await dbConnect();
  try {
    const tokens = await Token.findOne<{ accessToken?: string; refreshToken?: string; expiresAt?: string }>({ service: 'onedrive' }).lean();
    
    if (!tokens || !tokens.accessToken) {
      return NextResponse.json(
        { 
          error: 'No tokens available',
          debug: {
            clientId: !!process.env.ONEDRIVE_CLIENT_ID,
            redirectUri: process.env.ONEDRIVE_REDIRECT_URI,
            authSuccessful: false
          }
        },
        { status: 400 }
      );
    }
    
    const response: TokensResponse = {
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      expiresAt: new Date(tokens.expiresAt).toISOString(),
      expiresIn: `${Math.round((new Date(tokens.expiresAt).getTime() - Date.now()) / 1000)} seconds`,
      debug: {
        clientId: !!process.env.ONEDRIVE_CLIENT_ID,
        redirectUri: process.env.ONEDRIVE_REDIRECT_URI,
        authSuccessful: true
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch tokens', details: err.message },
      { status: 500 }
    );
  }
}