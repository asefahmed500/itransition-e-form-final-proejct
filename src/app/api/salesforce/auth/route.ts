import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  // Validate environment variables
  const requiredVars = [
    "SALESFORCE_CLIENT_ID",
    "SALESFORCE_CALLBACK_URL",
    "SALESFORCE_CLIENT_SECRET",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    return NextResponse.json(
      { error: `Missing configuration: ${missingVars.join(", ")}` },
      { status: 500 }
    );
  }

  try {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const codeChallenge = crypto.createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const authUrl = new URL("https://login.salesforce.com/services/oauth2/authorize");
    const params = new URLSearchParams();
    params.append("response_type", "code");
    params.append("client_id", process.env.SALESFORCE_CLIENT_ID!);
    params.append("redirect_uri", process.env.SALESFORCE_CALLBACK_URL!);
    params.append("scope", "api refresh_token");
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "S256");
    params.append("prompt", "login consent");

    authUrl.search = params.toString();

    // Store the code verifier in a secure HTTP-only cookie
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('salesforce_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to initiate Salesforce authentication",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}