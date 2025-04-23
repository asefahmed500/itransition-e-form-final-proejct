import NextAuth, { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import User from "@/lib/models/User";
import dbConnect from "@/lib/utils/dbConnect";

declare module "next-auth" {
  interface User {
    id: string;
    role: "user" | "admin" | "super-admin";
    isBlocked: boolean;
  }
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "user" | "admin" | "super-admin";
      isBlocked: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin" | "super-admin";
    isBlocked: boolean;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      async profile(profile) {
        try {
          await dbConnect();

          // Only allow specific emails to be admins
          const adminEmails = ["asefahmed500@gmail.com"]; // Add other admin emails here
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

          // Find existing user or create new one
          let user = await User.findOne({ email: profile.email });
          
          if (!user) {
            user = await User.create(userData);
          } else {
            // Update existing user
            user = await User.findOneAndUpdate(
              { email: profile.email },
              { 
                $set: { 
                  lastLogin: new Date(),
                  ...(user.authProvider === "google" ? {} : userData) // Only update provider-specific fields if already using Google
                } 
              },
              { new: true }
            );
          }

          if (!user) throw new Error("User creation/update failed");
          if (user.isBlocked) throw new Error("AccountBlocked");

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
          };
        } catch (error) {
          console.error("Google authentication error:", error);
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
            throw new Error("Email and password are required");
          }

          const user = await User.findOne({
            email: credentials.email,
            authProvider: "credentials",
          }).select("+password");

          if (!user) throw new Error("Invalid credentials");
          if (user.isBlocked) throw new Error("AccountBlocked");

          const isValid = await user.comparePassword(credentials.password);
          if (!isValid) throw new Error("Invalid credentials");

          // Update last login without causing conflicts
          await User.findByIdAndUpdate(user._id, { 
            $set: { lastLogin: new Date() } 
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
          };
        } catch (error) {
          console.error("Credentials authentication error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isBlocked = user.isBlocked;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isBlocked = token.isBlocked;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };