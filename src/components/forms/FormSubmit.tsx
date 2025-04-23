"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface Question {
  id: string;
  question: string;
  description?: string;
  type: 'text' | 'multiple-choice' | 'checkbox' | 'dropdown' | 'date' | 'time' | 'rating';
  options?: string[];
  required: boolean;
}

interface Form {
  _id: string;
  questions: Question[];
}

type AnswerValue = string | string[] | number | null;

export default function FormSubmit({ form }: { form: Form }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      toast.error("You must be logged in to submit this form");
      return;
    }

    setSubmitting(true);
    try {
      // Validate required questions
      const requiredQuestions = form.questions.filter(q => q.required);
      for (const question of requiredQuestions) {
        const answer = answers[question.id];
        if (
          answer === null || 
          answer === undefined || 
          answer === '' ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          throw new Error(`Please answer the required question: ${question.question}`);
        }
      }

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          form: form._id,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
          }))
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit form");
      }

      toast.success("Form submitted successfully!");
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {question.description && (
            <p className="text-sm text-gray-500">{question.description}</p>
          )}
          {renderQuestionInput(question, answers[question.id], handleAnswerChange)}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
          submitting ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {submitting ? "Submitting..." : "Submit Form"}
      </button>
    </form>
  );
}

function renderQuestionInput(
  question: Question, 
  value: AnswerValue, 
  onChange: (id: string, value: AnswerValue) => void
) {
  switch (question.type) {
    case 'text':
      return (
        <input
          type="text"
          value={value as string || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={question.required}
        />
      );
    case 'multiple-choice':
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option} className="flex items-center">
              <input
                type="radio"
                id={`${question.id}-${option}`}
                name={question.id}
                value={option}
                checked={value === option}
                onChange={() => onChange(question.id, option)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                required={question.required && !value}
              />
              <label htmlFor={`${question.id}-${option}`} className="ml-2 block text-sm text-gray-700">
                {option}
              </label>
            </div>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                id={`${question.id}-${option}`}
                value={option}
                checked={Array.isArray(value) && value.includes(option)}
                onChange={(e) => {
                  const newValue = Array.isArray(value) ? [...value] : [];
                  if (e.target.checked) {
                    newValue.push(option);
                  } else {
                    const index = newValue.indexOf(option);
                    if (index > -1) {
                      newValue.splice(index, 1);
                    }
                  }
                  onChange(question.id, newValue);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`${question.id}-${option}`} className="ml-2 block text-sm text-gray-700">
                {option}
              </label>
            </div>
          ))}
        </div>
      );
    case 'dropdown':
      return (
        <select
          value={value as string || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={question.required}
        >
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          value={value as string || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={question.required}
        />
      );
    case 'time':
      return (
        <input
          type="time"
          value={value as string || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={question.required}
        />
      );
    case 'rating':
      return (
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(question.id, rating)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                value === rating 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
      );
    default:
      return null;
  }
}