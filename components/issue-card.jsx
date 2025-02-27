"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, MessageSquare } from "lucide-react";
import IssueDetailsDialog from "./issue-details-dialog";
import UserAvatar from "./user-avatar";
import { useRouter } from "next/navigation";

const priorityColor = {
  LOW: "border-green-600",
  MEDIUM: "border-yellow-300",
  HIGH: "border-orange-400",
  URGENT: "border-red-400",
};

export default function IssueCard({
  issue,
  showStatus = false,
  onDelete = () => {},
  onUpdate = () => {},
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const onDeleteHandler = (...params) => {
    router.refresh();
    onDelete(...params);
  };

  const onUpdateHandler = (...params) => {
    router.refresh();
    onUpdate(...params);
  };

  const created = formatDistanceToNow(new Date(issue.createdAt), {
    addSuffix: true,
  });

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardHeader
          className={`border-t-2 ${priorityColor[issue.priority]} rounded-lg`}
        >
          <CardTitle>{issue.title}</CardTitle>
        </CardHeader>

        <CardContent className="flex gap-2 -mt-3">
          {showStatus && <Badge>{issue.status}</Badge>}
          <Badge variant="outline" className="-ml-1">
            {issue.priority}
          </Badge>
          {issue.department && (
            <Badge variant="secondary" className="ml-1">
              {issue.department.name}
            </Badge>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-3">
          <div className="flex justify-between w-full">
            <UserAvatar user={issue.assignee} />
            
            <div className="flex space-x-2">
              {/* Comment icon with count */}
              <div className="flex items-center text-gray-400 text-sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                <span>{issue.comments?.length || 0}</span>
              </div>
              
              {/* Chat icon */}
              {issue.conversation && (
                <MessageCircle
                  className={`h-4 w-4 ${
                    issue.conversation?.unreadMessages
                      ? "text-blue-500 fill-blue-500"
                      : "text-gray-400"
                  }`}
                />
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400 w-full">Created {created}</div>
        </CardFooter>
      </Card>

      {isDialogOpen && (
        <IssueDetailsDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          issue={issue}
          onDelete={onDeleteHandler}
          onUpdate={onUpdateHandler}
          borderCol={priorityColor[issue.priority]}
        />
      )}
    </>
  );
}
