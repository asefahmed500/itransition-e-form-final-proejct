import Link from "next/link";

export default function CreateTemplateButton() {
  return (
    <Link
      href="/dashboard/templates/new"
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
    >
      <span className="mr-1">+</span> Create Template
    </Link>
  );
}