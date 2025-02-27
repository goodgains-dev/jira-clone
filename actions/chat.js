"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createStreamUserToken, createIssueChannel, upsertStreamUser } from "@/lib/stream";

/**
 * Initialize chat for issue
 * Creates both database entry and Stream channel
 */
export async function initializeIssueChat(issueId) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Get the issue with assignee and reporter
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      assignee: true,
      reporter: true,
      project: true,
    },
  });
  
  if (!issue) {
    throw new Error("Issue not found");
  }
  
  // Check if the project belongs to the current organization
  if (issue.project.organizationId !== orgId) {
    throw new Error("Unauthorized: Issue does not belong to your organization");
  }
  
  // Check if we already have a conversation for this issue
  const existingConversation = await db.chatConversation.findUnique({
    where: { issueId },
  });
  
  if (existingConversation) {
    return existingConversation;
  }
  
  // We need both an assignee and a reporter for a chat
  if (!issue.assignee) {
    throw new Error("Issue must have an assignee to start a chat");
  }
  
  // Create Stream channel
  const members = [issue.reporter.clerkUserId];
  if (issue.assignee) {
    members.push(issue.assignee.clerkUserId);
  }
  
  const streamChannelId = await createIssueChannel(
    issueId,
    issue.title,
    members
  );
  
  if (!streamChannelId) {
    throw new Error("Failed to create Stream channel");
  }
  
  // Create chat conversation in database
  const conversation = await db.chatConversation.create({
    data: {
      issueId,
      streamChannelId,
    },
  });
  
  return conversation;
}

/**
 * Get Stream chat token
 * Needed for client-side initialization
 */
export async function getStreamChatToken() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // Make sure the user exists in Stream
  await upsertStreamUser(userId);
  
  // Generate token for client
  const token = await createStreamUserToken(userId);
  
  if (!token) {
    throw new Error("Failed to generate Stream token");
  }
  
  return { token };
}

/**
 * Get chat conversation for issue
 */
export async function getChatForIssue(issueId) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // Get the issue
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      assignee: true,
      reporter: true,
      conversation: true,
    },
  });
  
  if (!issue) {
    throw new Error("Issue not found");
  }
  
  // Verify user is either assignee or reporter
  const isAuthorized = 
    issue.reporter.clerkUserId === userId || 
    (issue.assignee && issue.assignee.clerkUserId === userId);
  
  if (!isAuthorized) {
    throw new Error("You are not authorized to access this chat");
  }
  
  return issue.conversation;
}

/**
 * Check if user has unread messages
 */
export async function hasUnreadMessages() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Count unread messages where user is either assignee or reporter
  const unreadCount = await db.chatMessage.count({
    where: {
      conversation: {
        issue: {
          OR: [
            { reporterId: user.id },
            { assigneeId: user.id },
          ],
        },
      },
      senderId: { not: user.id },
      read: false,
    },
  });
  
  return unreadCount > 0;
}