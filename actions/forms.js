"use server";

import { revalidatePath } from "next/cache";
import { db as prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Get all forms for a project
export async function getProjectForms(projectId) {
  try {
    // Get forms for the project from database
    const forms = await prisma.form.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: true
      }
    });
    
    return {
      success: true,
      forms: await Promise.all(forms.map(async (form) => {
        // Get form views count
        const viewCount = await prisma.formView.count({
          where: { formId: form.id }
        });
        
        return {
          id: form.id,
          name: form.name,
          description: form.description,
          projectId: form.projectId,
          submissionCount: form.submissions.length,
          viewCount,
          createdAt: form.createdAt.toISOString(),
        };
      })),
    };
  } catch (error) {
    console.error("Error getting forms:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get a form by ID
export async function getFormById(formId) {
  try {
    // Get form from database
    const form = await prisma.form.findUnique({
      where: { id: formId }
    });
    
    if (!form) {
      console.log(`Form not found in database for ID: ${formId}`);
      return {
        success: false,
        error: "Form not found"
      };
    }
    
    return {
      success: true,
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: form.fields,
        projectId: form.projectId,
        createdAt: form.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error getting form:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Create a new form
export async function createForm(formData) {
  console.log("createForm called with data:", formData);
  
  try {
    // Get the current auth session
    const { userId, orgId } = auth();
    console.log("Auth session:", { userId, orgId });
    
    if (!userId || !orgId) {
      console.log("No user or organization found, returning error");
      return {
        success: false,
        error: "You must be logged in to an organization to create a form"
      };
    }
    
    // Validate input data
    if (!formData.name) {
      console.log("Form name is missing");
      return {
        success: false,
        error: "Form name is required"
      };
    }
    
    if (!formData.projectId) {
      console.log("Project ID is missing");
      return {
        success: false,
        error: "Project ID is required"
      };
    }
    
    if (!formData.fields) {
      console.log("Form fields are missing");
      return {
        success: false,
        error: "Form fields are required"
      };
    }
    
    console.log("Creating form with data:", {
      name: formData.name,
      description: formData.description,
      projectId: formData.projectId,
      createdBy: userId
    });
    
    // For development purposes, if the project doesn't exist, create a mock project
    let projectExists = true;
    try {
      const project = await prisma.project.findUnique({
        where: { id: formData.projectId },
        select: { id: true }
      });
      
      if (!project) {
        projectExists = false;
        
        // Extract organization ID from project ID (assuming format: project-{orgId})
        let organizationId = orgId; // Use the current organization ID
        const projectIdMatch = formData.projectId.match(/^project-(.+)$/);
        if (projectIdMatch && projectIdMatch[1]) {
          organizationId = projectIdMatch[1];
        }
        
        console.log(`Project not found, creating a project with ID: ${formData.projectId} for organization: ${organizationId}`);
        await prisma.project.create({
          data: {
            id: formData.projectId,
            name: "Form Project",
            key: `FORM${Date.now().toString().slice(-4)}`,
            description: "Project for storing forms",
            organizationId: organizationId,
          }
        });
      }
    } catch (error) {
      console.error("Error checking project:", error);
      return {
        success: false,
        error: `Failed to check or create project: ${error.message}`
      };
    }
    
    // Ensure fields is a valid JSON string
    let fieldsJson = formData.fields;
    
    // If fields is not a string, try to stringify it
    if (typeof formData.fields !== 'string') {
      console.log("Fields is not a string, attempting to stringify");
      try {
        fieldsJson = JSON.stringify(formData.fields);
      } catch (error) {
        console.error("Error stringifying fields:", error);
        return {
          success: false,
          error: "Invalid form fields format"
        };
      }
    }
    
    // Validate that fields is a valid JSON string
    try {
      JSON.parse(fieldsJson);
    } catch (error) {
      console.error("Fields is not valid JSON:", error);
      return {
        success: false,
        error: "Invalid form fields format"
      };
    }
    
    console.log("Creating form with fields:", fieldsJson);
    
    // Create a new form in the database
    try {
      console.log("Attempting to create form in database...");
      const form = await prisma.form.create({
        data: {
          name: formData.name,
          description: formData.description || "",
          fields: fieldsJson,
          projectId: formData.projectId,
        }
      });
      console.log("Form created successfully:", form.id);
      
      // If we get here, the form was created successfully
      if (!form) {
        console.error("Form is undefined after successful creation");
        return {
          success: false,
          error: "Failed to create form in database"
        };
      }
      
      // Return the created form
      return {
        success: true,
        form: {
          id: form.id,
          name: form.name,
          description: form.description,
          fields: form.fields,
          projectId: form.projectId,
          createdAt: form.createdAt.toISOString(),
        },
      };
    } catch (dbError) {
      console.error("Database error creating form:", dbError);
      return {
        success: false,
        error: `Database error creating form: ${dbError.message}`
      };
    }
  } catch (error) {
    console.error("Error creating form:", error);
    
    // Provide more detailed error messages
    if (error.code === 'P2003') {
      return {
        success: false,
        error: "The project ID does not exist. Please provide a valid project ID."
      };
    }
    
    if (error.code === 'P2002') {
      return {
        success: false,
        error: "A form with this name already exists for this project."
      };
    }
    
    return {
      success: false,
      error: `Failed to create form: ${error.message}`,
    };
  }
}

// Submit a form response
export async function submitFormResponse(formId, responseData, userData = null) {
  try {
    // Check if form exists
    const formExists = await prisma.form.findUnique({
      where: { id: formId },
      select: { id: true }
    });
    
    if (!formExists) {
      console.log(`Form not found in database for ID: ${formId}`);
      return {
        success: false,
        error: "Form not found"
      };
    }
    
    // Create a new form submission record
    try {
      const submission = await prisma.formSubmission.create({
        data: {
          formId,
          data: responseData,
          userName: userData?.name,
          userEmail: userData?.email,
        }
      });
      
      if (!submission) {
        console.error("Submission is undefined after creation attempt");
        return {
          success: false,
          error: "Failed to create form submission in database"
        };
      }
      
      return {
        success: true,
        response: {
          id: submission.id,
          formId: submission.formId,
          data: submission.data,
          userName: submission.userName,
          userEmail: submission.userEmail,
          createdAt: submission.createdAt.toISOString(),
        },
      };
    } catch (error) {
      console.error("Error creating submission:", error);
      return {
        success: false,
        error: `Failed to create submission: ${error.message}`
      };
    }
  } catch (error) {
    console.error("Error submitting form response:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get form submissions
export async function getFormSubmissions(formId) {
  try {
    // Get form submissions from database
    const submissions = await prisma.formSubmission.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      submissions: submissions.map(sub => ({
        id: sub.id,
        formId: sub.formId,
        data: sub.data,
        userName: sub.userName || 'Anonymous',
        userEmail: sub.userEmail || 'N/A',
        createdAt: sub.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting form submissions:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Track form view
export async function trackFormView(formId, userData = null) {
  try {
    // Check if form exists
    const formExists = await prisma.form.findUnique({
      where: { id: formId },
      select: { id: true }
    });
    
    if (!formExists) {
      console.log(`Form not found in database for ID: ${formId}`);
      return {
        success: false,
        error: "Form not found"
      };
    }
    
    // Create a new form view record
    try {
      const formView = await prisma.formView.create({
        data: {
          formId,
          userId: userData?.id,
          userEmail: userData?.email,
          userName: userData?.name,
        }
      });
      
      if (!formView) {
        console.error("Form view is undefined after creation attempt");
        return {
          success: false,
          error: "Failed to create form view in database"
        };
      }
      
      return {
        success: true,
        view: {
          id: formView.id,
          formId: formView.formId,
          userId: formView.userId,
          userEmail: formView.userEmail,
          userName: formView.userName,
          createdAt: formView.createdAt.toISOString(),
        }
      };
    } catch (error) {
      console.error("Error creating form view:", error);
      return {
        success: false,
        error: `Failed to create form view: ${error.message}`
      };
    }
  } catch (error) {
    console.error("Error tracking form view:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get form analytics
export async function getFormAnalytics(formId, dateRange = null) {
  try {
    const startDate = dateRange?.from ? new Date(dateRange.from) : null;
    const endDate = dateRange?.to ? new Date(dateRange.to) : null;
    
    // Query conditions for date filtering
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }
    
    // Get form details
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        submissions: {
          where: dateFilter,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!form) {
      console.log(`Form not found in database for ID: ${formId}`);
      return {
        success: false,
        error: "Form not found"
      };
    }
    
    // Get form views
    const formViews = await prisma.formView.findMany({
      where: {
        formId,
        ...dateFilter
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculate unique viewers
    const uniqueViewerEmails = new Set();
    formViews.forEach(view => {
      if (view.userEmail) {
        uniqueViewerEmails.add(view.userEmail);
      }
    });
    
    // Process form fields
    const fields = JSON.parse(form.fields);
    
    // Process form responses
    const responseData = {};
    form.submissions.forEach(submission => {
      const data = submission.data;
      
      // Process each field in the submission
      Object.entries(data).forEach(([fieldName, value]) => {
        if (!responseData[fieldName]) {
          // Find the field type
          const fieldDef = fields.find(f => f.label === fieldName);
          const fieldType = fieldDef?.type || 'text';
          
          responseData[fieldName] = {
            fieldLabel: fieldName,
            fieldType,
            responses: {}
          };
        }
        
        // Count the response
        const strValue = String(value);
        if (!responseData[fieldName].responses[strValue]) {
          responseData[fieldName].responses[strValue] = 0;
        }
        responseData[fieldName].responses[strValue]++;
      });
    });
    
    // Format the response data
    const formattedResponses = Object.values(responseData).map(field => {
      return {
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        responses: Object.entries(field.responses).map(([value, count]) => ({
          value,
          count
        }))
      };
    });
    
    // Calculate completion rate
    const totalViews = formViews.length;
    const totalSubmissions = form.submissions.length;
    const completionRate = totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 100) : 0;
    
    return {
      success: true,
      analytics: {
        totalViews,
        uniqueViewers: uniqueViewerEmails.size,
        totalSubmissions,
        completionRate,
        viewers: formViews.map(view => ({
          name: view.userName || 'Anonymous',
          email: view.userEmail || 'N/A',
          viewDate: view.createdAt.toISOString()
        })),
        submitters: form.submissions.map(sub => ({
          name: sub.userName || 'Anonymous',
          email: sub.userEmail || 'N/A',
          submitDate: sub.createdAt.toISOString()
        })),
        responses: formattedResponses
      }
    };
  } catch (error) {
    console.error("Error getting form analytics:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get all forms for an organization
export async function getOrganizationForms(organizationId) {
  try {
    // Get all projects for the organization
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        forms: {
          include: {
            submissions: true
          }
        }
      }
    });
    
    // Process forms data
    const forms = [];
    
    for (const project of projects) {
      for (const form of project.forms) {
        // Get form views count
        const viewCount = await prisma.formView.count({
          where: { formId: form.id }
        });
        
        forms.push({
          id: form.id,
          name: form.name,
          description: form.description,
          projectId: project.id,
          projectName: project.name,
          submissionCount: form.submissions.length,
          viewCount,
          createdAt: form.createdAt.toISOString(),
        });
      }
    }
    
    return {
      success: true,
      forms
    };
  } catch (error) {
    console.error("Error getting organization forms:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
