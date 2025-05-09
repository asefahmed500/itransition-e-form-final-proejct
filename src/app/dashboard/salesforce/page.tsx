// app/dashboard/salesforce/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface ExtendedUser {
  id: string;
  email?: string;
  salesforceAccessToken?: string;
  salesforceRefreshToken?: string;
  salesforceInstanceUrl?: string;
  crmData?: {
    lastSynced?: Date;
  };
}

export default function SalesforceIntegrationPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    isLoading: boolean;
  }>({
    isConnected: false,
    isLoading: true,
  });

  const user = session?.user as ExtendedUser | undefined;

  // Check connection status only when needed
  const checkConnection = useCallback(async (forceCheck = false) => {
    if (!forceCheck && !connectionStatus.isLoading) return;

    setConnectionStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      
      if (success || error) {
        router.replace('/dashboard/salesforce', { scroll: false });
      }

      const isConnected = !!user?.salesforceAccessToken || !!success;
      setConnectionStatus({
        isConnected,
        isLoading: false,
      });

      if (success) toast.success('Successfully connected to Salesforce!');
      if (error) toast.error(`Connection failed: ${error}`);
    } catch (error) {
      console.error("Connection check error:", error);
      setConnectionStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [connectionStatus.isLoading, searchParams, user?.salesforceAccessToken, router]);

  // Initial check and param handling
  useEffect(() => {
    const success = searchParams.get('success');
    if (success) {
      setConnectionStatus({
        isConnected: true,
        isLoading: false,
      });
      toast.success('Successfully connected to Salesforce!');
      router.replace('/dashboard/salesforce', { scroll: false });
      return;
    }

    checkConnection();
  }, [checkConnection, searchParams, router]);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    try {
      window.location.href = '/api/salesforce/auth';
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to initiate connection");
      setLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/salesforce/disconnect', {
        method: 'POST'
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Disconnect failed');
      }
  
      await update({ reload: true });
      setConnectionStatus(prev => ({ ...prev, isConnected: false }));
      toast.success(data.message || "Disconnected from Salesforce");
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }, [update]);

  const handleRefresh = useCallback(async () => {
    try {
      await update();
      checkConnection(true);
      toast.success("Status refreshed");
    } catch (error) {
      toast.error(`Failed to refresh status: ${String(error)}`);
    }
  }, [update, checkConnection]);

  if (connectionStatus.isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Salesforce Integration</h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage your Salesforce CRM connection
        </p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Connection Status
          </h2>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 text-xs rounded-full ${
                connectionStatus.isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {connectionStatus.isConnected ? "Connected" : "Not Connected"}
            </span>
            <button 
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            {connectionStatus.isConnected
              ? "Your account is successfully connected to Salesforce."
              : "Connect your account to access Salesforce features."}
          </p>

          <div className="flex space-x-4 pt-4">
            {!connectionStatus.isConnected ? (
              <button
                onClick={handleConnect}
                disabled={loading}
                className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Connect to Salesforce
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className={`px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Disconnecting..." : "Disconnect"}
              </button>
            )}
          </div>
        </div>

        {connectionStatus.isConnected && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Instance URL</p>
                <p className="text-gray-800 truncate">{user?.salesforceInstanceUrl}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Synced</p>
                <p className="text-gray-800">
                  {user?.crmData?.lastSynced 
                    ? new Date(user.crmData.lastSynced).toLocaleString() 
                    : 'Not synced yet'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


