"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Get user details from Clerk
 */
export async function getClerkUserDetails(clerkUserId) {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress,
    };
  } catch (error) {
    console.error("Error fetching Clerk user:", error);
    return null;
  }
}

/**
 * Create a chat conversation for an issue
 */
export async function createChatForIssue(issueId) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Get issue with assignee and reporter
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      assignee: true,
      reporter: true,
    },
  });
  
  if (!issue) {
    throw new Error("Issue not found");
  }
  
  // Create chat in database
  const chat = await db.chatConversation.create({
    data: {
      issueId,
    },
  });
  
  return chat;
}

/**
 * Send a chat message
 */
export async function sendChatMessage(conversationId, content) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  const conversation = await db.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      issue: {
        include: {
          assignee: true,
          reporter: true,
        },
      },
    },
  });
  
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  
  // Check if user is either assignee or reporter
  const isAuthorized = 
    conversation.issue.assignee?.id === user.id || 
    conversation.issue.reporter.id === user.id;
  
  if (!isAuthorized) {
    throw new Error("You are not authorized to send messages in this conversation");
  }
  
  // Store message in database
  const message = await db.chatMessage.create({
    data: {
      content,
      conversationId,
      senderId: user.id,
    },
    include: {
      sender: true,
    },
  });
  
  return message;
}

/**
 * Get messages for a conversation
 */
export async function getMessagesForConversation(conversationId) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  const conversation = await db.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      issue: {
        include: {
          assignee: true,
          reporter: true,
        },
      },
    },
  });
  
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  
  // Check if user is either assignee or reporter
  const isAuthorized = 
    conversation.issue.assignee?.id === user.id || 
    conversation.issue.reporter.id === user.id;
  
  if (!isAuthorized) {
    throw new Error("You are not authorized to view messages in this conversation");
  }
  
  const messages = await db.chatMessage.findMany({
    where: { conversationId },
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  
  return messages;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Mark all unread messages as read
  await db.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: user.id },
      read: false,
    },
    data: {
      read: true,
    },
  });
  
  return { success: true };
}

/**
 * Get unread message count
 */
export async function getUnreadMessageCount() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Get all conversations where the user is either assignee or reporter
  const issues = await db.issue.findMany({
    where: {
      OR: [
        { assigneeId: user.id },
        { reporterId: user.id },
      ],
    },
    include: {
      conversation: true,
    },
  });
  
  const conversationIds = issues
    .filter(issue => issue.conversation)
    .map(issue => issue.conversation.id);
  
  // Count unread messages
  const unreadCount = await db.chatMessage.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: user.id },
      read: false,
    },
  });
  
  return unreadCount;
}