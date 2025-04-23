"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { FileText } from "lucide-react";
import { IForm } from '@/lib/models/Form';

export default function RecentForms() {
  const { data: session } = useSession();
  const [forms, setForms] = useState<IForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(`/api/forms?userId=${session?.user?.id}&limit=5`);
        const data = await res.json();
        if (res.ok) {
          setForms(data);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchForms();
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
        <FileText className="h-5 w-5 mr-2" />
        Recent Forms
      </h2>
      
      {forms.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No forms created yet</p>
      ) : (
        <ul className="space-y-3">
          {forms.map((form) => (
            <li key={form._id}>
              <Link
                href={`/dashboard/forms/${form._id}`}
                className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
              >
                <span className="truncate">{form.title}</span>
                <span className="text-sm text-gray-500">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      
      {forms.length > 0 && (
        <div className="mt-4 text-right">
          <Link
            href="/dashboard/forms"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all forms →
          </Link>
        </div>
      )}
    </div>
  );
}