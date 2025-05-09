// app/api/salesforce/callback/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
import User from "@/lib/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";
import { cookies } from 'next/headers';
import dbConnect from "@/lib/utils/dbConnect";

export async function GET(request: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            return NextResponse.redirect(
                new URL(`/dashboard/salesforce?error=${encodeURIComponent(error)}`, request.url)
            );
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/dashboard/salesforce?error=missing_code', request.url)
            );
        }

        const cookieStore = await cookies();
        const codeVerifier = cookieStore.get('salesforce_code_verifier')?.value;
        
        if (!codeVerifier) {
            throw new Error("Missing code verifier - session may have expired");
        }

        const tokenResponse = await axios.post(
            "https://login.salesforce.com/services/oauth2/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.SALESFORCE_CLIENT_ID!,
                client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
                redirect_uri: process.env.SALESFORCE_CALLBACK_URL!,
                code,
                code_verifier: codeVerifier
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                timeout: 15000,
            }
        );

        const { access_token, refresh_token, instance_url } = tokenResponse.data;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new Error("No active session - please log in again");
        }

        // Update user record
        await User.findByIdAndUpdate(
            session.user.id,
            {
                $set: {
                    salesforceAccessToken: access_token,
                    salesforceRefreshToken: refresh_token,
                    salesforceInstanceUrl: instance_url,
                    crmData: {
                        lastSynced: new Date()
                    }
                },
            },
            { 
                maxTimeMS: 30000,
                session: null 
            }
        );

        // Create response with redirect
        const response = NextResponse.redirect(
            new URL('/dashboard/salesforce?success=true', request.url)
        );
        
        // Clear the code verifier cookie
        response.cookies.delete('salesforce_code_verifier');
        
        // Force session update
        response.cookies.set({
            name: '__Secure-authjs.session-token',
            value: 'session-updated',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 // Short expiration to force update
        });

        return response;

    } catch (err) {
        console.error("Callback error:", err);
        
        let errorMessage = "Authentication failed";
        if (err instanceof Error) {
            errorMessage = err.message.includes("timed out") 
                ? "Operation timed out - please try again" 
                : err.message;
        }

        return NextResponse.redirect(
            new URL(`/dashboard/salesforce?error=${encodeURIComponent(errorMessage)}`, request.url)
        );
    }
}