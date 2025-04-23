"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ITemplate } from '@/lib/models/Template';
import CreateTemplateButton from "@/components/templates/CreateTemplateButton";
import TemplateCard from "@/components/templates/TemplateCard";

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`/api/templates?userId=${session?.user?.id}`);
        const data = await res.json();
        if (res.ok) {
          setTemplates(data);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchTemplates();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with title and button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <CreateTemplateButton />
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No templates found</p>
          <CreateTemplateButton />
        </div>
      ) : (
        <div>
          {/* Grid of template cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {templates.map((template) => (
              <TemplateCard key={template._id} template={template} />
            ))}
          </div>
          
          {/* Add a prominent second button at the bottom */}
          <div className="flex justify-center mt-8 mb-6">
            <CreateTemplateButton />
          </div>
        </div>
      )}
    </div>
  );
}