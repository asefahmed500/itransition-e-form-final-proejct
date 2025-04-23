"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface IQuestion {
  id: string;
  type: "text" | "multiple-choice" | "checkbox" | "dropdown" | "date" | "time" | "rating";
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
}

interface IForm {
  _id: string;
  title: string;
  description: string;
  questions: IQuestion[];
  isPublic: boolean;
  isPublished: boolean;
  requireLogin: boolean;
  category: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  responses: string[];
  createdAt: string;
  updatedAt: string;
}

export default function FormDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState<IForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: false,
    isPublished: false,
    requireLogin: false,
    category: "",
  });
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<IQuestion>>({
    type: "text",
    question: "",
    required: false
  });
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    const fetchForm = async () => {
      try {
        if (!id) {
          setError("Form ID is missing");
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(`/api/admin/forms/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch form");
        }

        const data = await response.json();
        setForm(data.form);
        setFormData({
          title: data.form.title,
          description: data.form.description || "",
          isPublic: data.form.isPublic,
          isPublished: data.form.isPublished,
          requireLogin: data.form.requireLogin,
          category: data.form.category,
        });
      } catch (err) {
        console.error("Error fetching form:", err);
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
      fetchForm();
    }
  }, [status, session, router, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        [name]: name === "required" ? (e.target as HTMLInputElement).checked : value
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        [name]: name === "required" ? (e.target as HTMLInputElement).checked : value
      });
    }
  };

  const addOption = () => {
    if (!newOption.trim()) return;

    const updatedOptions = [
      ...(editingQuestion?.options || newQuestion.options || []),
      newOption
    ];

    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        options: updatedOptions
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions
      });
    }

    setNewOption("");
  };

  const removeOption = (index: number) => {
    const updatedOptions = [...(editingQuestion?.options || newQuestion.options || [])];
    updatedOptions.splice(index, 1);

    if (editingQuestion) {
      setEditingQuestion({
        ...editingQuestion,
        options: updatedOptions
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions
      });
    }
  };

  const saveQuestion = () => {
    if (!form) return;

    const questionText = editingQuestion?.question || newQuestion.question || "";

    const questionToSave: IQuestion = {
      id: editingQuestion?.id || Date.now().toString(),
      type: editingQuestion?.type || newQuestion.type || "text",
      question: questionText,
      description: editingQuestion?.description || newQuestion.description,
      options: ["multiple-choice", "checkbox", "dropdown"].includes(editingQuestion?.type || newQuestion.type || "")
        ? editingQuestion?.options || newQuestion.options || []
        : undefined,
      required: editingQuestion?.required || newQuestion.required || false
    };

    const updatedQuestions = editingQuestion
      ? form.questions.map(q => q.id === questionToSave.id ? questionToSave : q)
      : [...form.questions, questionToSave];

    setForm({
      ...form,
      questions: updatedQuestions
    });

    setEditingQuestion(null);
    setNewQuestion({
      type: "text",
      question: "",
      required: false
    });
  };

  const editQuestion = (question: IQuestion) => {
    setEditingQuestion(question);
    setNewQuestion({
      type: question.type,
      question: question.question,
      description: question.description,
      options: question.options ? [...question.options] : undefined,
      required: question.required
    });
  };

  const deleteQuestion = (questionId: string) => {
    if (!form) return;
    if (!confirm("Are you sure you want to delete this question?")) return;

    setForm({
      ...form,
      questions: form.questions.filter(q => q.id !== questionId)
    });
  };

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      if (!id) {
        throw new Error("Form ID is missing");
      }

      const formToSave = {
        title: formData.title,
        description: formData.description,
        isPublic: formData.isPublic,
        isPublished: formData.isPublished,
        requireLogin: formData.requireLogin,
        category: formData.category,
        questions: form?.questions || []
      };

      const response = await fetch(`/api/admin/forms/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update form");
      }

      const data = await response.json();
      
      if (data.form) {
        setForm(data.form);
        setFormData({
          title: data.form.title,
          description: data.form.description || "",
          isPublic: data.form.isPublic,
          isPublished: data.form.isPublished,
          requireLogin: data.form.requireLogin,
          category: data.form.category,
        });
        alert("Form updated successfully");
      }
    } catch (err) {
      console.error("Error saving form:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const deleteForm = async () => {
    if (!confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      return;
    }

    try {
      if (!id) {
        throw new Error("Form ID is missing");
      }

      const response = await fetch(`/api/admin/forms/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete form");
      }

      router.push("/admin/forms");
    } catch (err) {
      console.error("Error deleting form:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return (
    <div className="p-8 text-center">
      <div className="text-red-500 mb-4">{error}</div>
      <Link
        href="/admin/forms"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Back to Forms
      </Link>
    </div>
  );
  if (!form) return (
    <div className="p-8 text-center">
      <div className="mb-4">Form not found</div>
      <Link
        href="/admin/forms"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Back to Forms
      </Link>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Form</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/forms"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Forms
          </Link>
          <button
            onClick={deleteForm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Form
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={saveForm}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold">Form Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 font-semibold">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
                rows={3}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">Category*</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">Owner</label>
              <div className="px-4 py-2 border rounded-md bg-gray-50">
                {form.owner.name} ({form.owner.email})
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublished"
                id="isPublished"
                checked={formData.isPublished}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="isPublished">Published</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                id="isPublic"
                checked={formData.isPublic}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="isPublic">Public</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="requireLogin"
                id="requireLogin"
                checked={formData.requireLogin}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor="requireLogin">Require Login to Submit</label>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Form Questions ({form.questions.length})</h2>

            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-semibold mb-3">
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1">Question Type</label>
                  <select
                    name="type"
                    value={editingQuestion?.type || newQuestion.type}
                    onChange={handleQuestionInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={!!editingQuestion}
                  >
                    <option value="text">Text</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="date">Date</option>
                    <option value="time">Time</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Question Text</label>
                  <input
                    type="text"
                    name="question"
                    value={editingQuestion?.question || newQuestion.question || ""}
                    onChange={handleQuestionInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block mb-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={editingQuestion?.description || newQuestion.description || ""}
                    onChange={handleQuestionInputChange}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={2}
                  />
                </div>

                {["multiple-choice", "checkbox", "dropdown"].includes(editingQuestion?.type || newQuestion.type || "") && (
                  <div>
                    <label className="block mb-1">Options</label>
                    <div className="space-y-2 mb-2">
                      {(editingQuestion?.options || newQuestion.options || []).map((option, idx) => (
                        <div key={idx} className="flex items-center">
                          <span className="mr-2">{idx + 1}.</span>
                          <span className="flex-grow">{option}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        className="flex-grow px-3 py-2 border rounded-md"
                        placeholder="Add new option"
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="required"
                    id="required"
                    checked={editingQuestion?.required || newQuestion.required || false}
                    onChange={handleQuestionInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="required">Required</label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveQuestion}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    {editingQuestion ? "Update Question" : "Add Question"}
                  </button>
                  {editingQuestion && (
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {form.questions.map((question, idx) => (
                <div key={question.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">
                        {idx + 1}. {question.question || <span className="text-gray-400">(Untitled question)</span>}
                      </span>
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                      <div className="text-sm text-gray-500">Type: {question.type}</div>
                      {question.description && (
                        <div className="text-sm text-gray-600 mt-1">{question.description}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editQuestion(question)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {["multiple-choice", "checkbox", "dropdown"].includes(question.type) && question.options && (
                    <div className="mt-2">
                      <div className="text-sm font-medium">Options:</div>
                      <div className="pl-4">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="text-sm">
                            {optIdx + 1}. {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {form.questions.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No questions added yet. Add your first question above.
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}