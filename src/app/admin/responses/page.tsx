"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface IResponse {
  _id: string;
  form: {
    _id: string;
    title: string;
  } | null;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
}

export default function ResponsesManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [responses, setResponses] = useState<IResponse[]>([]);
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
      fetchResponses();
    }
  }, [status, session, router]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/responses");
      
      if (!response.ok) {
        throw new Error("Failed to fetch responses");
      }
      
      const data = await response.json();
      setResponses(data.responses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm("Are you sure you want to delete this response?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/responses/${responseId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete response");
      }
      
      setResponses(responses.filter(r => r._id !== responseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleViewResponse = (responseId: string) => {
    router.push(`/admin/responses/${responseId}?mode=view`);
  };

  const handleEditResponse = (responseId: string) => {
    router.push(`/admin/responses/${responseId}?mode=edit`);
  };

  const filteredResponses = responses.filter(response => 
    response.form?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800">Responses Management</h1>
          <p className="text-gray-600 mt-2">
            {responses.length} {responses.length === 1 ? "response" : "responses"} total
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
            placeholder="Search responses..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResponses.map((response) => (
                <tr key={response._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {response.form ? (
                      <Link 
                        href={`/admin/forms/${response.form._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {response.form.title}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Form not available</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {response.user ? (
                      <>
                        <div className="text-sm text-gray-900">{response.user.name}</div>
                        <div className="text-sm text-gray-500">{response.user.email}</div>
                      </>
                    ) : (
                      <span className="text-gray-500">Anonymous</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(response.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleViewResponse(response._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        aria-label={`View response for ${response.form?.title || 'this form'}`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditResponse(response._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label={`Edit response for ${response.form?.title || 'this form'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteResponse(response._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Delete response for ${response.form?.title || 'this form'}`}
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
    </div>
  );
}