import { NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import Token from "@/lib/models/Token";
import dbConnect from "@/lib/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle errors from Microsoft auth
  if (error) {
    console.error("Microsoft auth error:", error);
    return NextResponse.redirect(
      new URL(`/?onedrive_error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?onedrive_error=missing_auth_code", request.url)
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Verify required environment variables
    const requiredEnv = {
      clientId: process.env.ONEDRIVE_CLIENT_ID,
      clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
      redirectUri: process.env.ONEDRIVE_REDIRECT_URI
    };

    for (const [key, value] of Object.entries(requiredEnv)) {
      if (!value) throw new Error(`Missing ${key} in environment variables`);
    }

    // Exchange auth code for tokens
    const tokenResponse = await axios.post<TokenResponse>(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams(
        Object.entries({
          client_id: requiredEnv.clientId,
          client_secret: requiredEnv.clientSecret,
          code,
          redirect_uri: requiredEnv.redirectUri,
          grant_type: "authorization_code",
        }).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      ),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Store tokens in database with user association
    await Token.findOneAndUpdate(
      { service: "onedrive", ...(userId && { userId }) },
      {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(
      new URL("/?onedrive_auth=success", request.url)
    );
  } catch (error) {
    const err = error as AxiosError;
    console.error("Token exchange failed:", err.response?.data || err.message);
    return NextResponse.redirect(
      new URL(`/?onedrive_error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
    }

    // Verify required environment variables
    const requiredEnv = {
      clientId: process.env.ONEDRIVE_CLIENT_ID,
      clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
      redirectUri: process.env.ONEDRIVE_REDIRECT_URI
    };

    // Refresh access token
    const response = await axios.post<TokenResponse>(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      new URLSearchParams(
        Object.entries({
          client_id: requiredEnv.clientId,
          client_secret: requiredEnv.clientSecret,
          refresh_token,
          grant_type: "refresh_token",
          redirect_uri: requiredEnv.redirectUri,
        }).reduce((acc, [key, value]) => {
          if (value !== undefined) acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      ),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

    // Update tokens in database with user association
    await Token.findOneAndUpdate(
      { service: "onedrive", ...(userId && { userId }) },
      {
        accessToken: access_token,
        refreshToken: new_refresh_token || refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      access_token,
      expires_in,
      refresh_token: new_refresh_token || refresh_token,
    });
  } catch (error) {
    const err = error as AxiosError;
    console.error("Token refresh failed:", err.response?.data || err.message);
    return NextResponse.json(
      {
        error: "Failed to refresh token",
        details: process.env.NODE_ENV === "development" ? err.response?.data : undefined,
      },
      { status: 500 }
    );
  }
}