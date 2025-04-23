"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { ClipboardList } from "lucide-react";
import { ITemplate } from '@/lib/models/Template';

export default function RecentTemplates() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<(ITemplate & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`/api/templates?userId=${session?.user?.id}&limit=5`);
        const data = await res.json();
        if (res.ok) {
          setTemplates(data);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchTemplates();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <ClipboardList className="h-5 w-5 mr-2" />
        Recent Templates
      </h2>
      
      {templates.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No templates created yet</p>
      ) : (
        <ul className="space-y-3">
          {templates.map((template) => (
            <li key={template._id as string}>
              <Link
                href={`/dashboard/templates/${template._id}`}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
              >
                <span className="truncate">{template.title}</span>
                <span className="text-sm text-gray-500">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      
      {templates.length > 0 && (
        <div className="mt-4 text-right">
          <Link
            href="/dashboard/templates"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all templates →
          </Link>
        </div>
      )}
    </div>
  );
}