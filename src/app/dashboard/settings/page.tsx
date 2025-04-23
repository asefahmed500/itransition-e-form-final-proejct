"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Last login would typically come from your database
  const [lastLogin] = useState(new Date().toLocaleString());

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      
      // If you have lastLogin in your session, you would set it here
      // setLastLogin(session.user.lastLogin || new Date().toLocaleString());
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email
        }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        // Update the session to reflect changes
        await update({
          ...session,
          user: {
            ...session?.user,
            name,
            email
          }
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your personal information and account preferences.
        </p>
      </header>

      <div className="space-y-8">
        {/* Profile Information Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Profile Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Account Activity Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Account Activity</h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
              <p className="mt-1 text-sm text-gray-900">{lastLogin}</p>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
              <p className="mt-1 text-sm text-gray-900 flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session?.user?.role === "admin" 
                    ? "bg-purple-100 text-purple-800" 
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {session?.user?.role === "admin" ? "Administrator" : "Standard User"}
                </span>
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
              <p className="mt-1 text-sm text-gray-900">
                {/* Replace with actual account creation date */}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Security</h2>
          <div className="space-y-4">
            <button 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => window.location.href = '/auth/change-password'}
            >
              Change Password
            </button>
            
            <div className="text-sm text-gray-500 mt-2">
              <p>For security reasons, your password must:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Be at least 8 characters long</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}