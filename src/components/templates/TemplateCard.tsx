import Link from "next/link";
import { Star, MessageSquare, Lock, Globe, Clipboard } from "lucide-react";
import { ITemplate } from "@/lib/models/Template";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface TemplateCardProps {
  template: ITemplate;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const owner = template.owner;

  const handleUseAsForm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/forms/create-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template._id
        }),
      });

      if (response.ok) {
        const newForm = await response.json();
        toast.success('Form created successfully!');
        router.push(`/dashboard/forms/${newForm._id}`);
      } else {
        throw new Error('Failed to create form');
      }
    } catch (error) {
      toast.error('Error creating form from template');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg truncate">{template.title}</h3>
          <div className="flex space-x-1">
            {template.isPublic ? (
              <Globe className="h-4 w-4 text-blue-500" aria-label="Public" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" aria-label="Private" />
            )}
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {template.description || "No description"}
        </p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{template.questions.length} questions</span>
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              {template.likes.length}
            </span>
            <span className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {template.comments.length}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-600 truncate">
          by {typeof owner === "object" && "name" in owner ? String(owner.name) : "email" in owner ? String(owner.email) : "Unknown"}
        </span>
        <div className="flex space-x-2">
          <Link
            href={`/dashboard/templates/${template._id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </Link>
          <button
            onClick={handleUseAsForm}
            disabled={isLoading}
            className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
          >
            {isLoading ? 'Creating...' : (
              <>
                <Clipboard className="h-4 w-4 mr-1" />
                Use as Form
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}