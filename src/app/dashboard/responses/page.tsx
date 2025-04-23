"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ResponseCard from "@/components/responses/ResponseCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { IForm } from '@/lib/models/Form';
import { IResponse } from "@/lib/models/Response";

export default function ResponsesPage() {
  const { data: session } = useSession();
  const [responses, setResponses] = useState<IResponse[]>([]);
  const [forms, setForms] = useState<IForm[]>([] as IForm[]);
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalResponses: 0,
    todayResponses: 0,
    avgResponses: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch forms created by the user
        const formsRes = await fetch(`/api/forms?userId=${session?.user?.id}`);
        
        if (!formsRes.ok) {
          throw new Error(`Failed to fetch forms: ${formsRes.status}`);
        }
        
        const formsData = await formsRes.json();
        setForms(formsData);
        
        // Calculate stats
        const totalResponses = formsData.reduce((acc: number, form: IForm) => 
          acc + (form.responses?.length || 0), 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // For accurate today's responses, we'd need to fetch and filter actual responses
        // This is a placeholder calculation
        const todayResponses = Math.round(totalResponses * 0.2); // Simplified estimate
        
        const avgResponses = formsData.length > 0 
          ? totalResponses / formsData.length 
          : 0;
        
        setStats({
          totalResponses,
          todayResponses,
          avgResponses: Math.round(avgResponses * 10) / 10
        });
        
        // Fetch all responses if we have forms
        if (formsData.length > 0) {
          await fetchResponses(formsData[0]._id);
          setSelectedForm(formsData[0]._id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchResponses = async (formId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/responses?formId=${formId}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch responses: ${res.status}`);
      }
      
      const data = await res.json();
      setResponses(data);
    } catch (error) {
      console.error("Error fetching responses:", error);
      setError(error instanceof Error ? error.message : "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = async (formId: string) => {
    setSelectedForm(formId);
    await fetchResponses(formId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-700">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => selectedForm && fetchResponses(selectedForm)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Responses</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard 
          title="Total Responses" 
          value={stats.totalResponses.toString()} 
          icon="📊" 
          trend="up" 
          trendValue="12%"
        />
        <StatsCard 
          title="Today's Responses" 
          value={stats.todayResponses.toString()} 
          icon="🆕" 
          trend="up" 
          trendValue="5%"
        />
        <StatsCard 
          title="Avg per Form" 
          value={stats.avgResponses.toString()} 
          icon="📝" 
          trend="steady" 
          trendValue="0%"
        />
      </div>

      {/* Form Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Form
        </label>
        <select
          value={selectedForm}
          onChange={(e) => handleFormChange(e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          {forms.map((form) => (
            <option key={form._id} value={form._id}>
              {form.title}
            </option>
          ))}
        </select>
      </div>

      {/* Responses List */}
      {responses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No responses found for this form</p>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => (
            <ResponseCard 
              key={response._id} 
              response={response} 
              formQuestions={forms.find(f => 
                f._id.toString() === (typeof response.form === 'string' ? 
                  response.form : response.form._id?.toString())
              )?.questions || []} 
            />
          ))}
        </div>
      )}
    </div>
  );
}