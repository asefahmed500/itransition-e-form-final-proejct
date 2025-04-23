"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ITemplate } from "@/lib/models/Template";

// Lazy load the markdown editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function TemplateEditorPage() {
  const { id } = useParams();
  const router = useRouter();

  const [, setTemplate] = useState<ITemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [category, setCategory] = useState("general");

  interface Question {
    id: string;
    type: string;
    question: string;
    required: boolean;
    options?: string[];
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newOption, setNewOption] = useState(""); // For easier option adding

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${id}`);
        const data = await res.json();
        if (res.ok) {
          setTemplate(data);
          setTitle(data.title);
          setDescription(data.description);
          setIsPublic(data.isPublic);
          setCategory(data.category || "general");
          setQuestions(data.questions || []);
        } else {
          throw new Error(data.error || "Failed to fetch template");
        }
      } catch (error) {
        console.error("Error fetching template:", error);
        toast.error("Failed to load template");
        router.push("/dashboard/templates");
      } finally {
        setLoading(false);
      }
    };

    if (id !== "new") {
      fetchTemplate();
    } else {
      setLoading(false);
      setQuestions([
        {
          id: crypto.randomUUID(),
          type: "text",
          question: "",
          required: false,
        },
      ]);
    }
  }, [id, router]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.question.trim()) {
        toast.error("All questions must have text");
        return;
      }
      
      if ((q.type === "multiple-choice" || q.type === "checkbox" || q.type === "dropdown") && 
          (!q.options || q.options.length < 2)) {
        toast.error(`Question "${q.question}" needs at least 2 options`);
        return;
      }
    }

    setSaving(true);
    
    try {
      const method = id === "new" ? "POST" : "PUT";
      const url = id === "new" ? "/api/templates" : `/api/templates/${id}`;

      const payload = {
        title,
        description,
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          required: q.required,
          options: q.options || [],
        })),
        isPublic,
        category,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }

      toast.success("Template saved successfully");
      
      // Redirect to templates dashboard after successful save
      setTimeout(() => {
        router.push("/dashboard/templates");
      }, 500); // Small delay to ensure toast is visible
      
    } catch (error: unknown) {
      console.error("Error saving template:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save template");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted successfully");
        router.push("/dashboard/templates");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete template");
      }
    } catch (error: unknown) {
      console.error("Error deleting template:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to delete template");
      } else {
        toast.error("Failed to delete template");
      }
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        type: "text",
        question: "",
        required: false,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("You must have at least one question");
      return;
    }
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: string, value: string | boolean | string[]) => {
    const newQuestions = [...questions];
    
    // Reset options when changing question type
    if (field === "type" && 
        !["multiple-choice", "checkbox", "dropdown"].includes(value as string) &&
        ["multiple-choice", "checkbox", "dropdown"].includes(newQuestions[index].type)) {
      newQuestions[index].options = [];
    }
    
    // Initialize options array when switching to a type that needs options
    if (field === "type" && 
        ["multiple-choice", "checkbox", "dropdown"].includes(value as string) && 
        !newQuestions[index].options) {
      newQuestions[index].options = [];
    }
    
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    
    setQuestions(newQuestions);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === questions.length - 1)) {
      return;
    }

    const newQuestions = [...questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  // New function to add a single option to a question
  const addOption = (questionIndex: number) => {
    if (!newOption.trim()) {
      toast.error("Option text cannot be empty");
      return;
    }
    
    const newQuestions = [...questions];
    const options = newQuestions[questionIndex].options || [];
    
    if (options.includes(newOption.trim())) {
      toast.error("This option already exists");
      return;
    }
    
    newQuestions[questionIndex].options = [...options, newOption.trim()];
    setQuestions(newQuestions);
    setNewOption("");
    toast.success("Option added successfully");
  };
  
  // New function to remove an option
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    
    // Check if removing would leave less than 2 options for types that need options
    const questionType = newQuestions[questionIndex].type;
    if (["multiple-choice", "checkbox", "dropdown"].includes(questionType) && options.length <= 2) {
      toast.error("These question types require at least 2 options");
      return;
    }
    
    options.splice(optionIndex, 1);
    newQuestions[questionIndex].options = options;
    setQuestions(newQuestions);
    toast.success("Option removed");
  };

  // Duplicate a question
  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion = {
      ...questionToDuplicate,
      id: crypto.randomUUID(),
      question: `${questionToDuplicate.question} (Copy)`,
      options: questionToDuplicate.options ? [...questionToDuplicate.options] : undefined,
    };
    
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicatedQuestion);
    setQuestions(newQuestions);
    toast.success("Question duplicated");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/templates" className="text-blue-600 hover:text-blue-800">
            ← Back to Templates
          </Link>
          <h1 className="text-2xl font-bold">{id === "new" ? "Create New Template" : "Edit Template"}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              "Save Template"
            )}
          </button>
          {id !== "new" && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              disabled={saving}
            >
              Delete Template
            </button>
          )}
        </div>
      </div>

      {/* FORM BODY */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Title, Description, Category, Visibility */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter template title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Markdown supported)</label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <MDEditor value={description} onChange={(val) => setDescription(val || "")} height={200} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                id="isPublicCheckbox"
              />
              <label htmlFor="isPublicCheckbox" className="ml-2 text-sm text-gray-700">
                Make this template public
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="education">Education</option>
                <option value="business">Business</option>
                <option value="health">Health</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>+</span> Add Question
            </button>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                {/* Question header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-800 text-lg">Question {index + 1}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveQuestion(index, "up")}
                      disabled={index === 0}
                      className={`p-1 rounded ${
                        index === 0 ? "text-gray-400" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveQuestion(index, "down")}
                      disabled={index === questions.length - 1}
                      className={`p-1 rounded ${
                        index === questions.length - 1 ? "text-gray-400" : "text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => duplicateQuestion(index)}
                      className="p-1 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50"
                      title="Duplicate question"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                      title="Remove question"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Question fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestion(index, "question", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter question"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(index, "type", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text Answer</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="checkbox">Checkboxes</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="date">Date</option>
                      <option value="time">Time</option>
                      <option value="rating">Rating</option>
                    </select>
                  </div>
                </div>

                {/* Options section with improved UI */}
                {(question.type === "multiple-choice" ||
                  question.type === "checkbox" ||
                  question.type === "dropdown") && (
                  <div className="mb-4 p-4 bg-white border border-gray-200 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Options for &quot;{question.question}&quot;
                    </label>
                    
                    {/* List of current options */}
                    <div className="mb-4">
                      {question.options && question.options.length > 0 ? (
                        <ul className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <li 
                              key={optionIndex} 
                              className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                            >
                              <span>{option}</span>
                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove option"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No options added yet. Add at least 2 options.</p>
                      )}
                    </div>
                    
                    {/* Add new option */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type new option here"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOption(index);
                          }
                        }}
                      />
                      <button
                        onClick={() => addOption(index)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Add Option
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Press Enter to quickly add an option</p>
                  </div>
                )}

                {/* Required checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    id={`required-${index}`}
                  />
                  <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700">
                    Required question
                  </label>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick add question button at the bottom */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <span>+</span> Add Another Question
            </button>
          </div>
        </div>

        {/* Save and cancel buttons at the bottom */}
        <div className="mt-8 flex justify-between">
          <Link 
            href="/dashboard/templates" 
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              "Save Template"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}