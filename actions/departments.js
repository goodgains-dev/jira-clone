"use server";

// Import the shared database client
import { db, getConnectedPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Get departments for a project
 * Now includes members and their details
 */
export async function getDepartments(projectId) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      console.log("Auth failed in getDepartments");
      return []; // Return empty array instead of throwing
    }
    
    console.log("[getDepartments] Getting departments for project:", projectId);
    
    // Get departments with members - using direct db import
    const departments = await db.department.findMany({
      where: { projectId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      },
      orderBy: { name: 'asc' },
    });
    
    console.log("[getDepartments] Found departments:", departments.length);
    return departments;
  } catch (error) {
    console.error("[getDepartments] Error:", error);
    return []; // Return empty array on any error
  }
}

/**
 * Create a new department
 * Now supports adding members during creation
 */
export async function createDepartment(projectId, { name, description, departmentHeadId, memberIds = [] }) {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }
  
  try {
    console.log("[createDepartment] Starting with:", { projectId, name, description });
    
    // Check if project exists and belongs to the organization
    const project = await db.project.findFirst({
      where: { 
        id: projectId,
        organizationId: orgId
      },
    });
    
    if (!project) {
      throw new Error("Project not found or unauthorized");
    }
    
    // Check if department with same name already exists in this project
    const existingDepartment = await db.department.findFirst({
      where: {
        projectId,
        name
      }
    });
    
    if (existingDepartment) {
      throw new Error(`Department with name "${name}" already exists in this project`);
    }
    
    // Get user records for the members
    let userRecords = [];
    if (memberIds && memberIds.length > 0) {
      userRecords = await db.user.findMany({
        where: {
          clerkUserId: {
            in: memberIds
          }
        }
      });
      
      if (userRecords.length !== memberIds.length) {
        console.warn("[createDepartment] Some member users not found");
      }
    }
    
    // Create the department using a transaction for consistency
    console.log("[createDepartment] Creating department...");
    const department = await db.$transaction(async (prisma) => {
      // Create the department
      const newDepartment = await prisma.department.create({
        data: {
          name,
          description: description || "",
          projectId,
          departmentHeadId: departmentHeadId || null,
          // Create department members if any
          members: userRecords.length > 0 ? {
            create: userRecords.map(user => ({
              userId: user.id,
              role: "Member"
            }))
          } : undefined
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      });
      
      return newDepartment;
    });
    
    console.log("[createDepartment] Department created:", department);
    
    return department;
  } catch (error) {
    console.error("[createDepartment] Error:", error);
    throw new Error("Failed to create department: " + error.message);
  }
}

/**
 * Update a department
 * Admin only - now supports updating members
 */
export async function updateDepartment(departmentId, { name, description, departmentHeadId, memberIds = [] }) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      throw new Error("Unauthorized");
    }
    
    console.log("[updateDepartment] Updating department:", { departmentId, name, description });
    
    // Get department with project info - using direct db import
    const department = await db.department.findUnique({
      where: { id: departmentId },
      include: { project: true },
    });
    
    if (!department) {
      throw new Error("Department not found");
    }
    
    if (department.project.organizationId !== orgId) {
      throw new Error("Department not found or unauthorized");
    }
    
    // Get user records for the members
    let userRecords = [];
    if (memberIds && memberIds.length > 0) {
      userRecords = await db.user.findMany({
        where: {
          clerkUserId: {
            in: memberIds
          }
        }
      });
      
      if (userRecords.length !== memberIds.length) {
        console.warn("[updateDepartment] Some member users not found");
      }
    }
    
    // Update department in a transaction to handle members
    const updatedDepartment = await db.$transaction(async (prisma) => {
      // First delete existing members
      await prisma.departmentMember.deleteMany({
        where: { departmentId }
      });
      
      // Then update the department with new members
      const updated = await prisma.department.update({
        where: { id: departmentId },
        data: {
          name,
          description: description || "",
          departmentHeadId: departmentHeadId || null,
          // Create new department members
          members: userRecords.length > 0 ? {
            create: userRecords.map(user => ({
              userId: user.id,
              role: "Member"
            }))
          } : undefined
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      });
      
      return updated;
    });
    
    console.log("[updateDepartment] Department updated successfully");
    return updatedDepartment;
  } catch (error) {
    console.error("[updateDepartment] Error:", error);
    throw new Error("Failed to update department: " + error.message);
  }
}

/**
 * Delete a department
 * Admin only
 */
export async function deleteDepartment(departmentId) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      throw new Error("Unauthorized");
    }
    
    console.log("[deleteDepartment] Deleting department:", departmentId);
    
    // Check if department belongs to the organization - using direct db import
    const department = await db.department.findUnique({
      where: { id: departmentId },
      include: { project: true },
    });
    
    if (!department) {
      throw new Error("Department not found");
    }
    
    if (department.project.organizationId !== orgId) {
      throw new Error("Department not found or unauthorized");
    }
    
    // Delete department
    await db.department.delete({
      where: { id: departmentId },
    });
    
    console.log("[deleteDepartment] Department deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("[deleteDepartment] Error:", error);
    throw new Error("Failed to delete department: " + error.message);
  }
}

/**
 * Assign issue to a department
 */
/**
 * Add a member to a department
 */
export async function addDepartmentMember(departmentId, userId, role = "Member") {
  try {
    const { userId: currentUserId, orgId } = auth();
    
    if (!currentUserId || !orgId) {
      throw new Error("Unauthorized");
    }
    
    console.log("[addDepartmentMember] Adding member:", { departmentId, userId, role });
    
    // Get department with project info
    const department = await db.department.findUnique({
      where: { id: departmentId },
      include: { project: true },
    });
    
    if (!department) {
      throw new Error("Department not found");
    }
    
    if (department.project.organizationId !== orgId) {
      throw new Error("Department not found or unauthorized");
    }
    
    // Get the user record from clerk user ID
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if member already exists
    const existingMember = await db.departmentMember.findFirst({
      where: {
        departmentId,
        userId: user.id
      }
    });
    
    if (existingMember) {
      throw new Error("User is already a member of this department");
    }
    
    // Add member
    const member = await db.departmentMember.create({
      data: {
        departmentId,
        userId: user.id,
        role
      },
      include: {
        user: true
      }
    });
    
    console.log("[addDepartmentMember] Member added successfully");
    return member;
  } catch (error) {
    console.error("[addDepartmentMember] Error:", error);
    throw new Error("Failed to add department member: " + error.message);
  }
}

/**
 * Remove a member from a department
 */
export async function removeDepartmentMember(departmentId, memberId) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      throw new Error("Unauthorized");
    }
    
    console.log("[removeDepartmentMember] Removing member:", { departmentId, memberId });
    
    // Get department with project info
    const department = await db.department.findUnique({
      where: { id: departmentId },
      include: { project: true },
    });
    
    if (!department) {
      throw new Error("Department not found");
    }
    
    if (department.project.organizationId !== orgId) {
      throw new Error("Department not found or unauthorized");
    }
    
    // Check if member exists
    const member = await db.departmentMember.findFirst({
      where: {
        id: memberId,
        departmentId
      }
    });
    
    if (!member) {
      throw new Error("Member not found in this department");
    }
    
    // Remove member
    await db.departmentMember.delete({
      where: { id: memberId }
    });
    
    console.log("[removeDepartmentMember] Member removed successfully");
    return { success: true };
  } catch (error) {
    console.error("[removeDepartmentMember] Error:", error);
    throw new Error("Failed to remove department member: " + error.message);
  }
}

/**
 * Get department members
 */
export async function getDepartmentMembers(departmentId) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      console.log("Auth failed in getDepartmentMembers");
      return []; // Return empty array instead of throwing
    }
    
    console.log("[getDepartmentMembers] Getting members for department:", departmentId);
    
    // Get department with project info to check permissions
    const department = await db.department.findUnique({
      where: { id: departmentId },
      include: { project: true },
    });
    
    if (!department) {
      console.log("Department not found");
      return [];
    }
    
    if (department.project.organizationId !== orgId) {
      console.log("Unauthorized access to department");
      return [];
    }
    
    // Get members
    const members = await db.departmentMember.findMany({
      where: { departmentId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log("[getDepartmentMembers] Found members:", members.length);
    return members;
  } catch (error) {
    console.error("[getDepartmentMembers] Error:", error);
    return []; // Return empty array on any error
  }
}

export async function assignIssueToDepartment(issueId, departmentId) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      throw new Error("Unauthorized");
    }
    
    console.log("[assignIssueToDepartment] Assigning department:", { issueId, departmentId });
    
    // Get the issue - using direct db import
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: { project: true },
    });
    
    if (!issue) {
      throw new Error("Issue not found");
    }
    
    // Check organization permission
    if (issue.project.organizationId !== orgId) {
      throw new Error("Unauthorized: Issue does not belong to your organization");
    }
    
    // Convert "null" string to actual null
    const finalDepartmentId = departmentId === "null" ? null : departmentId;
    
    // If departmentId is provided (and not null), verify it exists
    if (finalDepartmentId) {
      const department = await db.department.findUnique({
        where: { id: finalDepartmentId },
      });
      
      if (!department) {
        throw new Error("Department not found");
      }
      
      if (department.projectId !== issue.projectId) {
        throw new Error("Department does not belong to the same project as the issue");
      }
    }
    
    // Update the issue
    const updatedIssue = await db.issue.update({
      where: { id: issueId },
      data: {
        departmentId: finalDepartmentId,
      },
      include: {
        department: true,
        reporter: true,
        assignee: true,
      },
    });
    
    console.log("[assignIssueToDepartment] Successfully assigned department");
    return updatedIssue;
  } catch (error) {
    console.error("[assignIssueToDepartment] Error:", error);
    throw new Error("Failed to assign department: " + error.message);
  }
}
