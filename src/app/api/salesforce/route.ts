import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import axios, { AxiosError } from "axios";
import User from "@/lib/models/User";
import { authOptions } from "../auth/[...nextauth]/route";

interface SalesforceRequest {
  companyName?: string;
  jobTitle?: string;
  phone?: string;
  industry?: string;
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const { companyName, jobTitle, phone, industry }: SalesforceRequest = await request.json();
    
    try {
      const user = await User.findById(session.user.id);
      if (!user) {
        throw new Error("User not found");
      }
  
      const accessToken = user.salesforceAccessToken;
      const instanceUrl = user.salesforceInstanceUrl;
      const refreshToken = user.salesforceRefreshToken;
  
      if (!accessToken || !instanceUrl || !refreshToken) {
        throw new Error("Salesforce connection not authenticated");
      }
  
      const makeRequest = async (token: string) => {
        try {
          // First try to create account
          const accountResponse = await axios.post(
            `${instanceUrl}/services/data/v58.0/sobjects/Account`,
            {
              Name: companyName || `${session.user.name}'s Company`,
              Industry: industry || 'Technology',
              Phone: phone
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
  
          const nameParts = session.user.name?.split(' ') || [];
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || 'User';
  
          // Then create contact
          const contactResponse = await axios.post(
            `${instanceUrl}/services/data/v58.0/sobjects/Contact`,
            {
              FirstName: firstName,
              LastName: lastName,
              Email: session.user.email,
              Title: jobTitle || 'User',
              Phone: phone,
              AccountId: accountResponse.data.id
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
  
          return { accountResponse, contactResponse };
        } catch (error: unknown) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Token expired, try to refresh
            const refreshResponse = await axios.post(
              "https://login.salesforce.com/services/oauth2/token",
              new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.SALESFORCE_CLIENT_ID!,
                client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
                refresh_token: refreshToken
              }),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 10000,
              }
            );
  
            const newAccessToken = refreshResponse.data.access_token;
            await User.findByIdAndUpdate(session.user.id, {
              $set: {
                salesforceAccessToken: newAccessToken
              }
            });
  
            // Retry with new token
            return makeRequest(newAccessToken);
          }
          throw error;
        }
      };
  
      const { accountResponse, contactResponse } = await makeRequest(accessToken);
  
      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          crmData: {
            salesforceId: accountResponse.data.id,
            companyName,
            jobTitle,
            phone,
            industry,
            lastSynced: new Date()
          }
        }
      });
  
      return NextResponse.json({ 
        success: true,
        accountId: accountResponse.data.id,
        contactId: contactResponse.data.id
      });
  
    } catch (error: unknown) {
      console.error('Salesforce operation failed:', error);
      
      let errorMessage = 'Salesforce operation failed';
      let statusCode = 500;
      
      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.[0]?.message || 
                      error.response?.data?.error_description || 
                      error.message;
        statusCode = error.response?.status || 500;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          solution: statusCode === 401 ? 
            "Please re-authenticate with Salesforce" : 
            "Please try again later"
        },
        { status: statusCode }
      );
    }
}