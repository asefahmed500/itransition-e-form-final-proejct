"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import FormCard from "@/components/forms/FormCard";
import { IForm } from "@/lib/models/Form";

export default function ExplorePage() {
  useSession();
  const [forms, setForms] = useState<IForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(`/api/forms?public=true`);
        const data = await res.json();
        if (res.ok) {
          // Filter out any malformed forms or those missing _id
          const validForms = data.filter((form: Partial<IForm>) => form && form._id);
          setForms(validForms);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(validForms.map((form: IForm) => form.category).filter(Boolean))
          ) as string[];
          setCategories(uniqueCategories);
        } else {
          setError("Failed to fetch forms");
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
        setError("An error occurred while fetching forms");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const filteredForms = selectedCategory === "all" 
    ? forms 
    : forms.filter(form => form.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Explore Public Forms</h1>
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No public forms found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <FormCard 
              key={form._id?.toString() || `form-${form.title}`} 
              form={form} 
            />
          ))}
        </div>
      )}
    </div>
  );
}