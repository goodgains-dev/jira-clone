"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrganization, useOrganizationList, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelectCheckbox } from "@/components/ui/multi-select-checkbox";
import { createDepartment, getDepartments, updateDepartment, deleteDepartment } from "@/actions/departments";
import { Building2, Plus, Edit, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import DepartmentOrgChart from "@/components/department-org-chart";

export default function DepartmentsPage({ params }) {
  const { orgId } = params;
  const router = useRouter();
  const { organization, isLoaded, membership } = useOrganization();
  const { user } = useUser();
  const { organizationList } = useOrganizationList();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDesc, setDepartmentDesc] = useState("");
  const [departmentHeadId, setDepartmentHeadId] = useState("none");
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Get organization members from Clerk
  useEffect(() => {
    if (organization && organization.id) {
      const fetchOrgMembers = async () => {
        try {
          // Get all members from the organization
          const { data: members } = await organization.getMemberships();
          
          if (members && members.length > 0) {
            // Map the members to a more usable format
            const users = members.map(member => ({
              id: member.publicUserData.userId,
              name: member.publicUserData.firstName 
                ? `${member.publicUserData.firstName} ${member.publicUserData.lastName || ''}`
                : member.publicUserData.identifier,
              email: member.publicUserData.identifier,
              role: member.role,
              imageUrl: member.publicUserData.imageUrl
            }));
            
            console.log("Organization users:", users.length);
            setOrganizationUsers(users);
          } else {
            console.log("No organization members found");
            
            // Fallback to organization list if no members found
            if (organizationList && organizationList.length > 0) {
              const currentOrg = organizationList.find(org => org.organization.id === orgId);
              if (currentOrg && currentOrg.organization.memberships) {
                const users = currentOrg.organization.memberships.map(member => ({
                  id: member.publicUserData.userId,
                  name: member.publicUserData.firstName 
                    ? `${member.publicUserData.firstName} ${member.publicUserData.lastName || ''}`
                    : member.publicUserData.identifier,
                  email: member.publicUserData.identifier,
                  role: member.role,
                  imageUrl: member.publicUserData.imageUrl
                }));
                
                console.log("Organization users from list:", users.length);
                setOrganizationUsers(users);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching organization members:", error);
          
          // Fallback to current user if error
          if (user) {
            setOrganizationUsers([{
              id: user.id,
              name: user.fullName || user.username,
              email: user.primaryEmailAddress?.emailAddress,
              role: "member",
              imageUrl: user.imageUrl
            }]);
          }
        }
      };
      
      fetchOrgMembers();
    }
  }, [organization, organizationList, user, orgId]);

  // Use the useFetch hook for department operations
  const {
    loading: createLoading,
    fn: createDepartmentFn,
    error: createError,
    data: newDepartment,
  } = useFetch(createDepartment);
  
  const {
    loading: updateLoading,
    fn: updateDepartmentFn,
    error: updateError,
    data: updatedDepartment,
  } = useFetch(updateDepartment);
  
  const {
    loading: deleteLoading,
    fn: deleteDepartmentFn,
    error: deleteError,
    data: deleteResult,
  } = useFetch(deleteDepartment);
  
  const {
    loading: fetchLoading,
    fn: fetchDepartmentsFn,
    error: fetchError,
    data: fetchedDepartments,
  } = useFetch(getDepartments);
  
  // Stabilize the fetchDepartmentsFn reference with useCallback
  const stableFetchDepartments = useCallback(async (projectId) => {
    await fetchDepartmentsFn(projectId);
  }, [fetchDepartmentsFn]);
  
  // Get all projects and departments for this organization
  useEffect(() => {
    if (!isLoaded || !organization) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects?orgId=${orgId}`);
        const data = await response.json();
        
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          
          // Set the first project as default
          const firstProjectId = data.projects[0].id;
          setSelectedProjectId(firstProjectId);
          
          // Fetch departments for the first project
          await stableFetchDepartments(firstProjectId);
        } else {
          setLoading(false);
          setError("No projects found for this organization");
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setLoading(false);
        setError("Failed to load projects");
      }
    };

    fetchProjects();
  }, [isLoaded, organization, orgId, stableFetchDepartments]);
  
  // Update departments when fetchedDepartments changes
  useEffect(() => {
    if (fetchedDepartments) {
      setDepartments(fetchedDepartments);
      setLoading(false);
    }
  }, [fetchedDepartments]);
  
  // Handle project change - stabilized with useCallback
  const handleProjectChange = useCallback(async (projectId) => {
    setSelectedProjectId(projectId);
    setLoading(true);
    await stableFetchDepartments(projectId);
  }, [stableFetchDepartments]);
  
  // Handle department creation
  const handleCreateDepartment = async () => {
    if (!departmentName.trim()) return;
    
    try {
      setError(null);
      
      // Create the department using the useFetch hook
      await createDepartmentFn(selectedProjectId, {
        name: departmentName,
        description: departmentDesc,
        departmentHeadId: departmentHeadId === "none" ? null : departmentHeadId,
        memberIds: departmentMembers
      });
    } catch (err) {
      console.error("Error creating department:", err);
      setError(err.message || "Failed to create department");
    }
  };
  
  // Handle department update
  const handleUpdateDepartment = async () => {
    if (!departmentName.trim() || !selectedDepartment) return;
    
    try {
      setError(null);
      
      // Update the department using the useFetch hook
      await updateDepartmentFn(selectedDepartment.id, {
        name: departmentName,
        description: departmentDesc,
        departmentHeadId: departmentHeadId === "none" ? null : departmentHeadId,
        memberIds: departmentMembers
      });
    } catch (err) {
      console.error("Error updating department:", err);
      setError(err.message || "Failed to update department");
    }
  };
  
  // Handle department deletion
  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      setError(null);
      
      // Delete the department using the useFetch hook
      await deleteDepartmentFn(selectedDepartment.id);
    } catch (err) {
      console.error("Error deleting department:", err);
      setError(err.message || "Failed to delete department");
    }
  };
  
  // Open edit dialog with department data
  const openEditDialog = (department) => {
    setSelectedDepartment(department);
    setDepartmentName(department.name);
    setDepartmentDesc(department.description || "");
    setDepartmentHeadId(department.departmentHeadId || "none");
    
    // Set department members from existing members
    const memberIds = department.members?.map(member => {
      // Find the Clerk user ID from our organization users by matching database user with Clerk user
      const dbUser = member.user;
      const orgUser = organizationUsers.find(user => 
        user.email === dbUser.email || 
        user.name === dbUser.name
      );
      return orgUser?.id;
    }).filter(Boolean) || [];
    
    setDepartmentMembers(memberIds);
    setIsEditDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };
  
  // Effects for handling operation results
  useEffect(() => {
    if (newDepartment) {
      // Success! Update local state
      setDepartments(prev => [...prev, newDepartment]);
      setDepartmentName("");
      setDepartmentDesc("");
      setDepartmentHeadId("none");
      setDepartmentMembers([]);
      setIsCreateDialogOpen(false);
      
      // Show success toast notification
      toast.success(`Department "${newDepartment.name}" created successfully!`);
    }
  }, [newDepartment]);
  
  useEffect(() => {
    if (updatedDepartment) {
      // Success! Update local state
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === updatedDepartment.id ? updatedDepartment : dept
        )
      );
      setDepartmentName("");
      setDepartmentDesc("");
      setDepartmentMembers([]);
      setSelectedDepartment(null);
      setIsEditDialogOpen(false);
      
      // Show success toast notification
      toast.success(`Department "${updatedDepartment.name}" updated successfully!`);
    }
  }, [updatedDepartment]);
  
  useEffect(() => {
    if (deleteResult && deleteResult.success) {
      // Success! Update local state
      setDepartments(prev => 
        prev.filter(dept => dept.id !== selectedDepartment?.id)
      );
      setSelectedDepartment(null);
      setIsDeleteDialogOpen(false);
      
      // Show success toast notification
      toast.success(`Department deleted successfully!`);
    }
  }, [deleteResult, selectedDepartment]);

  const isAdmin = membership?.role === "org:admin";

  if (!isLoaded) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-gray-500">Manage departments for your organization</p>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/organization/${orgId}`} className="px-4 py-2 rounded-md border hover:bg-gray-100">
              Back to Organization
            </Link>
            {isAdmin && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Add Department</span>
              </Button>
            )}
          </div>
        </div>
        
        {projects.length > 1 && (
          <div className="w-full md:w-1/3">
            <label htmlFor="project-select" className="block text-sm font-medium mb-1">
              Select Project
            </label>
            <Select
              value={selectedProjectId}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No departments yet</h3>
          <p className="text-gray-500 mb-4">
            Create departments to organize issues by team or function
          </p>
          {isAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create your first department
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {departments.map((department) => (
            <div key={department.id} className="space-y-4">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{department.name}</h3>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openEditDialog(department)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDeleteDialog(department)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
                {department.description && (
                  <p className="text-gray-600 mt-2">{department.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <Users size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {department.members?.length || 0} members
                  </span>
                </div>
                {department.departmentHeadId && (
                  <p className="text-sm text-gray-600 mt-2">
                    Department Head: {organizationUsers.find(user => user.id === department.departmentHeadId)?.name || 'Unknown'}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-4">
                  Created: {new Date(department.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {/* Organization Chart */}
              <DepartmentOrgChart 
                department={department}
                departmentHead={department.departmentHeadId}
                members={department.members}
                allUsers={organizationUsers}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create Department Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Department Name
              </label>
              <Input
                id="name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Engineering, Marketing, etc."
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={departmentDesc}
                onChange={(e) => setDepartmentDesc(e.target.value)}
                placeholder="Describe the purpose of this department"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="department-head" className="text-sm font-medium">
                Department Head (Optional)
              </label>
              <Select
                value={departmentHeadId}
                onValueChange={setDepartmentHeadId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizationUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.role === "org:admin" ? "(Admin)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="department-members" className="text-sm font-medium">
                Department Members
              </label>
              <MultiSelectCheckbox
                options={organizationUsers.map(user => ({
                  label: `${user.name || user.email} ${user.role === "org:admin" ? "(Admin)" : ""}`,
                  value: user.id
                }))}
                selected={departmentMembers}
                onChange={(newSelected) => {
                  console.log("Selected members:", newSelected);
                  setDepartmentMembers(newSelected);
                }}
                placeholder="Select department members"
                emptyMessage="No users found"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select users to add to this department
              </p>
            </div>
          </div>
          
          {createError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              <p className="font-bold">Error creating department:</p>
              <p>{createError.message || "Unknown error"}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDepartment}
              disabled={createLoading || !departmentName.trim()}
            >
              {createLoading ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Department Name
              </label>
              <Input
                id="edit-name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="edit-description"
                value={departmentDesc}
                onChange={(e) => setDepartmentDesc(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-department-head" className="text-sm font-medium">
                Department Head (Optional)
              </label>
              <Select
                value={departmentHeadId}
                onValueChange={setDepartmentHeadId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizationUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.role === "org:admin" ? "(Admin)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-department-members" className="text-sm font-medium">
                Department Members
              </label>
              <MultiSelectCheckbox
                options={organizationUsers.map(user => ({
                  label: `${user.name || user.email} ${user.role === "org:admin" ? "(Admin)" : ""}`,
                  value: user.id
                }))}
                selected={departmentMembers}
                onChange={(newSelected) => {
                  console.log("Selected members:", newSelected);
                  setDepartmentMembers(newSelected);
                }}
                placeholder="Select department members"
                emptyMessage="No users found"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select users to add to this department
              </p>
            </div>
          </div>
          
          {updateError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              <p className="font-bold">Error updating department:</p>
              <p>{updateError.message || "Unknown error"}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDepartment}
              disabled={updateLoading || !departmentName.trim()}
            >
              {updateLoading ? "Updating..." : "Update Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Department Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to delete the department 
              <span className="font-semibold">
                {selectedDepartment ? ` "${selectedDepartment.name}"` : ""}
              </span>?
            </p>
            <p className="text-red-500 mt-2">
              This action cannot be undone. Issues assigned to this department will be unassigned.
            </p>
          </div>
          
          {deleteError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              <p className="font-bold">Error deleting department:</p>
              <p>{deleteError.message || "Unknown error"}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
