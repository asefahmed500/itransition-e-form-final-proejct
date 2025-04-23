
"use client";
import Link from "next/link";

export default function CreateFormButton() {
  return (
    <Link 
      href="/dashboard/forms/new" 
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Create New Form
    </Link>
  );
}