"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  FiPlus,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiFolderPlus,
  FiCloud,
} from "react-icons/fi";

export default function SupportTicketButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState("Average");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  const [authStatus, setAuthStatus] = useState<{
    authenticated: boolean;
    loading: boolean;
    message: string;
  }>({ authenticated: false, loading: true, message: "Checking OneDrive status..." });

  const { data: session } = useSession();
  const pathname = usePathname();

  // Forward declaration to avoid hoisting issues
  const silentAuth = useRef<(userId: string) => Promise<void>>(() => Promise.resolve());

  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthStatus((prev) => ({ ...prev, loading: true }));
      const response = await fetch("/api/onedrive/auth/status");

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (!data.authenticated && data.userId) {
        await silentAuth.current?.(data.userId);
        return;
      }

      setAuthStatus({
        authenticated: data.authenticated,
        loading: false,
        message: data.message || "OneDrive status checked",
      });
    } catch (error) {
      console.error("Error checking auth status:", error);
      setAuthStatus({
        authenticated: false,
        loading: false,
        message:
          error instanceof Error ? error.message : "Failed to check authentication",
      });
    }
  }, [silentAuth]);

  // Now redefine silentAuth with access to checkAuthStatus
  const realSilentAuth = useCallback(async (userId: string) => {
    try {
      const response = await fetch("/api/onedrive/auth/silent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        await checkAuthStatus(); // retry after silent auth
      }
    } catch (error) {
      console.error("Silent auth failed:", error);
    }
  }, [checkAuthStatus]);

  // Override the empty silentAuth with real one after both are declared
  silentAuth.current = realSilentAuth;

  useEffect(() => {
    checkAuthStatus();
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 300000); // 5 min
    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  const startAuthFlow = () => {
    try {
      if (!process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID)
        throw new Error("Client ID is not configured");
      if (!process.env.NEXT_PUBLIC_ONEDRIVE_REDIRECT_URI)
        throw new Error("Redirect URI is not configured");

      const authUrl = new URL(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
      );
      authUrl.searchParams.append("client_id", process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("redirect_uri", process.env.NEXT_PUBLIC_ONEDRIVE_REDIRECT_URI);
      authUrl.searchParams.append("scope", "Files.ReadWrite offline_access User.Read");
      authUrl.searchParams.append("prompt", "consent");
      authUrl.searchParams.append("state", `onedrive_auth_${Date.now()}`);

      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("Error starting auth flow:", error);
      setAuthStatus((prev) => ({
        ...prev,
        message:
          error instanceof Error ? error.message : "Failed to start authentication",
      }));
    }
  };

const initializeFolder = async () => {
  if (!authStatus.authenticated) {
    setInitStatus({
      type: "error",
      message: "Please authenticate with OneDrive first",
    });
    return;
  }

  setIsInitializing(true);
  setInitStatus({ type: null, message: null });

  try {
    const response = await fetch("/api/onedrive/init-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session?.user?.id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Folder init API error:', errorData);
      throw new Error(errorData.error || "Failed to initialize folder");
    }

    const result = await response.json();
    setInitStatus({
      type: "success",
      message: result.message || "Folder initialized successfully",
    });
  } catch (error) {
    console.error('Full folder init error:', error);
    setInitStatus({
      type: "error",
      message: error instanceof Error ? error.message : "Initialization failed",
    });
  } finally {
    setIsInitializing(false);
  }
};
  const handleSubmit = async () => {
    if (!summary.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: null });

    try {
      const ticketData = {
        reportedBy: session?.user?.name || session?.user?.email || "Anonymous",
        summary,
        priority,
        link: `${window.location.origin}${pathname}`,
        timestamp: new Date().toISOString(),
        userId: session?.user?.id,
      };

      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit ticket");
      }

      setSubmitStatus({
        type: "success",
        message: "Ticket submitted successfully!",
      });

      setSummary("");
      setPriority("Average");
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      setSubmitStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setSubmitStatus({ type: null, message: null });
    setSummary("");
    setPriority("Average");
  };

  return (
    
     <>
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        {!authStatus.loading && !authStatus.authenticated && (
          <button
            onClick={startAuthFlow}
            className="bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            aria-label="Connect OneDrive"
          >
            <FiCloud className="h-6 w-6" />
          </button>
        )}

        {authStatus.authenticated && (
          <button
            onClick={initializeFolder}
            disabled={isInitializing}
            className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            aria-label="Initialize OneDrive folder"
          >
            {isInitializing ? (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FiFolderPlus className="h-6 w-6" />
            )}
          </button>
        )}

        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          aria-label="Create support ticket"
        >
          <FiPlus className="h-6 w-6" />
        </button>
      </div>

      {authStatus.loading && (
        <div className="fixed bottom-24 right-6 p-3 rounded-md max-w-xs bg-gray-100 text-gray-700">
          <div className="flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{authStatus.message}</span>
          </div>
        </div>
      )}

      {initStatus.type && (
        <div className={`fixed bottom-24 right-6 p-3 rounded-md max-w-xs ${
          initStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className="flex items-center">
            {initStatus.type === 'success' ? (
              <FiCheckCircle className="mr-2" />
            ) : (
              <FiAlertCircle className="mr-2" />
            )}
            <span>{initStatus.message}</span>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>
            
            {submitStatus.type && (
              <div className={`mb-4 p-3 rounded-md ${
                submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className="flex items-center">
                  {submitStatus.type === 'success' ? (
                    <FiCheckCircle className="mr-2" />
                  ) : (
                    <FiAlertCircle className="mr-2" />
                  )}
                  <span>{submitStatus.message}</span>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Summary *</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
                placeholder="Describe your issue..."
                disabled={isSubmitting}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="High">High</option>
                <option value="Average">Average</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !summary.trim()}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center ${
                  isSubmitting || !summary.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
     
     </>
  );
}
