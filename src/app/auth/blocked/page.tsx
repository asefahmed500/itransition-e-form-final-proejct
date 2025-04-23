"use client";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function BlockedPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically sign out blocked users
    signOut({ redirect: false });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Account Blocked</h1>
        <p className="mb-6 text-gray-600">
          Your account has been blocked by an administrator. Please contact support for assistance.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}