"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUser, useOrganization } from "@clerk/nextjs";
import { BarLoader } from "react-spinners";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Analytics page for project
 */
export default function ProjectAnalyticsPage() {
  const params = useParams();
  const projectId = params.projectId;
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { isLoaded: orgLoaded, organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);

  // Check loading state
  useEffect(() => {
    if (userLoaded && orgLoaded) {
      setIsLoading(false);
    }
  }, [userLoaded, orgLoaded]);

  // Show loader while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <BarLoader color="#36d7b7" />
      </div>
    );
  }

  // Check auth
  if (!isSignedIn || !organization) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500">
          You must be signed in to an organization to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Analytics</h1>
        <Link href={`/project/${projectId}`}>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Project
          </Button>
        </Link>
      </div>

      <AnalyticsDashboard projectId={projectId} />
    </div>
  );
}