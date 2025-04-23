"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const navItems =[
    { href: "/admin/dashboard", name: "Dashboard", icon: "🏠" },
    { href: "/admin/users", name: "User Management", icon: "👥" },
    { href: "/admin/forms", name: "Forms Management", icon: "📝" },
    { href: "/admin/responses", name: "Responses Management", icon: "📋" },
    ...(role === "super-admin"
      ? [{ href: "/admin/admins", name: "Admin Management", icon: "🛡️" }]
      : []),
    { href: "/admin/settings", name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded-md ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full flex items-center p-2 rounded-md hover:bg-gray-100"
        >
          <span className="mr-2">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}