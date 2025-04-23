"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import ResponseCard from "@/components/responses/ResponseCard";
import { IForm,  } from "@/lib/models/Form";
import { IResponse } from "@/lib/models/Response";

export default function FormResponsesPage() {
  const { id } = useParams();
  const router = useRouter();
  useSession();
  const [form, setForm] = useState<IForm | null>(null);
  const [responses, setResponses] = useState<IResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formRes, responsesRes] = await Promise.all([
          fetch(`/api/forms/${id}`),
          fetch(`/api/responses?formId=${id}`)
        ]);

        if (!formRes.ok || !responsesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [formData, responsesData] = await Promise.all([
          formRes.json(),
          responsesRes.json()
        ]);

        setForm(formData);
        setResponses(
          responsesData.map((response: IResponse) => ({
            ...response,
            user: response.user ? { ...response.user, _id: response.user._id.toString() } : undefined,
          }))
        );
      } catch (error) {
        console.error("Error fetching responses:", error);
        toast.error("Failed to load responses");
        router.push("/dashboard/forms");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!form) {
    return <div>Form not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Responses for {form.title}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/dashboard/forms/${id}`)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Back to Form
          </button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No responses yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => (
            <ResponseCard
              key={response._id}
              response={response}
              formQuestions={form.questions}
            />
          ))}
        </div>
      )}
    </div>
  );
}