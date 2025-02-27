"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { updateIssueAnalytics } from "./analytics";
import { getStreamServerClient } from "@/lib/stream";

export async function getIssuesForSprint(sprintId) {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const issues = await db.issue.findMany({
    where: { sprintId: sprintId },
    orderBy: [{ status: "asc" }, { order: "asc" }],
    include: {
      assignee: true,
      reporter: true,
    },
  });

  return issues;
}

export async function createIssue(projectId, data) {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  let user = await db.user.findUnique({ where: { clerkUserId: userId } });

  const lastIssue = await db.issue.findFirst({
    where: { projectId, status: data.status },
    orderBy: { order: "desc" },
  });

  const newOrder = lastIssue ? lastIssue.order + 1 : 0;

  // Create issue in a transaction to ensure both issue and analytics are created
  const issue = await db.$transaction(async (prisma) => {
    // Create the issue
    const newIssue = await prisma.issue.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        projectId: projectId,
        sprintId: data.sprintId,
        reporterId: user.id,
        assigneeId: data.assigneeId || null,
        departmentId: data.departmentId || null, // This now stores the department name as a string
        order: newOrder,
      },
      include: {
        assignee: true,
        reporter: true,
      },
    });
    
    // Create analytics entry for new issue
    await prisma.issueAnalytic.create({
      data: {
        issueId: newIssue.id,
        lastStatusChange: new Date(),
      },
    });
    
    // Always create chat conversation automatically if assignee exists
    if (data.assigneeId) {
      // Create database entry for chat
      const conversation = await prisma.chatConversation.create({
        data: {
          issueId: newIssue.id,
        },
      });
      
      // Get the user IDs for Stream channel creation
      const assignee = await prisma.user.findUnique({
        where: { id: data.assigneeId },
        select: { clerkUserId: true }
      });
      
      // Initialize Stream channel asynchronously (don't wait for completion)
      if (assignee) {
        // We'll initialize the Stream channel in the background
        try {
          const streamClient = getStreamServerClient();
          if (streamClient) {
            const channelId = `issue-${newIssue.id}`;
            // This will happen asynchronously after the transaction
            streamClient.upsertUser({
              id: user.clerkUserId,
              name: user.name || 'Reporter',
            }).then(() => {
              streamClient.upsertUser({
                id: assignee.clerkUserId,
                name: assignee.name || 'Assignee',
              }).then(() => {
                streamClient.channel('messaging', channelId, {
                  name: `Issue: ${newIssue.title}`,
                  members: [user.clerkUserId, assignee.clerkUserId],
                }).create();
              });
            });
          }
        } catch (error) {
          // Log error but don't fail the transaction
          console.error('Error creating Stream channel:', error);
        }
      }
    }
    
    return newIssue;
  });

  return issue;
}

export async function updateIssueOrder(updatedIssues) {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  // Get current issues to compare states
  const issueIds = updatedIssues.map(issue => issue.id);
  const currentIssues = await db.issue.findMany({
    where: { id: { in: issueIds } },
    select: { id: true, status: true },
  });

  // Create a map of current statuses
  const statusMap = {};
  currentIssues.forEach(issue => {
    statusMap[issue.id] = issue.status;
  });

  // Start a transaction
  await db.$transaction(async (prisma) => {
    // Update each issue
    for (const issue of updatedIssues) {
      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          status: issue.status,
          order: issue.order,
        },
      });
      
      // Update analytics if status changed
      if (issue.status !== statusMap[issue.id]) {
        await updateIssueAnalytics(issue.id, issue.status, statusMap[issue.id]);
      }
    }
  });

  return { success: true };
}

export async function deleteIssue(issueId) {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: { project: true },
  });

  if (!issue) {
    throw new Error("Issue not found");
  }

  if (
    issue.reporterId !== user.id &&
    !issue.project.adminIds.includes(user.id)
  ) {
    throw new Error("You don't have permission to delete this issue");
  }

  await db.issue.delete({ where: { id: issueId } });

  return { success: true };
}

export async function updateIssue(issueId, data) {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  try {
    // Get current issue state
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        assignee: true,
        reporter: true
      },
    });

    if (!issue) {
      throw new Error("Issue not found");
    }

    if (issue.project.organizationId !== orgId) {
      throw new Error("Unauthorized");
    }

    // Use a transaction to ensure all updates happen together
    const updatedIssue = await db.$transaction(async (prisma) => {
      // Update the issue
      const updated = await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: data.status,
          priority: data.priority,
          assigneeId: data.assigneeId,
          description: data.description,
          departmentId: data.departmentId,
        },
        include: {
          assignee: true,
          reporter: true,
        },
      });
      
      // Update analytics if status changed
      if (data.status && data.status !== issue.status) {
        await updateIssueAnalytics(issueId, data.status, issue.status);
      }
      
      // Create chat if assignee is being set for the first time
      if (data.assigneeId && !issue.assigneeId) {
        await prisma.chatConversation.create({
          data: {
            issueId,
          },
        });
      }
      
      return updated;
    });

    return updatedIssue;
  } catch (error) {
    throw new Error("Error updating issue: " + error.message);
  }
}
