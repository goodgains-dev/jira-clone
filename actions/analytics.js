"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Update analytics when an issue's status changes
 */
export async function updateIssueAnalytics(issueId, newStatus, previousStatus) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Get existing analytics or create new one
  let analytics = await db.issueAnalytic.findUnique({
    where: { issueId },
  });
  
  const now = new Date();
  
  if (analytics) {
    // Calculate time spent in previous status
    const timeDiff = Math.floor((now - new Date(analytics.lastStatusChange)) / 1000);
    
    const updates = {
      statusChanges: analytics.statusChanges + 1,
      lastStatusChange: now,
    };
    
    // Update time spent in previous status
    if (previousStatus === "TODO") {
      updates.timeInTodo = analytics.timeInTodo + timeDiff;
    } else if (previousStatus === "IN_PROGRESS") {
      updates.timeInProgress = analytics.timeInProgress + timeDiff;
    } else if (previousStatus === "IN_REVIEW") {
      updates.timeInReview = analytics.timeInReview + timeDiff;
    }
    
    // Calculate completion time if issue is being marked as done
    if (newStatus === "DONE" && previousStatus !== "DONE") {
      const totalTime = (analytics.timeInTodo || 0) + 
                        (analytics.timeInProgress || 0) + 
                        (analytics.timeInReview || 0) + 
                        timeDiff;
      updates.completionTime = totalTime;
    }
    
    // Update analytics
    analytics = await db.issueAnalytic.update({
      where: { id: analytics.id },
      data: updates,
    });
  } else {
    // Create new analytics entry
    analytics = await db.issueAnalytic.create({
      data: {
        issueId,
        statusChanges: 1,
        lastStatusChange: now,
      },
    });
  }
  
  return analytics;
}

/**
 * Get analytics for a project
 */
export async function getProjectAnalytics(projectId) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Check if project belongs to the organization
  const project = await db.project.findUnique({
    where: { id: projectId },
  });
  
  if (!project || project.organizationId !== orgId) {
    throw new Error("Project not found or unauthorized");
  }
  
  // Get all issues for the project
  const issues = await db.issue.findMany({
    where: { projectId },
    include: {
      analytics: true,
    },
  });
  
  // Calculate analytics
  const analytics = {
    totalIssues: issues.length,
    issuesByStatus: {
      TODO: issues.filter(issue => issue.status === "TODO").length,
      IN_PROGRESS: issues.filter(issue => issue.status === "IN_PROGRESS").length,
      IN_REVIEW: issues.filter(issue => issue.status === "IN_REVIEW").length,
      DONE: issues.filter(issue => issue.status === "DONE").length,
    },
    issuesByPriority: {
      LOW: issues.filter(issue => issue.priority === "LOW").length,
      MEDIUM: issues.filter(issue => issue.priority === "MEDIUM").length,
      HIGH: issues.filter(issue => issue.priority === "HIGH").length,
      URGENT: issues.filter(issue => issue.priority === "URGENT").length,
    },
    completedIssues: issues.filter(issue => issue.status === "DONE").length,
    averageCompletionTime: 0,
    totalTimeInTodo: 0,
    totalTimeInProgress: 0,
    totalTimeInReview: 0,
  };
  
  // Calculate times
  let issuesWithAnalytics = 0;
  let totalCompletionTime = 0;
  
  issues.forEach(issue => {
    if (issue.analytics) {
      issuesWithAnalytics++;
      analytics.totalTimeInTodo += issue.analytics.timeInTodo || 0;
      analytics.totalTimeInProgress += issue.analytics.timeInProgress || 0;
      analytics.totalTimeInReview += issue.analytics.timeInReview || 0;
      
      if (issue.status === "DONE" && issue.analytics.completionTime) {
        totalCompletionTime += issue.analytics.completionTime;
      }
    }
  });
  
  // Calculate averages
  const completedIssuesWithTime = issues.filter(
    issue => issue.status === "DONE" && issue.analytics?.completionTime
  ).length;
  
  if (completedIssuesWithTime > 0) {
    analytics.averageCompletionTime = Math.floor(totalCompletionTime / completedIssuesWithTime);
  }
  
  // Average time in each status per issue
  if (issuesWithAnalytics > 0) {
    analytics.averageTimeInTodo = Math.floor(analytics.totalTimeInTodo / issuesWithAnalytics);
    analytics.averageTimeInProgress = Math.floor(analytics.totalTimeInProgress / issuesWithAnalytics);
    analytics.averageTimeInReview = Math.floor(analytics.totalTimeInReview / issuesWithAnalytics);
  }
  
  return analytics;
}

/**
 * Get analytics for a sprint
 */
export async function getSprintAnalytics(sprintId) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Check if sprint belongs to the organization
  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: true,
    },
  });
  
  if (!sprint || sprint.project.organizationId !== orgId) {
    throw new Error("Sprint not found or unauthorized");
  }
  
  // Get all issues for the sprint
  const issues = await db.issue.findMany({
    where: { sprintId },
    include: {
      analytics: true,
    },
  });
  
  // Calculate analytics (similar to project analytics)
  const analytics = {
    totalIssues: issues.length,
    issuesByStatus: {
      TODO: issues.filter(issue => issue.status === "TODO").length,
      IN_PROGRESS: issues.filter(issue => issue.status === "IN_PROGRESS").length,
      IN_REVIEW: issues.filter(issue => issue.status === "IN_REVIEW").length,
      DONE: issues.filter(issue => issue.status === "DONE").length,
    },
    issuesByPriority: {
      LOW: issues.filter(issue => issue.priority === "LOW").length,
      MEDIUM: issues.filter(issue => issue.priority === "MEDIUM").length,
      HIGH: issues.filter(issue => issue.priority === "HIGH").length,
      URGENT: issues.filter(issue => issue.priority === "URGENT").length,
    },
    completedIssues: issues.filter(issue => issue.status === "DONE").length,
    averageCompletionTime: 0,
  };
  
  // Calculate completion rate
  analytics.completionRate = sprint.status === "COMPLETED" 
    ? (analytics.completedIssues / analytics.totalIssues) * 100 
    : 0;
  
  // Calculate average completion time
  const completedIssuesWithTime = issues.filter(
    issue => issue.status === "DONE" && issue.analytics?.completionTime
  );
  
  if (completedIssuesWithTime.length > 0) {
    const totalCompletionTime = completedIssuesWithTime.reduce(
      (sum, issue) => sum + issue.analytics.completionTime, 0
    );
    analytics.averageCompletionTime = Math.floor(totalCompletionTime / completedIssuesWithTime.length);
  }
  
  return analytics;
}

/**
 * Get user completion analytics for an organization
 */
export async function getUserCompletionAnalytics(organizationId) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Validate that the requested organization is the current organization
  if (organizationId !== orgId) {
    throw new Error("Unauthorized: You can only access analytics for your current organization");
  }
  
  // Get all projects for the organization
  const projects = await db.project.findMany({
    where: { organizationId },
    select: { id: true },
  });
  
  const projectIds = projects.map(project => project.id);
  
  // Get all users who have been assigned tickets in this organization
  const usersWithAssignedTickets = await db.user.findMany({
    where: {
      assignedIssues: {
        some: {
          projectId: {
            in: projectIds
          }
        }
      }
    },
    include: {
      assignedIssues: {
        where: {
          projectId: {
            in: projectIds
          }
        },
        select: {
          id: true,
          status: true
        }
      }
    }
  });
  
  // Calculate completion stats for each user
  const userCompletionData = usersWithAssignedTickets.map(user => {
    const totalAssigned = user.assignedIssues.length;
    const completedCount = user.assignedIssues.filter(issue => issue.status === "DONE").length;
    
    return {
      id: user.id,
      name: user.name || "Unknown User",
      imageUrl: user.imageUrl,
      totalAssigned,
      completedCount,
      completionRate: totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0
    };
  });
  
  // Sort by number of completed tickets (highest first)
  return userCompletionData.sort((a, b) => b.completedCount - a.completedCount);
}

/**
 * Get analytics for an organization
 */
export async function getOrganizationAnalytics(organizationId) {
  const { userId, orgId } = auth();
  
  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  // Validate that the requested organization is the current organization
  if (organizationId !== orgId) {
    throw new Error("Unauthorized: You can only access analytics for your current organization");
  }
  
  // Get all projects for the organization
  const projects = await db.project.findMany({
    where: { organizationId },
    include: {
      issues: {
        include: {
          analytics: true,
        },
      },
      sprints: true,
    },
  });
  
  // Gather all issues across all projects
  const allIssues = projects.flatMap(project => project.issues);
  
  // Calculate analytics
  const analytics = {
    totalProjects: projects.length,
    totalSprints: projects.reduce((count, project) => count + project.sprints.length, 0),
    totalIssues: allIssues.length,
    issuesByStatus: {
      TODO: allIssues.filter(issue => issue.status === "TODO").length,
      IN_PROGRESS: allIssues.filter(issue => issue.status === "IN_PROGRESS").length,
      IN_REVIEW: allIssues.filter(issue => issue.status === "IN_REVIEW").length,
      DONE: allIssues.filter(issue => issue.status === "DONE").length,
    },
    issuesByPriority: {
      LOW: allIssues.filter(issue => issue.priority === "LOW").length,
      MEDIUM: allIssues.filter(issue => issue.priority === "MEDIUM").length,
      HIGH: allIssues.filter(issue => issue.priority === "HIGH").length,
      URGENT: allIssues.filter(issue => issue.priority === "URGENT").length,
    },
    completedIssues: allIssues.filter(issue => issue.status === "DONE").length,
    averageCompletionTime: 0,
    projectPerformance: [],
  };
  
  // Calculate total and average completion times
  let totalCompletionTime = 0;
  let issuesWithCompletionTime = 0;
  
  allIssues.forEach(issue => {
    if (issue.analytics && issue.status === "DONE" && issue.analytics.completionTime) {
      totalCompletionTime += issue.analytics.completionTime;
      issuesWithCompletionTime++;
    }
  });
  
  if (issuesWithCompletionTime > 0) {
    analytics.averageCompletionTime = Math.floor(totalCompletionTime / issuesWithCompletionTime);
  }
  
  // Calculate project-specific performance
  analytics.projectPerformance = projects.map(project => {
    const projectIssues = project.issues;
    const completedIssues = projectIssues.filter(issue => issue.status === "DONE").length;
    const completionRate = projectIssues.length > 0
      ? (completedIssues / projectIssues.length) * 100
      : 0;
    
    return {
      id: project.id,
      name: project.name,
      key: project.key,
      totalIssues: projectIssues.length,
      completedIssues,
      completionRate,
    };
  });
  
  // Add user completion data
  analytics.userCompletionData = await getUserCompletionAnalytics(organizationId);
  
  return analytics;
}

/**
 * Helper function to format time in seconds to human readable format
 */
export async function formatTime(seconds) {
  if (!seconds) return "N/A";
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  result += `${minutes}m`;
  
  return result;
}
