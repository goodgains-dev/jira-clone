"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarLoader } from "react-spinners";
import { getOrganizationAnalytics, formatTime } from "@/actions/analytics";
import { ArrowLeft, FileDown, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { FormAnalyticsModal } from "@/components/form-analytics-modal";
import { getOrganizationForms } from "@/actions/forms";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Helper component to format completion time
function CompletionTime({ seconds }) {
  const [formattedTime, setFormattedTime] = useState('Loading...');
  
  useEffect(() => {
    const formatTheTime = async () => {
      try {
        const time = await formatTime(seconds);
        setFormattedTime(time);
      } catch (err) {
        console.error('Error formatting time:', err);
        setFormattedTime('Error');
      }
    };
    
    formatTheTime();
  }, [seconds]);
  
  return <>{formattedTime}</>;
}

export default function OrganizationAnalyticsPage({ params }) {
  const { orgId } = params;
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const { isLoaded: orgLoaded, organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showFormAnalytics, setShowFormAnalytics] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const analyticsContentRef = useRef(null);

  // Load analytics data and handle loading state
  useEffect(() => {
    if (!userLoaded || !orgLoaded) {
      return;
    }
    
    setIsLoading(false);
    
    if (!isSignedIn || !organization || !orgId) {
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch analytics data
        const analyticsData = await getOrganizationAnalytics(orgId);
        setAnalytics(analyticsData);
        
        // Fetch forms data
        const formsData = await getOrganizationForms(orgId);
        if (formsData.success) {
          setForms(formsData.forms);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      }
    };
    
    fetchData();
  }, [userLoaded, orgLoaded, orgId, isSignedIn, organization]);

  // Auth check
  if (!isLoading && (!isSignedIn || !organization)) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-red-500">
          You must be signed in to an organization to view this page.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <BarLoader />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Function to generate and download PDF directly from data
  const generatePDF = async () => {
    if (!analytics || !organization) {
      toast.error("Analytics data not ready. Please try again.");
      return;
    }
    
    setGeneratingPDF(true);
    toast.info("Generating PDF, please wait...");
    
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;
      
      // Helper function to add a new page if needed
      const checkPageBreak = (height) => {
        if (y + height > 280) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };
      
      // Helper function to add a section title
      const addSectionTitle = (title) => {
        checkPageBreak(10);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(title, margin, y);
        y += 8;
      };
      
      // Helper function to add a text line
      const addTextLine = (text, indent = 0) => {
        checkPageBreak(6);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(text, margin + indent, y);
        y += 6;
      };
      
      // Add title and date
      doc.setFont(undefined, 'bold');
      doc.setFontSize(16);
      doc.text(`${organization.name} - Analytics Report`, pageWidth / 2, y, { align: 'center' });
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
      y += 15;
      
      // Overview section
      addSectionTitle("Overview");
      addTextLine(`Total Projects: ${analytics.totalProjects}`);
      addTextLine(`Total Sprints: ${analytics.totalSprints}`);
      addTextLine(`Total Issues: ${analytics.totalIssues}`);
      
      const completionRate = analytics.totalIssues 
        ? `${Math.round((analytics.completedIssues / analytics.totalIssues) * 100)}%` 
        : 'N/A';
      addTextLine(`Completion Rate: ${completionRate}`);
      y += 5;
      
      // Issues by Status section
      addSectionTitle("Issues by Status");
      Object.entries(analytics.issuesByStatus).forEach(([status, count]) => {
        addTextLine(`${status}: ${count} (${analytics.totalIssues ? Math.round((count / analytics.totalIssues) * 100) : 0}%)`, 5);
      });
      y += 5;
      
      // Issues by Priority section
      addSectionTitle("Issues by Priority");
      Object.entries(analytics.issuesByPriority).forEach(([priority, count]) => {
        addTextLine(`${priority}: ${count} (${analytics.totalIssues ? Math.round((count / analytics.totalIssues) * 100) : 0}%)`, 5);
      });
      y += 5;
      
      // Project Performance section
      addSectionTitle("Project Performance");
      
      // Add table headers
      checkPageBreak(8);
      const tableHeaders = ["Project", "Key", "Issues", "Completed", "Rate"];
      const colWidths = [60, 30, 25, 25, 30];
      let xOffset = margin;
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      
      tableHeaders.forEach((header, i) => {
        doc.text(header, xOffset, y);
        xOffset += colWidths[i];
      });
      
      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      
      // Add table rows
      doc.setFont(undefined, 'normal');
      analytics.projectPerformance.forEach(project => {
        checkPageBreak(8);
        
        xOffset = margin;
        doc.text(project.name.substring(0, 20), xOffset, y); // Limit name length
        xOffset += colWidths[0];
        
        doc.text(project.key, xOffset, y);
        xOffset += colWidths[1];
        
        doc.text(project.totalIssues.toString(), xOffset, y);
        xOffset += colWidths[2];
        
        doc.text(project.completedIssues.toString(), xOffset, y);
        xOffset += colWidths[3];
        
        const rate = project.totalIssues ? `${Math.round(project.completionRate)}%` : 'N/A';
        doc.text(rate, xOffset, y);
        
        y += 7;
      });
      
      y += 5;
      
      // Average Completion Time
      addSectionTitle("Average Issue Completion Time");
      
      // Format the time
      let formattedTime = 'No data available';
      if (analytics.averageCompletionTime) {
        const seconds = analytics.averageCompletionTime;
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        formattedTime = "";
        if (days > 0) formattedTime += `${days}d `;
        if (hours > 0) formattedTime += `${hours}h `;
        formattedTime += `${minutes}m`;
      }
      
      addTextLine(`Average Time: ${formattedTime}`);
      addTextLine("The average time it takes to complete an issue across all projects in the organization.", 5);
      y += 5;
      
      // Top Ticket Completers
      if (analytics.userCompletionData && analytics.userCompletionData.length > 0) {
        addSectionTitle("Top Ticket Completers");
        
        analytics.userCompletionData.slice(0, 5).forEach(user => {
          addTextLine(`${user.name}: ${user.completedCount} tickets completed`, 5);
        });
      }
      
      // Save the PDF
      const filename = `${organization.name.replace(/\s+/g, '-').toLowerCase()}-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link 
            href={`/organization/${organization.slug}`}
            className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-title">
            Organization Analytics
          </h1>
        </div>
        
        {analytics && (
          <div className="flex items-center gap-2">
            <Popover open={showFormSelector} onOpenChange={setShowFormSelector}>
              <PopoverTrigger asChild>
                <Button
                  onClick={() => {
                    if (forms.length > 0) {
                      setShowFormSelector(true);
                    } else {
                      toast.error("No forms available");
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText size={16} />
                  Form Analytics
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h3 className="font-medium">Select a form</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {forms.map(form => (
                      <div 
                        key={form.id}
                        className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => {
                          setSelectedForm(form);
                          setShowFormSelector(false);
                          setShowFormAnalytics(true);
                        }}
                      >
                        <div className="font-medium">{form.name}</div>
                        <div className="text-sm text-gray-500">
                          {form.submissionCount} submissions • {form.viewCount} views
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={generatePDF}
              disabled={generatingPDF || !analytics}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileDown size={16} />
              {generatingPDF ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        )}
      </div>

      {!analytics ? (
        <div className="flex justify-center items-center h-[50vh]">
          <BarLoader />
        </div>
      ) : (
        <div className="space-y-8" ref={analyticsContentRef}>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics.totalProjects}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Sprints</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics.totalSprints}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics.totalIssues}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {analytics.totalIssues 
                    ? `${Math.round((analytics.completedIssues / analytics.totalIssues) * 100)}%` 
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issues by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.issuesByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="font-medium">{status}</span>
                      <div className="flex items-center">
                        <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden mr-2">
                          <div 
                            className={`h-full ${
                              status === 'TODO' ? 'bg-blue-400' :
                              status === 'IN_PROGRESS' ? 'bg-yellow-400' :
                              status === 'IN_REVIEW' ? 'bg-purple-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${analytics.totalIssues ? (count / analytics.totalIssues) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issues by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.issuesByPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className="font-medium">{priority}</span>
                      <div className="flex items-center">
                        <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden mr-2">
                          <div 
                            className={`h-full ${
                              priority === 'LOW' ? 'bg-blue-400' :
                              priority === 'MEDIUM' ? 'bg-yellow-400' :
                              priority === 'HIGH' ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${analytics.totalIssues ? (count / analytics.totalIssues) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <span>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Project Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium">Project</th>
                      <th className="text-left py-3 font-medium">Key</th>
                      <th className="text-right py-3 font-medium">Issues</th>
                      <th className="text-right py-3 font-medium">Completed</th>
                      <th className="text-right py-3 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.projectPerformance.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{project.name}</td>
                        <td className="py-3">{project.key}</td>
                        <td className="py-3 text-right">{project.totalIssues}</td>
                        <td className="py-3 text-right">{project.completedIssues}</td>
                        <td className="py-3 text-right">
                          {project.totalIssues 
                            ? `${Math.round(project.completionRate)}%` 
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Average Completion Time */}
          <Card>
            <CardHeader>
              <CardTitle>Average Issue Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-4">
                {analytics.averageCompletionTime 
                  ? <CompletionTime seconds={analytics.averageCompletionTime} />
                  : 'No data available'
                }
              </div>
              <p className="text-gray-500">
                The average time it takes to complete an issue across all projects in the organization.
              </p>
            </CardContent>
          </Card>
          
          {/* User Completion Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Top Ticket Completers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.userCompletionData && analytics.userCompletionData.length > 0 ? (
                  analytics.userCompletionData.map((user) => (
                    <div key={user.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {user.imageUrl ? (
                            <img 
                              src={user.imageUrl} 
                              alt={user.name} 
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gray-200 rounded-full mr-2" />
                          )}
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <span className="text-gray-500">{user.completedCount}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-green-400 rounded-full"
                          style={{
                            width: `${(user.completedCount / (analytics.userCompletionData[0]?.completedCount || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No users have completed any tickets yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Form Analytics Modal */}
      {selectedForm && (
        <FormAnalyticsModal
          open={showFormAnalytics}
          onOpenChange={setShowFormAnalytics}
          formId={selectedForm.id}
          formName={selectedForm.name}
        />
      )}
    </div>
  );
}
