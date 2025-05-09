// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "user" | "admin" | "super-admin";
    isBlocked: boolean;
    salesforceAccessToken?: string;
    salesforceRefreshToken?: string;
    salesforceInstanceUrl?: string;
    crmData?: {
      salesforceId?: string;
      companyName?: string;
      jobTitle?: string;
      phone?: string;
      industry?: string;
      lastSynced?: Date;
    };
  }

  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin" | "super-admin";
    isBlocked: boolean;
    salesforceAccessToken?: string;
    salesforceRefreshToken?: string;
    salesforceInstanceUrl?: string;
    crmData?: {
      salesforceId?: string;
      companyName?: string;
      jobTitle?: string;
      phone?: string;
      industry?: string;
      lastSynced?: Date;
    };
  }
}