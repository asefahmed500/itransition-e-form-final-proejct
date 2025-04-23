"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { IForm } from "@/lib/models/Form";
import CreateFormButton from "@/components/forms/CreateFormButton";
import FormCard from "@/components/forms/FormCard";
import { Types } from "mongoose";
import { Edit, Trash2, Loader2, BarChart2, ExternalLink } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function FormsPage() {
  const { data: session, status } = useSession();
  const [forms, setForms] = useState<IForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(`/api/forms?userId=${session?.user?.id}`);
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
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [session, status]);

  // Helper function to safely get ID string
  const getIdString = (id: Types.ObjectId | string | undefined): string => {
    if (!id) return '';
    return typeof id === 'string' ? id : id.toString();
  };

  const handleDelete = async (formId: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        const response = await fetch(`/api/forms/${formId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setForms(forms.filter(form => getIdString(form._id) !== formId));
          toast.success("Form deleted successfully");
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete form");
        }
      } catch (error) {
        console.error("Error deleting form:", error);
        toast.error("Failed to delete form");
      }
    }
  };

  const handleLikeToggle = (formId: string, isLiked: boolean) => {
    if (!session?.user?.id) return;
    
    setForms(prevForms => 
      prevForms.map(form => {
        if (getIdString(form._id) === formId) {
          const updatedLikes = isLiked
            ? [...form.likes, new Types.ObjectId(session.user.id) as Types.ObjectId]
            : form.likes.filter(id => getIdString(id) !== session.user.id);
          
          return {
            ...form,
            likes: updatedLikes
          } as IForm;
        }
        return form;
      })
    );
  };

  const isOwner = (form: IForm) => {
    if (!session?.user?.id) return false;
    
    const ownerId = typeof form.owner === 'object' && form.owner
      ? getIdString(form.owner._id)
      : getIdString(form.owner as Types.ObjectId | string);
      
    return ownerId === session.user.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Forms</h1>
        {session && <CreateFormButton />}
      </div>

      {forms.length > 0 && (
        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'cards' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-l-0 border-gray-200`}
            >
              Table
            </button>
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <p className="text-gray-600 mb-4">
            {session ? "You haven't created any forms yet" : "Please sign in to create forms"}
          </p>
          {session && <CreateFormButton />}
        </div>
      ) : (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <FormCard 
                key={getIdString(form._id) || `form-${form.title}`} 
                form={form} 
                onDelete={handleDelete}
                onLikeToggle={handleLikeToggle}
                showActions={isOwner(form)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responses
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Likes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forms.map((form) => {
                  const formId = getIdString(form._id);
                  return (
                    <tr key={formId || `form-row-${form.title}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{form.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{form.description || "No description"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.questions.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.responses.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${form.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {form.isPublic ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {form.likes.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {formId && (
                            <Link
                              href={`/forms/${formId}`}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                              title="Submit Form"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                          
                          {formId && isOwner(form) && (
                            <>
                              <Link
                                href={`/dashboard/forms/${formId}`}
                                className="text-indigo-600 hover:text-indigo-800 flex items-center"
                                title="Edit Form"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDelete(formId)}
                                className="text-red-600 hover:text-red-800 flex items-center"
                                title="Delete Form"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {formId && (
                            <Link
                              href={`/dashboard/forms/${formId}/responses`}
                              className="text-gray-600 hover:text-gray-800 flex items-center"
                              title="View Responses"
                            >
                              <BarChart2 className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}