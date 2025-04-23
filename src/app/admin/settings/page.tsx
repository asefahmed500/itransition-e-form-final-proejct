"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: ""
  });

  // Form state for name update
  const [newName, setNewName] = useState("");
  
  // Redirect if not admin or not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
      toast.error("You don't have permission to access admin settings");
    }
  }, [status, session, router]);

  // Fetch user data when session is available
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserData({
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || ""
      });
      setNewName(session.user.name || "");
    }
  }, [session, status]);

  // Handle name update
  const handleUpdateName = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (newName.trim() === "") {
      toast.error("Name cannot be empty");
      return;
    }

    if (newName === userData.name) {
      toast.success("No changes to save");
      return;
    }

    setUpdating(true);
    try {
      // Option 1: Using your custom API route
      /* 
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }
      */

      // Option 2: Using NextAuth's update method directly
      await update({ name: newName });
      
      setUserData({ ...userData, name: newName });
      toast.success("Profile updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while updating profile";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your admin account information.
          </p>
        </header>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Account Information
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your personal details and account status.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {userData.role}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {userData.email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <form onSubmit={handleUpdateName} className="flex items-start space-x-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 max-w-lg px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Your name"
                    />
                    <button
                      type="submit"
                      disabled={updating || newName === userData.name}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        updating || newName === userData.name ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {updating ? "Saving..." : "Save"}
                    </button>
                  </form>
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">
                  Your email and role cannot be changed. For any additional changes, please contact the system administrator.
                </p>
              </div>
            </dl>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Security</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage your security settings.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-4">
              <button
                onClick={() => router.push("/admin/change-password")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Last login information */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Account Activity</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Information about your recent account activity.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last sign in</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {new Date().toLocaleString()} {/* Replace with actual last login time if available */}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}