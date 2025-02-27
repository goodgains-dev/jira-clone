"use client";

import { useState } from "react";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * Department Organization Chart Component
 * Displays a hierarchical view of a department with the head and members
 */
export default function DepartmentOrgChart({ 
  department, 
  departmentHead, 
  members, 
  allUsers 
}) {
  const [expanded, setExpanded] = useState(false);

  // Find the department head user object
  const headUser = departmentHead 
    ? allUsers.find(user => user.id === departmentHead)
    : null;

  // Group members by role if they have roles
  const membersByRole = members?.reduce((acc, member) => {
    const role = member.role || "Member";
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {});

  // Get all roles
  const roles = membersByRole ? Object.keys(membersByRole) : [];

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{department.name} Organization</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8 p-0"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>
      </div>

      {/* Department Head */}
      {headUser && (
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-blue-500">
              <AvatarImage src={headUser.imageUrl} alt={headUser.name} />
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {headUser.name?.split(" ").map(n => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1">
              <User size={12} />
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="font-medium">{headUser.name}</p>
            <p className="text-xs text-gray-500">Department Head</p>
          </div>
          
          {/* Vertical line connecting head to members */}
          {members && members.length > 0 && (
            <div className="h-8 w-0.5 bg-gray-300 my-2"></div>
          )}
        </div>
      )}

      {/* Department Members */}
      {expanded && members && members.length > 0 ? (
        <div className="mt-4">
          {roles.map((role) => (
            <div key={role} className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">{role}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {membersByRole[role].map((member) => {
                  const user = allUsers.find(u => u.id === member.userId);
                  if (!user) return null;
                  
                  return (
                    <div key={member.id} className="flex flex-col items-center">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.imageUrl} alt={user.name} />
                        <AvatarFallback className="bg-gray-100">
                          {user.name?.split(" ").map(n => n[0]).join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{member.role || "Member"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : members && members.length > 0 ? (
        <div className="text-center text-sm text-gray-500">
          {members.length} member{members.length !== 1 ? 's' : ''} • Click to expand
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500">
          No members in this department
        </div>
      )}
    </div>
  );
}
