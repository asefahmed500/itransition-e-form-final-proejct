// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        try {
          await dbConnect();
          
          const adminEmails = ["asefahmed500@gmail.com"];
          const isAdmin = adminEmails.includes(profile.email);
          
          const userData = {
            name: profile.name || profile.email.split("@")[0],
            email: profile.email,
            role: isAdmin ? "admin" : "user",
            isBlocked: false,
            authProvider: "google",
            emailVerified: new Date(),
            lastLogin: new Date(),
          };

          const updateResult = await User.findOneAndUpdate(
            { email: profile.email },
            {
              $setOnInsert: userData,
              $set: { lastLogin: new Date() }
            },
            { upsert: true, new: true }
          );

          if (!updateResult) throw new Error("User update failed");
          if (updateResult.isBlocked) throw new Error("AccountBlocked");

          return {
            id: updateResult._id.toString(),
            name: updateResult.name,
            email: updateResult.email,
            role: updateResult.role,
            isBlocked: updateResult.isBlocked,
            ...(updateResult.salesforceAccessToken && {
              salesforceAccessToken: updateResult.salesforceAccessToken,
              salesforceRefreshToken: updateResult.salesforceRefreshToken,
              salesforceInstanceUrl: updateResult.salesforceInstanceUrl,
              crmData: updateResult.crmData
            })
          };
        } catch (error) {
          console.error("Google auth error:", error);
          throw error;
        }
      },
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await dbConnect();
          
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Credentials required");
          }

          const user = await User.findOne({
            email: credentials.email,
            authProvider: "credentials",
          }).select("+password");

          if (!user || !(await user.comparePassword(credentials.password))) {
            throw new Error("Invalid credentials");
          }
          if (user.isBlocked) throw new Error("AccountBlocked");

          await User.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          );

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
            ...(user.salesforceAccessToken && {
              salesforceAccessToken: user.salesforceAccessToken,
              salesforceRefreshToken: user.salesforceRefreshToken,
              salesforceInstanceUrl: user.salesforceInstanceUrl,
              crmData: user.crmData
            })
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isBlocked = user.isBlocked;
        if ("salesforceAccessToken" in user) {
          token.salesforceAccessToken = user.salesforceAccessToken;
          token.salesforceRefreshToken = user.salesforceRefreshToken;
          token.salesforceInstanceUrl = user.salesforceInstanceUrl;
          token.crmData = user.crmData;
        }
      }

      if (trigger === "update" && session?.user) {
        token.salesforceAccessToken = session.user.salesforceAccessToken;
        token.salesforceRefreshToken = session.user.salesforceRefreshToken;
        token.salesforceInstanceUrl = session.user.salesforceInstanceUrl;
        token.crmData = session.user.crmData;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isBlocked = token.isBlocked;
        if (token.salesforceAccessToken) {
          session.user.salesforceAccessToken = token.salesforceAccessToken;
          session.user.salesforceRefreshToken = token.salesforceRefreshToken;
          session.user.salesforceInstanceUrl = token.salesforceInstanceUrl;
          session.user.crmData = token.crmData;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // Reduced from 30 days to 1 day for better security
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // Disabled debug in production
  useSecureCookies: process.env.NODE_ENV === "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };