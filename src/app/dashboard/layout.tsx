// app/dashboard/layout.tsx
"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated") {
      // Redirect admins away from user dashboard
      if (["admin", "super-admin"].includes(session?.user?.role || "")) {
        redirect("/admin/dashboard");
      }
    } else if (status === "unauthenticated") {
      redirect(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, session, pathname]);

  if (status !== "authenticated") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}