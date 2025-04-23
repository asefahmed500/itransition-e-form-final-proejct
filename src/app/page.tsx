"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Flame,  } from "lucide-react";
import FormCard from "@/components/forms/FormCard";
import { IForm } from '@/lib/models/Form';

export default function HomePage() {
  const [popularForms, setPopularForms] = useState<IForm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IForm[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const fetchPopularForms = async () => {
      try {
        const response = await fetch("/api/forms?public=true&sort=popular&limit=12");
        if (response.ok) {
          const data = await response.json();
          setPopularForms(data);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(data.map((form: IForm) => form.category))
          ) as string[];
          setCategories(['all', ...uniqueCategories]);
        }
      } catch (error) {
        console.error("Error fetching popular forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularForms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(() => {
      searchForms(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchForms = async (query: string) => {
    try {
      const response = await fetch(`/api/forms/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Error searching forms:", error);
    }
  };

  const filteredForms = selectedCategory === "all" 
    ? popularForms 
    : popularForms.filter(form => form.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <div className="bg-white py-16 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">
            Create and share your forms with ease
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Build beautiful forms that look great on any device. Free and easy to use.
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search public forms..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Results */}
        {showSearchResults && (
          <div className="mb-12 bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Search className="h-6 w-6 mr-2 text-blue-500" />
                Results for &quot;{searchQuery}&quot;
              </h2>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }} 
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((form) => (
                  <FormCard key={form._id.toString()} form={form} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No forms found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* Category Filter */}
        {!showSearchResults && (
          <div className="mb-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Browse by category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Forms */}
        {!showSearchResults && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Flame className="h-6 w-6 mr-2 text-blue-500" />
                Popular Forms
              </h2>
              <Link 
                href="/dashboard/explore" 
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                See more <span className="ml-1">→</span>
              </Link>
            </div>
            
            {filteredForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredForms.map((form) => (
                  <FormCard key={form._id.toString()} form={form} showActions={false} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No popular forms in this category</p>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-8 md:p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Ready to create your own form?
              </h2>
              <p className="text-gray-600 mb-6">
                Join thousands of users who are building beautiful forms with our easy-to-use form builder.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create a Form
                </Link>
                <Link
                  href="/dashboard/explore"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Explore Templates
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}