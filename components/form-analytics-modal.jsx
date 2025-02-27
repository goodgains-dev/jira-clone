"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileDown, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { getFormAnalytics } from "@/actions/forms";
import { toast } from "sonner";
import jsPDF from "jspdf";

export function FormAnalyticsModal({ open, onOpenChange, formId, formName }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("viewers");
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const dateRange = startDate && endDate ? { from: new Date(startDate), to: new Date(endDate) } : null;
        const data = await getFormAnalytics(formId, dateRange);
        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error fetching form analytics:", error);
        toast.error("Failed to load form analytics");
      } finally {
        setLoading(false);
      }
    };
    
    if (open && formId) {
      fetchAnalytics();
    }
  }, [open, formId, startDate, endDate]);
  
  // Generate PDF report
  const generatePDF = async () => {
    if (!analytics) return;
    
    try {
      toast.info("Generating PDF, please wait...");
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      doc.setFontSize(18);
      doc.text(`Form Analytics: ${formName}`, 20, 20);
      
      // Add date range if selected
      if (startDate && endDate) {
        doc.setFontSize(12);
        doc.text(`Date Range: ${format(new Date(startDate), 'PP')} to ${format(new Date(endDate), 'PP')}`, 20, 30);
      }
      
      // Add summary
      doc.setFontSize(14);
      doc.text("Summary", 20, 45);
      doc.setFontSize(10);
      doc.text(`Total Views: ${analytics.totalViews}`, 25, 55);
      doc.text(`Unique Viewers: ${analytics.uniqueViewers}`, 25, 60);
      doc.text(`Total Submissions: ${analytics.totalSubmissions}`, 25, 65);
      doc.text(`Completion Rate: ${analytics.completionRate}%`, 25, 70);
      
      // Add viewers
      let yPos = 85;
      doc.setFontSize(14);
      doc.text("Viewers", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      analytics.viewers.forEach(viewer => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${viewer.name} (${viewer.email}) - ${format(new Date(viewer.viewDate), 'PPp')}`, 25, yPos);
        yPos += 5;
      });
      
      // Add submitters
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Submitters", 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      analytics.submitters.forEach(submitter => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${submitter.name} (${submitter.email}) - ${format(new Date(submitter.submitDate), 'PPp')}`, 25, yPos);
        yPos += 5;
      });
      
      // Add responses
      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.text("Form Responses", 20, yPos);
      yPos += 10;
      
      analytics.responses.forEach(field => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`${field.fieldLabel} (${field.fieldType})`, 20, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        field.responses.forEach(response => {
          doc.text(`${response.value}: ${response.count}`, 25, yPos);
          yPos += 5;
        });
        
        yPos += 5;
      });
      
      // Save the PDF
      const filename = `form-analytics-${formId}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message}`);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Form Analytics: {formName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-4">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <label className="text-sm text-gray-500">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-1 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-500">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-1 text-sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="mt-auto"
            >
              Clear
            </Button>
          </div>
          
          {/* Export Button */}
          <Button variant="outline" onClick={generatePDF} disabled={!analytics} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p>Loading analytics...</p>
          </div>
        ) : !analytics ? (
          <div className="flex-1 flex items-center justify-center">
            <p>No analytics data available</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.totalViews}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Unique Viewers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.uniqueViewers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.totalSubmissions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for different analytics views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="viewers">Viewers</TabsTrigger>
                <TabsTrigger value="submitters">Submitters</TabsTrigger>
                <TabsTrigger value="responses">Responses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="viewers" className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">View Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.viewers.map((viewer, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{viewer.name}</td>
                          <td className="px-4 py-2">{viewer.email}</td>
                          <td className="px-4 py-2">{format(new Date(viewer.viewDate), 'PPp')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="submitters" className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Submit Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.submitters.map((submitter, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{submitter.name}</td>
                          <td className="px-4 py-2">{submitter.email}</td>
                          <td className="px-4 py-2">{format(new Date(submitter.submitDate), 'PPp')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              
              <TabsContent value="responses" className="space-y-6">
                {analytics.responses.map((field, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{field.fieldLabel}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {field.fieldType === 'select' || field.fieldType === 'radio' ? (
                        <div className="space-y-2">
                          {field.responses.map((response, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span>{response.value}</span>
                              <div className="flex items-center">
                                <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden mr-2">
                                  <div 
                                    className="h-full bg-blue-400"
                                    style={{ width: `${(response.count / analytics.totalSubmissions) * 100}%` }}
                                  ></div>
                                </div>
                                <span>{response.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left">Response</th>
                                <th className="px-4 py-2 text-left">Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {field.responses.map((response, i) => (
                                <tr key={i} className="border-t">
                                  <td className="px-4 py-2">{response.value}</td>
                                  <td className="px-4 py-2">{response.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
