"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface IFormOwner {
  _id: string;
  name?: string | null;
  email?: string | null;
}

interface IFormListItem {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  isPublic: boolean;
  createdAt: string;
  owner: IFormOwner | null;
  responses: string[];
}

export default function FormsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [forms, setForms] = useState<IFormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super-admin"
    ) {
      router.push("/");
    } else if (status === "authenticated") {
      fetchForms();
    }
  }, [status, session, router]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/forms");
      
      if (!response.ok) {
        throw new Error("Failed to fetch forms");
      }
      
      const data = await response.json();
      // Ensure all forms have at least a minimal owner object
      const cleanedForms = data.forms.map((form: IFormListItem) => ({
        ...form,
        owner: form.owner || { _id: 'unknown', name: null, email: null }
      }));
      setForms(cleanedForms);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/forms/${formId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete form");
      }
      
      setForms(forms.filter(form => form._id !== formId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const filteredForms = forms.filter(form => {
    const titleMatch = form.title.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const ownerNameMatch = form.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const ownerEmailMatch = form.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    
    return titleMatch || descMatch || ownerNameMatch || ownerEmailMatch;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">Forms Management</h1>
          <p className="text-gray-600 mt-2">
            {forms.length} {forms.length === 1 ? "form" : "forms"} total
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search forms..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No forms found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new form.</p>
            <div className="mt-6">
              <Link
                href="/admin/forms/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Form
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredForms.map((form) => (
                  <tr key={form._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-blue-100 text-blue-600">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <Link 
                            href={`/admin/forms/${form._id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900"
                          >
                            {form.title}
                          </Link>
                          <p className="text-sm text-gray-500 line-clamp-1">{form.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{form.owner?.name || "Unknown User"}</div>
                      <div className="text-sm text-gray-500">{form.owner?.email || "No email"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        form.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {form.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        form.isPublic ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {form.isPublic ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.responses.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(form.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/forms/${form._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteForm(form._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}