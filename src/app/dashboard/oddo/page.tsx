"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { SiOdoo } from "react-icons/si";

export default function OdooDashboard() {
  const [odooToken, setOdooToken] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState<string>("");
  const [generatingToken, setGeneratingToken] = useState(false);

  const generateOdooToken = async () => {
    setGeneratingToken(true);
    try {
      const response = await fetch("/api/odoo/token");
      const data = await response.json();
      
      if (response.ok) {
        setOdooToken(data.token);
        const expiryDate = new Date(data.expiresAt);
        setTokenExpiry(expiryDate.toLocaleString());
        toast.success(`API token generated (valid until ${expiryDate.toLocaleDateString()})`);
      } else {
        throw new Error(data.error || "Failed to generate token");
      }
    } catch (error) {
      console.error("Token generation error:", error);
      toast.error("Failed to generate API token");
    } finally {
      setGeneratingToken(false);
    }
  };

  const refreshToken = async () => {
    if (window.confirm("Generate a new token? The old one will be invalidated.")) {
      await generateOdooToken();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          <SiOdoo className="inline mr-2 text-orange-600" />
          Odoo Integration
        </h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Use this API token to connect your forms data with Odoo.
          </p>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={odooToken}
              readOnly
              className="flex-1 px-3 py-2 border rounded bg-gray-100"
              placeholder="Click generate to create API token"
            />
            
            <button
              onClick={generateOdooToken}
              disabled={generatingToken}
              className={`px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 ${
                generatingToken ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {generatingToken ? "Generating..." : odooToken ? "Regenerate" : "Generate"}
            </button>
          </div>
          
          {odooToken && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-medium text-yellow-800">Important:</p>
              <p className="text-yellow-700">
                Copy this token and keep it secure. You won&apos;t be able to see it again after
                leaving this page.
              </p>
              {tokenExpiry && (
                <p className="text-yellow-700 mt-1">
                  Token expires: {tokenExpiry}
                </p>
              )}
              <p className="mt-2 text-yellow-700">
                Use this endpoint to access your data: <code className="bg-gray-100 px-1 rounded">GET /api/odoo/data?token=YOUR_TOKEN</code>
              </p>
              <button
                onClick={refreshToken}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Generate new token
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}