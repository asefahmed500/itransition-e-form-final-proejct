"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import FormCard from "@/components/forms/FormCard";
import TemplateCard from "@/components/templates/TemplateCard";
import { IForm } from '@/lib/models/Form';
import { ITemplate } from '@/lib/models/Template';


export default function PopularPage() {
  useSession();
  const [popularForms, setPopularForms] = useState<IForm[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<ITemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("forms");

  useEffect(() => {
    const fetchPopularItems = async () => {
      try {
        const [formsRes, templatesRes] = await Promise.all([
          fetch(`/api/forms?public=true&sort=popular`),
          fetch(`/api/templates?public=true&sort=popular`)
        ]);

        if (formsRes.ok) {
          const formsData = await formsRes.json();
          setPopularForms(formsData);
        }

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setPopularTemplates(templatesData);
        }
      } catch (error) {
        console.error("Error fetching popular items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularItems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Popular</h1>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "forms"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("forms")}
          >
            Forms
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "templates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("templates")}
          >
            Templates
          </button>
        </div>
      </div>

      {activeTab === "forms" ? (
        <div>
          {popularForms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No popular forms found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularForms.map((form) => (
                <FormCard key={form._id.toString()} form={form} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {popularTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No popular templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTemplates.map((template) => (
                <TemplateCard key={template._id} template={template} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}