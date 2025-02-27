"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Create a new comment for an issue
 */
export async function createComment(issueId, content) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId } 
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Verify that issue exists
  const issue = await db.issue.findUnique({
    where: { id: issueId },
  });
  
  if (!issue) {
    throw new Error("Issue not found");
  }
  
  // Create the comment
  const comment = await db.comment.create({
    data: {
      content,
      issueId,
      authorId: user.id,
    },
    include: {
      author: true,
    },
  });
  
  return comment;
}

/**
 * Get all comments for an issue
 */
export async function getCommentsForIssue(issueId) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  // Verify that issue exists
  const issue = await db.issue.findUnique({
    where: { id: issueId },
  });
  
  if (!issue) {
    throw new Error("Issue not found");
  }
  
  // Get comments
  const comments = await db.comment.findMany({
    where: { issueId },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  
  return comments;
}

/**
 * Update a comment
 */
export async function updateComment(commentId, content) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId } 
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Find the comment
  const comment = await db.comment.findUnique({
    where: { id: commentId },
  });
  
  if (!comment) {
    throw new Error("Comment not found");
  }
  
  // Verify ownership
  if (comment.authorId !== user.id) {
    throw new Error("You do not have permission to update this comment");
  }
  
  // Update the comment
  const updatedComment = await db.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      author: true,
    },
  });
  
  return updatedComment;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId) {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const user = await db.user.findUnique({ 
    where: { clerkUserId: userId } 
  });
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // Find the comment
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    include: {
      issue: {
        include: {
          project: true,
        },
      },
    },
  });
  
  if (!comment) {
    throw new Error("Comment not found");
  }
  
  // Check if user is author or has admin role in the organization
  const isAdmin = await isOrgAdmin(comment.issue.project.organizationId);
  
  if (comment.authorId !== user.id && !isAdmin) {
    throw new Error("You do not have permission to delete this comment");
  }
  
  // Delete the comment
  await db.comment.delete({
    where: { id: commentId },
  });
  
  return { success: true };
}

/**
 * Helper function to check if user is an admin in the organization
 */
async function isOrgAdmin(organizationId) {
  const { userId, orgId, orgRole } = auth();
  
  if (!userId || !orgId || orgId !== organizationId) {
    return false;
  }
  
  return orgRole === "org:admin";
}