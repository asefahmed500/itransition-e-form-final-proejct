// /components/admin/UserStats.tsx
"use client";
import { useEffect, useState } from "react";

export default function UserStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          throw new Error(data.error || "Failed to fetch stats");
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow animate-pulse h-32"
          ></div>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
        <p className="mt-2 text-3xl font-bold text-blue-600">
          {stats.totalUsers}
        </p>
        <p className="mt-1 text-sm text-gray-500">All registered users</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
        <p className="mt-2 text-3xl font-bold text-green-600">
          {stats.activeUsers}
        </p>
        <p className="mt-1 text-sm text-gray-500">Not blocked</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Admins</h3>
        <p className="mt-2 text-3xl font-bold text-purple-600">
          {stats.admins}
        </p>
        <p className="mt-1 text-sm text-gray-500">Admin users</p>
      </div>
    </>
  );
}