"use client";

import { useState, useEffect, useCallback } from "react";
import useStreamChat from "@/hooks/use-stream-chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MDEditor from "@uiw/react-md-editor";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "./user-avatar";
import useFetch from "@/hooks/use-fetch";
import { useOrganization, useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarLoader } from "react-spinners";
import { ExternalLink, MessageCircle, MessageSquare, Send } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  ChannelHeader
} from 'stream-chat-react';

import statuses from "@/data/status";
import { deleteIssue, updateIssue } from "@/actions/issues";
import { createComment, getCommentsForIssue } from "@/actions/comments";
import { initializeIssueChat, getChatForIssue, getStreamChatToken } from "@/actions/chat";
import { getDepartments, createDepartment, assignIssueToDepartment } from "@/actions/departments";

const priorityOptions = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function IssueDetailsDialog({
  isOpen,
  onClose,
  issue,
  onDelete = () => {},
  onUpdate = () => {},
  borderCol = "",
}) {
  // Basic issue state
  const [status, setStatus] = useState(issue.status);
  const [priority, setPriority] = useState(issue.priority);
  const [activeTab, setActiveTab] = useState("details");
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // Chat state
  const { client: chatClient, channel: chatChannel, loading: chatLoading, error: chatError } = useStreamChat(issue.id);
  
  // Department state
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(issue.departmentId || null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentDesc, setNewDepartmentDesc] = useState("");
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  
  const { user } = useUser();
  const { membership } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();

  const {
    loading: deleteLoading,
    error: deleteError,
    fn: deleteIssueFn,
    data: deleted,
  } = useFetch(deleteIssue);

  const {
    loading: updateLoading,
    error: updateError,
    fn: updateIssueFn,
    data: updated,
  } = useFetch(updateIssue);
  
  const {
    loading: commentsLoadingState,
    error: commentsError,
    fn: fetchComments,
    data: fetchedComments,
  } = useFetch(getCommentsForIssue);
  
  const {
    loading: commentCreateLoading,
    error: commentCreateError,
    fn: createCommentFn,
    data: createdComment,
  } = useFetch(createComment);
  
  // We're now using the useStreamChat hook instead of these server actions
  
  // Department hooks
  const {
    loading: departmentsLoadingState,
    error: departmentsError,
    fn: fetchDepartments,
    data: fetchedDepartments,
  } = useFetch(getDepartments);
  
  const {
    loading: departmentCreateLoading,
    error: departmentCreateError,
    fn: createDepartmentFn,
    data: createdDepartment,
  } = useFetch(createDepartment);
  
  const {
    loading: departmentAssignLoading,
    error: departmentAssignError,
    fn: assignToDepartmentFn,
    data: departmentAssignResult,
  } = useFetch(assignIssueToDepartment);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      deleteIssueFn(issue.id);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    updateIssueFn(issue.id, { status: newStatus, priority });
  };

  const handlePriorityChange = async (newPriority) => {
    setPriority(newPriority);
    updateIssueFn(issue.id, { status, priority: newPriority });
  };

  // Handle basic issue actions
  useEffect(() => {
    if (deleted) {
      onClose();
      onDelete();
    }
    if (updated) {
      onUpdate(updated);
    }
  }, [deleted, updated, onClose, onDelete, onUpdate]);
  
  // Load comments when tab is activated
  useEffect(() => {
    if (activeTab === "comments" && !comments.length && !commentsLoadingState) {
      fetchComments(issue.id);
    }
  }, [activeTab, comments.length, commentsLoadingState, fetchComments, issue.id]);
  
  // The new useStreamChat hook handles chat initialization automatically
  
  // Handle data updates
  useEffect(() => {
    // Handle fetched comments
    if (fetchedComments) {
      setComments(fetchedComments);
      setCommentsLoading(false);
    }
    
    // Handle created comment
    if (createdComment) {
      setComments((prev) => [...prev, createdComment]);
      setCommentInput("");
    }
    
    // Handle fetched departments
    if (fetchedDepartments) {
      setDepartments(fetchedDepartments);
      setDepartmentsLoading(false);
    }
    
    // Handle created department
    if (createdDepartment) {
      setDepartments((prev) => [...prev, createdDepartment]);
      setDepartmentsLoading(false);
    }
    
    // Handle department assignment
    if (departmentAssignResult) {
      onUpdate(departmentAssignResult);
    }
  }, [fetchedComments, createdComment, fetchedDepartments, createdDepartment, departmentAssignResult, onUpdate]);
  
  // Handle comment submission
  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setCommentsLoading(true);
    createCommentFn(issue.id, commentInput);
  };
  
  // We don't need a separate chat initialization function anymore
  // as our useStreamChat hook handles this automatically
  
  // Department handlers
  const handleDepartmentChange = useCallback((newDepartmentId) => {
    setDepartmentId(newDepartmentId);
    // First update the UI state
    const finalDepartmentId = newDepartmentId === "null" ? null : newDepartmentId;
    
    // Then update via API
    console.log("Updating department to:", finalDepartmentId);
    updateIssueFn(issue.id, {
      status,
      priority,
      departmentId: finalDepartmentId
    });
  }, [issue.id, status, priority, updateIssueFn]);
  
  const handleCreateDepartment = useCallback(() => {
    if (!newDepartmentName.trim()) return;
    
    setDepartmentsLoading(true);
    createDepartmentFn(issue.projectId, {
      name: newDepartmentName,
      description: newDepartmentDesc
    });
    
    // Reset form
    setNewDepartmentName("");
    setNewDepartmentDesc("");
    setShowNewDepartmentForm(false);
  }, [newDepartmentName, newDepartmentDesc, issue.projectId, createDepartmentFn]);
  
  // Load departments whenever dialog is opened
  useEffect(() => {
    if (isOpen && issue.projectId) {
      console.log("Fetching departments for project:", issue.projectId);
      setDepartmentsLoading(true);
      fetchDepartments(issue.projectId);
    }
  }, [isOpen, issue.projectId, fetchDepartments]);

  const canChange =
    user.id === issue.reporter.clerkUserId || membership.role === "org:admin";

  const handleGoToProject = () => {
    router.push(`/project/${issue.projectId}?sprint=${issue.sprintId}`);
  };

  const isProjectPage = !pathname.startsWith("/project/");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-3xl">{issue.title}</DialogTitle>
            {isProjectPage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGoToProject}
                title="Go to Project"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {(updateLoading || deleteLoading || commentsLoading || chatLoading) && (
          <BarLoader width={"100%"} color="#36d7b7" />
        )}
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>Comments ({comments.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="flex items-center gap-1"
              disabled={!issue.assignee}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Status, Priority and Department */}
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={priority}
                onValueChange={handlePriorityChange}
                disabled={!canChange}
              >
                <SelectTrigger className={`w-[150px] border ${borderCol} rounded`}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Description */}
            <div>
              <h4 className="font-semibold">Description</h4>
              <MDEditor.Markdown
                className="rounded px-2 py-1 bg-white"
                source={issue.description ? issue.description : "--"}
              />
            </div>

            {/* Key Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold">Created</h4>
                <p className="text-gray-700">
                  {new Date(issue.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Updated</h4>
                <p className="text-gray-700">
                  {new Date(issue.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Comments</h4>
                <p className="text-gray-700">{issue.comments?.length || 0}</p>
              </div>
              <div>
                <h4 className="font-semibold">ID</h4>
                <p className="text-gray-700 font-mono">{issue.id}</p>
              </div>
            </div>
            
            {/* People */}
            <div className="flex justify-between">
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold">Assignee</h4>
                <div className="flex items-center gap-2">
                  <UserAvatar user={issue.assignee} />
                  <div>
                    {issue.assignee ? (
                      <span className="text-sm">{issue.assignee.name}</span>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold">Reporter</h4>
                <div className="flex items-center gap-2">
                  <UserAvatar user={issue.reporter} />
                  <span className="text-sm">{issue.reporter?.name}</span>
                </div>
              </div>
            </div>
            
            {departmentCreateError && (
              <p className="text-red-500 text-sm mt-2">{departmentCreateError.message}</p>
            )}
            {departmentAssignError && (
              <p className="text-red-500 text-sm mt-2">{departmentAssignError.message}</p>
            )}
            
            {/* Delete button */}
            {canChange && (
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                variant="destructive"
                className="mt-4 w-full"
              >
                {deleteLoading ? "Deleting..." : "Delete Issue"}
              </Button>
            )}
          </TabsContent>
          
          {/* Comments Tab */}
          <TabsContent value="comments" className="h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 my-10">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={comment.author} />
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                size="icon"
                disabled={commentCreateLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {commentCreateError && (
              <p className="text-red-500 mt-2">{commentCreateError.message}</p>
            )}
          </TabsContent>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="h-[400px] flex flex-col pt-0 mt-0">
            {!issue.assignee ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-gray-500">
                  An assignee is required to start a chat
                </p>
              </div>
            ) : chatLoading ? (
              <div className="flex items-center justify-center h-full">
                <BarLoader color="#36d7b7" />
              </div>
            ) : chatError ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-center text-red-500">
                  Error connecting to chat: {chatError}
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="text-xs"
                >
                  Reload page
                </Button>
              </div>
            ) : !chatClient || !chatChannel ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Initializing chat...</p>
                <BarLoader color="#36d7b7" width={100} className="ml-2" />
              </div>
            ) : (
              <div className="h-full w-full">
                <Chat client={chatClient} theme="messaging dark">
                  <Channel channel={chatChannel}>
                    <Window>
                      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm text-gray-300 mr-3">Online:</div>
                          <div className="flex">
                            {issue.assignee && (
                              <div className="flex items-center mr-3">
                                <UserAvatar user={issue.assignee} />
                                <span className="text-sm text-white ml-2 font-medium">{issue.assignee.name}</span>
                              </div>
                            )}
                            {issue.reporter && (
                              <div className="flex items-center">
                                <UserAvatar user={issue.reporter} />
                                <span className="text-sm text-white ml-2 font-medium">{issue.reporter.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <MessageList />
                      <MessageInput />
                    </Window>
                    <Thread />
                  </Channel>
                </Chat>
              </div>
            )}
            
            {/* Error is now displayed in the condition above */}
          </TabsContent>
        </Tabs>
        
        {(deleteError || updateError) && (
          <p className="text-red-500 mt-2">
            {deleteError?.message || updateError?.message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
