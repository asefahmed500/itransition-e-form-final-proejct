"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  // Star,
  Search,
  MessageSquare,
  Settings,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "My Forms",
      href: "/dashboard/forms",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Templates",
      href: "/dashboard/templates",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      name: "Explore",
      href: "/dashboard/explore",
      icon: <Search className="h-5 w-5" />,
    },
    // {
    //   name: "Popular",
    //   href: "/dashboard/popular",
    //   icon: <Star className="h-5 w-5" />,
    // },
    {
      name: "Responses",
      href: "/dashboard/responses",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Persistent open button (shown when sidebar is closed) */}
      {!isOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 flex-col fixed inset-y-0 bg-white border-r transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-blue-600">FormBuilder</h1>
            {/* Close button (visible on all screens) */}
            <button
              className="p-1 rounded-md hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Overlay for mobile (shown when sidebar is open on mobile) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}