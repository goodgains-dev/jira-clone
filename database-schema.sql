-- Jira Clone PostgreSQL Database Schema
-- This file contains all the SQL statements needed to create the database tables

-- Create ENUMs (custom types)
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');
CREATE TYPE "IssueStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE');
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create User table
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "clerkUserId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_clerkUserId_key" UNIQUE ("clerkUserId"),
  CONSTRAINT "User_email_key" UNIQUE ("email")
);

-- Create Project table
CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Project_organizationId_key_key" UNIQUE ("organizationId", "key")
);

-- Create Sprint table
CREATE TABLE "Sprint" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED',
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Sprint_name_key" UNIQUE ("name"),
  CONSTRAINT "Sprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Issue table
CREATE TABLE "Issue" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "IssueStatus" NOT NULL,
  "order" INTEGER NOT NULL,
  "priority" "IssuePriority" NOT NULL,
  "assigneeId" TEXT,
  "reporterId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sprintId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Issue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Issue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Issue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create index on Issue for status and order
CREATE INDEX "Issue_status_order_idx" ON "Issue"("status", "order");

-- Create Comment table
CREATE TABLE "Comment" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create ChatConversation table
CREATE TABLE "ChatConversation" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "streamChannelId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatConversation_issueId_key" UNIQUE ("issueId"),
  CONSTRAINT "ChatConversation_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ChatMessage table
CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create IssueAnalytic table
CREATE TABLE "IssueAnalytic" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "timeInTodo" INTEGER NOT NULL DEFAULT 0,
  "timeInProgress" INTEGER NOT NULL DEFAULT 0,
  "timeInReview" INTEGER NOT NULL DEFAULT 0,
  "completionTime" INTEGER,
  "statusChanges" INTEGER NOT NULL DEFAULT 0,
  "lastStatusChange" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "IssueAnalytic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IssueAnalytic_issueId_key" UNIQUE ("issueId"),
  CONSTRAINT "IssueAnalytic_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);