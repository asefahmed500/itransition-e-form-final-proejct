
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface IAnswer {
  questionId: string;
  answer: string | string[] | number;
}

interface IResponse {
  _id: string;
  form: {
    _id: string;
    title: string;
    questions: Array<{
      id: string;
      question: string;
      type: string;
      options?: string[];
    }>;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  answers: IAnswer[];
  submittedAt: string;
}

export default function ResponseDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const mode = searchParams.get('mode') || 'view'; // Default to view mode
  
  const [response, setResponse] = useState<IResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(mode === 'edit');
  const [editedAnswers, setEditedAnswers] = useState<IAnswer[]>([]);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/responses/${id}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch response");
        }
        
        const data = await res.json();
        setResponse(data.response);
        setEditedAnswers([...data.response.answers]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super-admin"
    ) {
      router.push("/");
    } else if (status === "authenticated" && id) {
      fetchResponse();
      // Set editing mode based on URL parameter
      setEditing(mode === 'edit');
    }
  }, [status, session, router, id, mode]);

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    const updatedAnswers = editedAnswers.map(answer => 
      answer.questionId === questionId ? { ...answer, answer: value } : answer
    );
    setEditedAnswers(updatedAnswers);
  };

  const saveChanges = async () => {
    try {
      const res = await fetch(`/api/admin/responses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: editedAnswers }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update response");
      }
      
      setResponse(prev => prev ? { ...prev, answers: editedAnswers } : null);
      setEditing(false);
      alert("Response updated successfully");
      // Go back to view mode after saving
      router.push(`/admin/responses/${id}?mode=view`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const switchToEditMode = () => {
    router.push(`/admin/responses/${id}?mode=edit`);
    setEditing(true);
  };

  const cancelEditing = () => {
    // Reset edited answers to original
    if (response) {
      setEditedAnswers([...response.answers]);
    }
    router.push(`/admin/responses/${id}?mode=view`);
    setEditing(false);
  };

  const deleteResponse = async () => {
    if (!confirm("Are you sure you want to delete this response?")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/responses/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete response");
      }
      
      router.push("/admin/responses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!response) return <div className="p-8 text-center">Response not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {editing ? "Edit Response" : "View Response"}
          </h1>
          <p className="text-gray-600">
            Form: {response.form.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/responses"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Responses
          </Link>
          {!editing && (
            <button
              onClick={switchToEditMode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Response
            </button>
          )}
          <button
            onClick={deleteResponse}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Response
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Response Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Submitted At</p>
              <p>{new Date(response.submittedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Submitted By</p>
              <p>{response.user ? `${response.user.name} (${response.user.email})` : "Anonymous"}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Answers</h2>
            {editing && (
              <div className="flex gap-2">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {response.form.questions.map((question) => {
              const answer = response.answers.find(a => a.questionId === question.id);
              const editedAnswer = editedAnswers.find(a => a.questionId === question.id);
              const currentAnswer = editing ? editedAnswer : answer;
              
              return (
                <div key={question.id} className="border rounded-md p-4">
                  <div className="mb-2">
                    <h3 className="font-medium">{question.question}</h3>
                    <p className="text-sm text-gray-500">Type: {question.type}</p>
                  </div>
                  
                  {editing ? (
                    <div>
                      {question.type === "text" && (
                        <input
                          type="text"
                          value={currentAnswer?.answer as string || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      )}
                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div key={option} className="flex items-center">
                              <input
                                type="radio"
                                id={`${question.id}-${option}`}
                                name={question.id}
                                value={option}
                                checked={currentAnswer?.answer === option}
                                onChange={() => handleAnswerChange(question.id, option)}
                                className="mr-2"
                              />
                              <label htmlFor={`${question.id}-${option}`}>{option}</label>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === "checkbox" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`${question.id}-${option}`}
                                checked={Array.isArray(currentAnswer?.answer) && 
                                  (currentAnswer.answer as string[]).includes(option)}
                                onChange={(e) => {
                                  const current = Array.isArray(currentAnswer?.answer) ? 
                                    [...currentAnswer.answer as string[]] : [];
                                  const newValue = e.target.checked
                                    ? [...current, option]
                                    : current.filter(v => v !== option);
                                  handleAnswerChange(question.id, newValue);
                                }}
                                className="mr-2"
                              />
                              <label htmlFor={`${question.id}-${option}`}>{option}</label>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === "dropdown" && question.options && (
                        <select
                          value={currentAnswer?.answer as string || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select an option</option>
                          {question.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <div>
                      {Array.isArray(answer?.answer) ? (
                        <ul className="list-disc pl-5">
                          {(answer.answer as string[]).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{answer?.answer?.toString() || "No answer provided"}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}