import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET(request) {
  try {
    // Get auth info
    const authInfo = auth();
    const userId = authInfo?.userId;
    const userOrgId = authInfo?.orgId;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const queryOrgId = url.searchParams.get("orgId");
    
    // Use either the query param orgId or the user's current orgId
    const orgId = queryOrgId || userOrgId;
    
    if (!orgId) {
      return new Response(
        JSON.stringify({ error: "Organization ID is required" }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get all projects for this organization
    const projects = await db.project.findMany({
      where: {
        organizationId: orgId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return new Response(
      JSON.stringify({ projects }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to fetch projects", details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}