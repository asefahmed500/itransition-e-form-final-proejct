// /components/admin/UserTable.tsx
"use client";
import { useState } from "react";

export default function UserTable({
  users,
  loading,
  currentUserId,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onBlock,
  onDelete,
  onRoleChange,
}: {
  users: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isBlocked: boolean;
    createdAt: string;
    authProvider?: string;
    emailVerified?: string | null;
    lastLogin?: string | null;
  }[];
  loading: boolean;
  currentUserId?: string;
  selectedUsers: string[];
  onSelectUser: (userId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onBlock: (userId: string, block: boolean) => void;
  onDelete: (userId: string) => void;
  onRoleChange: (userId: string, role: string) => void;
}) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center py-8">No users found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <>
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => onSelectUser(user._id, e.target.checked)}
                      disabled={user._id === currentUserId}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                          {user._id === currentUserId && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => onRoleChange(user._id, e.target.value)}
                      disabled={
                        user._id === currentUserId ||
                        (user.role === "super-admin" && currentUserId !== user._id)
                      }
                      className={`border rounded px-2 py-1 text-sm ${
                        user.role === "super-admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "admin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {user.role === "super-admin" && (
                        <option value="super-admin">Super Admin</option>
                      )}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isBlocked
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          onBlock(user._id, !user.isBlocked)
                        }
                        disabled={user._id === currentUserId}
                        className={`px-3 py-1 rounded text-sm ${
                          user.isBlocked
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        } ${
                          user._id === currentUserId
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        onClick={() => onDelete(user._id)}
                        disabled={
                          user._id === currentUserId ||
                          user.role === "super-admin"
                        }
                        className={`px-3 py-1 rounded bg-red-800 text-white text-sm hover:bg-red-900 ${
                          user._id === currentUserId ||
                          user.role === "super-admin"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() =>
                          setExpandedUser(
                            expandedUser === user._id ? null : user._id
                          )
                        }
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                      >
                        {expandedUser === user._id ? "Hide" : "Details"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedUser === user._id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">User ID:</p>
                          <p className="text-gray-600 break-all">{user._id}</p>
                        </div>
                        <div>
                          <p className="font-medium">Auth Provider:</p>
                          <p className="text-gray-600">
                            {user.authProvider || "Credentials"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Email Verified:</p>
                          <p className="text-gray-600">
                            {user.emailVerified
                              ? new Date(user.emailVerified).toLocaleString()
                              : "Not verified"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Last Login:</p>
                          <p className="text-gray-600">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}