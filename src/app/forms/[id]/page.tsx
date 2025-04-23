"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { IForm, IQuestion } from '@/lib/models/Form';

export default function FormViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<IForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | number | readonly string[] | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${id}`);
        const data = await res.json();
        if (res.ok) {
          setForm(data);
          const initialAnswers: Record<string, string | string[] | number> = {};
          data.questions.forEach((q: IQuestion) => {
            if (q.type === 'checkbox') {
              initialAnswers[q.id] = [];
            } else {
              initialAnswers[q.id] = '';
            }
          });
          setAnswers(initialAnswers);
        } else {
          throw new Error(data.error || "Failed to fetch form");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id, router]);

  const handleAnswerChange = (questionId: string, value: string | number | readonly string[] | undefined) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] as readonly string[] : [];
      return {
        ...prev,
        [questionId]: checked
          ? [...currentAnswers, option]
          : currentAnswers.filter((item: string) => item !== option)
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!session?.user) {
      toast.error("Please login to submit the form");
      setSubmitting(false);
      return;
    }

    try {
      if (form) {
        const requiredQuestions = form.questions.filter(q => q.required);
        for (const question of requiredQuestions) {
          const answer = answers[question.id];
          if (!answer || (Array.isArray(answer) && answer.length === 0)) {
            throw new Error(`Please answer the required question: ${question.question}`);
          }
        }
      }

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: id,
          answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
        }),
      });

      if (response.ok) {
        toast.success("Response submitted successfully!");
        router.push("/dashboard");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit response");
      }
    } catch (error: unknown) {
      console.error("Error submitting response:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!form) {
    return <div className="text-center py-12">Form not found</div>;
  }

  if (form.requireLogin && !session?.user) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-xl font-semibold mb-4">Login Required</h1>
          <p className="text-gray-600 mb-4">You must be signed in to fill out this form.</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">Click here to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        {form.description && (
          <div className="prose prose-sm max-w-none mb-6" dangerouslySetInnerHTML={{ __html: form.description }} />
        )}

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

              {question.type === 'text' && (
                <input
                  type="text"
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={question.required}
                />
              )}

              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.id}-${option}`}
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => handleAnswerChange(question.id, option)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        required={question.required && !answers[question.id]}
                      />
                      <label htmlFor={`${question.id}-${option}`} className="ml-2 block text-sm text-gray-700">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${question.id}-${option}`}
                        name={question.id}
                        value={option}
                        checked={Array.isArray(answers[question.id]) &&
                          (answers[question.id] as readonly string[]).includes(option)}
                        onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`${question.id}-${option}`} className="ml-2 block text-sm text-gray-700">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'dropdown' && question.options && (
                <select
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={question.required}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {question.type === 'date' && (
                <input
                  type="date"
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={question.required}
                />
              )}

              {question.type === 'time' && (
                <input
                  type="time"
                  value={answers[question.id] as string || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={question.required}
                />
              )}

              {question.type === 'rating' && (
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, star)}
                      className={`text-2xl ${
                        typeof answers[question.id] === 'number' &&
                        (answers[question.id] as number) >= star
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || (form.requireLogin && !session?.user)}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                submitting || (form.requireLogin && !session?.user) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
