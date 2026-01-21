"use client";

import { useState } from "react";
import { Search, Ban, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'CLIENT' | 'BRANDUSER' | 'ADMIN';
  verified: boolean;
  created_at: string;
}

// Mock users data
const mockUsers: User[] = [
  {
    id: "660e8400-e29b-41d4-a716-446655440000",
    username: "johndoe",
    email: "john@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "CLIENT",
    verified: true,
    created_at: "2024-01-10T10:00:00Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    username: "janedoe",
    email: "jane@example.com",
    first_name: "Jane",
    last_name: "Doe",
    role: "CLIENT",
    verified: true,
    created_at: "2024-01-12T10:00:00Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    username: "nike_brand",
    email: "brand@nike.com",
    first_name: "Nike",
    last_name: "Brand",
    role: "BRANDUSER",
    verified: true,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440003",
    username: "admin_user",
    email: "admin@manachain.com",
    first_name: "Admin",
    last_name: "User",
    role: "ADMIN",
    verified: true,
    created_at: "2024-01-01T10:00:00Z",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440004",
    username: "testuser",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    role: "CLIENT",
    verified: false,
    created_at: "2024-02-20T10:00:00Z",
  },
];

export function ActiveUsersTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState<number>(10);
  const [users] = useState<User[]>(mockUsers);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedUsers = filteredUsers.slice(0, limit);

  const handleBan = (userId: string) => {
    // TODO: Implement ban functionality
    console.log("Ban user:", userId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400';
      case 'BRANDUSER':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-4 pt-8">
      <div>
        <h2 className="text-xl font-bold">Active Users</h2>
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
        </p>
      </div>

      {/* Search and Limit Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select 
          value={limit.toString()} 
          onValueChange={(value) => setLimit(Number(value))} 
          className="w-32"
        >
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">ID</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Role</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Created</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border hover:bg-muted/20 transition-colors ${
                      index === displayedUsers.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-violet-400">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {!user.verified && (
                            <div className="text-xs text-yellow-500 mt-0.5">Unverified</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground font-mono">
                        {user.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleBan(user.id)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Ban
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <MoreHorizontal className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
