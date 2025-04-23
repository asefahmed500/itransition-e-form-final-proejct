"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import { IForm } from '@/lib/models/Form';

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
);

export default function FormEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  useSession();
  const [, setForm] = useState<IForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [category, setCategory] = useState("general");
  const [requireLogin, setRequireLogin] = useState(false);
  
  interface Question {
    id: string;
    type: string;
    question: string;
    required: boolean;
    options?: string[];
  }

  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${id}`);
        const data = await res.json();
        if (res.ok) {
          setForm(data);
          setTitle(data.title);
          setDescription(data.description);
          setIsPublic(data.isPublic);
          setIsPublished(data.isPublished);
          setCategory(data.category);
          setRequireLogin(data.requireLogin || false);
          setQuestions(data.questions);
        } else {
          throw new Error(data.error || "Failed to fetch form");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
        router.push("/dashboard/forms");
      } finally {
        setLoading(false);
      }
    };

    if (id !== "new") {
      fetchForm();
    } else {
      setLoading(false);
      setQuestions([{
        id: crypto.randomUUID(),
        type: "text",
        question: "",
        required: false
      }]);
    }
  }, [id, router]);

  const handleSave = async () => {
    try {
      const method = id === "new" ? "POST" : "PUT";
      const url = id === "new" ? "/api/forms" : `/api/forms/${id}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          questions,
          isPublic,
          isPublished,
          category,
          requireLogin
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Form saved successfully");
        // Redirect to forms list page after save
        router.push("/dashboard/forms");
        
        // Optional: Refresh the forms list page
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to save form");
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Form deleted successfully");
        router.push("/dashboard/forms");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete form");
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form");
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      id: crypto.randomUUID(),
      type: "text",
      question: "",
      required: false
    }]);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: string, value: string | boolean | string[]) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    setQuestions(newQuestions);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {id === "new" ? "Create New Form" : "Edit Form"}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          {id !== "new" && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Form Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter form title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Markdown supported)
          </label>
          <MDEditor
            value={description}
            onChange={(val) => setDescription(val || "")}
            height={200}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Public Form</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Published</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={requireLogin}
                onChange={(e) => setRequireLogin(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Require Login</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="education">Education</option>
              <option value="business">Business</option>
              <option value="health">Health</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Question {index + 1}</h3>
                <button
                  onClick={() => removeQuestion(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(index, "question", e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={question.type}
                  onChange={(e) => updateQuestion(index, "type", e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {(question.type === "multiple-choice" || 
                question.type === "checkbox" || 
                question.type === "dropdown") && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (one per line)
                  </label>
                  <textarea
                    value={question.options?.join("\n") || ""}
                    onChange={(e) => updateQuestion(index, "options", e.target.value.split("\n"))}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter options, one per line"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required</span>
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Add Question
          </button>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Form
        </button>
      </div>
    </div>
  );
}