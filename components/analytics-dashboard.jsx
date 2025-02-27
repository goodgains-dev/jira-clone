"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectAnalytics, formatTime } from "@/actions/analytics";
import { BarLoader } from "react-spinners";
import useFetch from "@/hooks/use-fetch";

/**
 * Analytics Dashboard component to display project metrics
 */
export default function AnalyticsDashboard({ projectId }) {
  const {
    loading: analyticsLoading,
    error: analyticsError,
    fn: fetchAnalytics,
    data: analytics,
  } = useFetch(getProjectAnalytics);

  useEffect(() => {
    if (projectId) {
      fetchAnalytics(projectId);
    }
  }, [projectId, fetchAnalytics]);

  if (analyticsLoading) {
    return <BarLoader width={"100%"} color="#36d7b7" />;
  }

  if (analyticsError) {
    return (
      <div className="text-red-500 p-4">
        Error loading analytics: {analyticsError.message}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-gray-500 p-4">No analytics data available</div>
    );
  }

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (analytics.completedIssues / analytics.totalIssues) * 100
  ) || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Project Analytics</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalIssues}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.completedIssues}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({completionPercentage}%)
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Completion Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(analytics.averageCompletionTime)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.issuesByStatus.IN_PROGRESS +
                analytics.issuesByStatus.IN_REVIEW}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Issues by Status */}
      <Card>
        <CardHeader>
          <CardTitle>Issues by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.issuesByStatus).map(([status, count]) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{formatStatusName(status)}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className={`h-full rounded-full ${getStatusColor(status)}`}
                    style={{
                      width: `${
                        (count / analytics.totalIssues) * 100 || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Issues by Priority */}
      <Card>
        <CardHeader>
          <CardTitle>Issues by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.issuesByPriority).map(
              ([priority, count]) => (
                <div key={priority} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{priority}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${getPriorityColor(
                        priority
                      )}`}
                      style={{
                        width: `${
                          (count / analytics.totalIssues) * 100 || 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Time in States */}
      {analytics.issuesWithAnalytics > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Average Time in States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Todo</span>
                  <span className="text-gray-500">
                    {formatTime(analytics.averageTimeInTodo)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">In Progress</span>
                  <span className="text-gray-500">
                    {formatTime(analytics.averageTimeInProgress)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">In Review</span>
                  <span className="text-gray-500">
                    {formatTime(analytics.averageTimeInReview)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function formatStatusName(status) {
  switch (status) {
    case "TODO":
      return "To Do";
    case "IN_PROGRESS":
      return "In Progress";
    case "IN_REVIEW":
      return "In Review";
    case "DONE":
      return "Done";
    default:
      return status;
  }
}

function getStatusColor(status) {
  switch (status) {
    case "TODO":
      return "bg-blue-400";
    case "IN_PROGRESS":
      return "bg-yellow-400";
    case "IN_REVIEW":
      return "bg-indigo-400";
    case "DONE":
      return "bg-green-400";
    default:
      return "bg-gray-400";
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case "LOW":
      return "bg-green-400";
    case "MEDIUM":
      return "bg-blue-400";
    case "HIGH":
      return "bg-orange-400";
    case "URGENT":
      return "bg-red-400";
    default:
      return "bg-gray-400";
  }
}