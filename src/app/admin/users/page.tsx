"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  User as UserIcon,
  Shield,
  ShieldOff,
  Trash2,
  Lock,
  Unlock,
  ArrowUpDown,
  ChevronDown,
  X,
  Loader2,
  Mail,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super-admin";
  isBlocked: boolean;
  createdAt: string;
}

export default function UserManagement() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login?callbackUrl=/admin/users");
    },
  });

  // Early return if no session or user
  if (!session || !session.user) {
    redirect("/auth/login?callbackUrl=/admin/users");
  }

  // Check user role
  if (session.user.role !== "admin" && session.user.role !== "super-admin") {
    redirect("/dashboard");
  }

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || "Failed to fetch users");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: string, block: boolean) => {
    try {
      const res = await fetch("/api/admin/users/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, block }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
        
        if (userId === session.user.id && block) {
          signOut({ callbackUrl: "/auth/login" });
        }
      } else {
        throw new Error(data.error || "Failed to update user");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        throw new Error(data.error || "Failed to delete user");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleRoleChange = async (userId: string, role: "user" | "admin" | "super-admin") => {
    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
        
        if (userId === session.user.id && role === "user") {
          signOut({ callbackUrl: "/auth/login" });
        }
      } else {
        throw new Error(data.error || "Failed to update user role");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleBulkAction = async (action: "block" | "unblock" | "delete" | "promote" | "demote") => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    const actionMessages = {
      block: "block",
      unblock: "unblock",
      delete: "delete",
      promote: "promote to admin",
      demote: "demote to user"
    };

    if (!confirm(`Are you sure you want to ${actionMessages[action]} ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/bulk/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
        setSelectedUsers([]);
        
        // If current user is in the selected users and is being demoted, sign them out
        if (action === "demote" && selectedUsers.includes(session.user.id)) {
          signOut({ callbackUrl: "/auth/login" });
        }
      } else {
        throw new Error(data.error || `Failed to ${action} users`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleSort = (key: keyof User) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !user.isBlocked) || 
      (statusFilter === "blocked" && user.isBlocked);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const key = sortConfig.key;
    const aValue = a[key];
    const bValue = b[key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'ascending' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortConfig.direction === 'ascending'
        ? (aValue === bValue ? 0 : aValue ? -1 : 1)
        : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }
    
    return 0;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users size={24} className="text-blue-600" />
          User Management
        </h1>
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedUsers.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Status Summary - Moved to the top */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold">{users.filter(u => !u.isBlocked).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Blocked Users</p>
              <p className="text-2xl font-semibold">{users.filter(u => u.isBlocked).length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-semibold">{users.filter(u => u.role === "admin" || u.role === "super-admin").length}</p>
            </div>
            <ShieldCheck className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 w-full border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
            {session.user.role === "super-admin" && (
              <option value="super-admin">Super Admins</option>
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 w-full border rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleBulkAction("block")}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Lock size={16} />
            Block
          </button>
          <button
            onClick={() => handleBulkAction("unblock")}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Unlock size={16} />
            Unblock
          </button>
          <button
            onClick={() => handleBulkAction("delete")}
            className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => handleBulkAction("promote")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Shield size={16} />
            Promote to Admin
          </button>
          <button
            onClick={() => handleBulkAction("demote")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShieldOff size={16} />
            Demote to User
          </button>
          <button
            onClick={() => setSelectedUsers([])}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X size={16} />
            Clear Selection
          </button>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={(e) => setSelectedUsers(e.target.checked ? users.map(user => user._id) : [])}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("isBlocked")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown size={14} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user) => (
                    <tr key={user._id} className={user.isBlocked ? "bg-red-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => 
                            setSelectedUsers(prev => 
                              e.target.checked 
                                ? [...prev, user._id] 
                                : prev.filter(id => id !== user._id)
                            )
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="mr-2 h-4 w-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin" || user.role === "super-admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isBlocked ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {!user.isBlocked ? (
                            <button
                              onClick={() => handleBlock(user._id, true)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                              title="Block user"
                            >
                              <Lock size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(user._id, false)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Unblock user"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                          {(session.user.role === "super-admin" || 
                            (session.user.role === "admin" && user.role !== "super-admin")) && (
                            <>
                              {user.role === "user" ? (
                                <button
                                  onClick={() => handleRoleChange(user._id, "admin")}
                                  className="text-purple-600 hover:text-purple-900 flex items-center"
                                  title="Promote to admin"
                                >
                                  <Shield size={16} />
                                </button>
                              ) : user.role === "admin" ? (
                                <button
                                  onClick={() => handleRoleChange(user._id, "user")}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                  title="Demote to user"
                                >
                                  <ShieldOff size={16} />
                                </button>
                              ) : null}
                            </>
                          )}
                          {user._id !== session.user.id && (
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="text-red-800 hover:text-red-900 flex items-center"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}