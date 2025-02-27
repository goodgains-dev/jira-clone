"use client";

import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MDEditor from "@uiw/react-md-editor";
import useFetch from "@/hooks/use-fetch";
import { createIssue } from "@/actions/issues";
import { getOrganizationUsers } from "@/actions/organizations";
import { getDepartments } from "@/actions/departments";
import { issueSchema } from "@/app/lib/validators";
import { toast } from "sonner";

export default function IssueCreationDrawer({
  isOpen,
  onClose,
  sprintId,
  status,
  projectId,
  onIssueCreated,
  orgId,
}) {
  // Initialize state with default values instead of accessing issue.status
  // Use status from props instead of issue.status
  const [issueStatus, setIssueStatus] = useState(status || "TODO");
  const [issuePriority, setIssuePriority] = useState("MEDIUM");

  const {
    loading: createIssueLoading,
    fn: createIssueFn,
    error,
    data: newIssue,
  } = useFetch(createIssue);

  const {
    loading: usersLoading,
    fn: fetchUsers,
    data: users,
  } = useFetch(getOrganizationUsers);

  const {
    loading: departmentsLoading,
    fn: fetchDepartments,
    data: departments,
  } = useFetch(getDepartments);


  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      priority: "MEDIUM",
      description: "",
      assigneeId: "",
      departmentId: "",
    },
  });

  useEffect(() => {
    if (isOpen && orgId) {
      fetchUsers(orgId);
    }
    
    if (isOpen && projectId) {
      fetchDepartments(projectId);
    }
  }, [isOpen, orgId, projectId, fetchUsers, fetchDepartments]);

  const onSubmit = async (data) => {
    // Convert "none" to null for departmentId
    const processedData = {
      ...data,
      departmentId: data.departmentId === "none" ? null : data.departmentId,
      status: issueStatus,
      priority: issuePriority,
      sprintId,
    };
    
    await createIssueFn(projectId, processedData);
  };


  useEffect(() => {
    if (newIssue) {
      reset();
      onClose();
      onIssueCreated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newIssue]);


  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Issue</DrawerTitle>
        </DrawerHeader>
        {usersLoading && <BarLoader width={"100%"} color="#36d7b7" />}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="assigneeId"
              className="block text-sm font-medium mb-1"
            >
              Assignee
            </label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.assigneeId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.assigneeId.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <MDEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium mb-1"
            >
              Priority
            </label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <label
              htmlFor="departmentId"
              className="block text-sm font-medium mb-1"
            >
              Department
            </label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-gray-500 mt-2">
              Departments can be created in the Organization&apos;s Departments page
            </p>
          </div>

          {error && <p className="text-red-500 mt-2">{error.message}</p>}
          <Button
            type="submit"
            disabled={createIssueLoading}
            className="w-full"
          >
            {createIssueLoading ? "Creating..." : "Create Issue"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
