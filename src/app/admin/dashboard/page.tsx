import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserStats from "@/components/admin/UserStats";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login?callbackUrl=/admin/dashboard");
  }

  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-6 text-gray-600">
        Welcome back, {session.user.name}. You have admin privileges.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UserStats />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Users
          </a>
          {session.user.role === "super-admin" && (
            <a
              href="/admin/admins"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Manage Admins
            </a>
          )}
        </div>
      </div>
    </div>
  );
}