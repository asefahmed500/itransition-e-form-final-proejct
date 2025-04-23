"use client";
import Link from "next/link";
import Image from "next/image";
import { IForm } from "@/lib/models/Form";
import { BarChart2, Lock, Globe, Clipboard, Edit, Trash2, Heart, MessageSquare, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Types } from "mongoose";

interface FormCardProps {
  form: IForm;
  onDelete?: (formId: string) => void;
  showActions?: boolean;
  onLikeToggle?: (formId: string, isLiked: boolean) => void;
}

type CommentUser = {
  _id: Types.ObjectId | string;
  name?: string;
  email?: string;
  image?: string;
};

export default function FormCard({ form, onDelete, showActions = true, onLikeToggle }: FormCardProps) {
  const { data: session } = useSession();
  // Safely handle form data
  const formId = form._id ? (typeof form._id === 'string' ? form._id : form._id.toString()) : '';
  const formOwner = form.owner ? (typeof form.owner === 'string' ? form.owner : form.owner.toString()) : '';
  const formLikes = Array.isArray(form.likes) ? form.likes : [];
  const formComments = Array.isArray(form.comments) ? form.comments : [];
  const formResponses = Array.isArray(form.responses) ? form.responses : [];
  const formQuestions = Array.isArray(form.questions) ? form.questions : [];

  const [isLiked, setIsLiked] = useState(
    session?.user?.id ? formLikes.some(id => {
      const idStr = id ? (typeof id === 'string' ? id : id.toString()) : '';
      return idStr === session.user.id;
    }) : false
  );
  const [likesCount, setLikesCount] = useState(formLikes.length);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(formComments);
  const [newComment, setNewComment] = useState("");

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formId) {
      toast.error("Invalid form ID");
      return;
    }
    
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        const response = await fetch(`/api/forms/${formId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          if (onDelete) {
            onDelete(formId);
          }
          toast.success("Form deleted successfully");
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to delete form");
        }
      } catch (error) {
        console.error("Error deleting form:", error);
        toast.error("Failed to delete form");
      }
    }
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formId) {
      toast.error("Invalid form ID");
      return;
    }
    
    if (!session?.user) {
      toast.error("Please sign in to like forms");
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        if (onLikeToggle) {
          onLikeToggle(formId, data.isLiked);
        }
      } else {
        throw new Error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!formId) {
      toast.error("Invalid form ID");
      return;
    }
    
    if (!session?.user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data]);
        setNewComment("");
        toast.success("Comment added");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const isPopulatedUser = (user: unknown): user is CommentUser => {
    return typeof user === 'object' && user !== null && 'name' in user;
  };

  // Safe comment ID getter
  const getCommentId = (comment: { _id?: Types.ObjectId | string }) => {
    if (!comment || !comment._id) return `comment-${Math.random()}`;
    return typeof comment._id === 'string' ? comment._id : comment._id.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg truncate">{form.title}</h3>
          <div className="flex space-x-1">
            {form.isPublic ? (
              <Globe className="h-4 w-4 text-blue-500" aria-label="Public" />
            ) : (
              <Lock className="h-4 w-4 text-gray-500" aria-label="Private" />
            )}
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {form.description || "No description"}
        </p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{formQuestions.length} questions</span>
          <span>{formResponses.length} responses</span>
        </div>
      </div>
      
      {/* Like and Comment section */}
      <div className="border-t border-gray-200 px-4 py-2">
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleLike}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
          >
            <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length}</span>
          </button>
        </div>
        
        {showComments && (
          <div className="mt-3 space-y-3">
            <div className="max-h-40 overflow-y-auto space-y-2">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={getCommentId(comment)} className="flex items-start space-x-2">
                    <div className="flex-shrink-0 bg-gray-200 rounded-full p-1">
                      {isPopulatedUser(comment.user) ? (
                        <Image
                          src={comment.user.image || '/default-avatar.png'}
                          alt={comment.user.name || 'User'}
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">
                        {isPopulatedUser(comment.user) ? comment.user.name : 'Anonymous'}
                      </p>
                      <p className="text-gray-600">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No comments yet</p>
              )}
            </div>
            
            {session?.user && (
              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm px-3 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Post
                </button>
              </form>
            )}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        {showActions && session?.user?.id === formOwner && (
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/forms/${formId}`}
              className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-200"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-gray-200"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <div className="flex space-x-4">
          <Link
            href={formId ? `/forms/${formId}` : "#"}
            className={`text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center ${!formId ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Clipboard className="h-4 w-4 mr-1" />
            Submit
          </Link>
          {showActions && (
            <Link
              href={formId ? `/dashboard/forms/${formId}/responses` : "#"}
              className={`text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center ${!formId ? 'pointer-events-none opacity-50' : ''}`}
            >
              <BarChart2 className="h-4 w-4 mr-1" />
              Responses
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}