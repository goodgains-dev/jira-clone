"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getFormById, submitFormResponse, trackFormView } from "@/actions/forms";
import { toast } from "sonner";

export default function FormPage() {
  const params = useParams();
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await getFormById(params.formId);
        
        if (!response || !response.success) {
          throw new Error(response?.error || "Failed to load form");
        }
        
        setForm(response.form);
        
        // Track form view
        await trackFormView(params.formId, {
          // Include user data if available
          id: null, // Anonymous for public forms
          email: null,
          name: null
        });
        
        // Parse the fields from the form
        const parsedFields = JSON.parse(response.form.fields);
        setFields(parsedFields);
        
        // Initialize form data with empty values
        const initialData = {};
        parsedFields.forEach(field => {
          initialData[field.label] = field.type === 'select' ? field.options[0] : '';
        });
        
        setFormData(initialData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading form:", error);
        toast.error("Failed to load form. Please try again later.");
        setIsLoading(false);
      }
    };
    
    fetchForm();
  }, [params.formId]);
  
  const handleInputChange = (label, value) => {
    setFormData(prev => ({
      ...prev,
      [label]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const missingFields = fields
        .filter(field => field.required && !formData[field.label])
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Submit the form
      const response = await submitFormResponse(
        params.formId, 
        formData,
        {
          // Include user data if available
          name: null, // Anonymous for public forms
          email: null
        }
      );
      
      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to submit form");
      }
      
      toast.success("Form submitted successfully!");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading form...</h1>
        </div>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="container mx-auto py-12 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Thank you for your submission!</h1>
          <p className="mb-6">Your response has been recorded.</p>
          <Button onClick={() => {
            setFormData({});
            setSubmitted(false);
          }}>
            Submit another response
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <div className="bg-card p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-2">{form?.name || "Loading..."}</h1>
        {form?.description && (
          <p className="text-muted-foreground mb-6">{form.description}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`field-${index}`}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === 'text' && (
                <Input
                  id={`field-${index}`}
                  value={formData[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'textarea' && (
                <Textarea
                  id={`field-${index}`}
                  value={formData[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {(field.type === 'select' || field.type === 'dropdown') && (
                <Select
                  value={formData[field.label] || ''}
                  onValueChange={(value) => handleInputChange(field.label, value)}
                >
                  <SelectTrigger id={`field-${index}`}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option, i) => (
                      <SelectItem key={i} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {field.type === 'number' && (
                <Input
                  id={`field-${index}`}
                  type="number"
                  value={formData[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
              
              {field.type === 'radio' && (
                <div className="space-y-2">
                  {field.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        id={`field-${index}-option-${i}`}
                        type="radio"
                        name={`field-${index}`}
                        value={option}
                        checked={formData[field.label] === option}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                      />
                      <label htmlFor={`field-${index}-option-${i}`} className="text-sm">{option}</label>
                    </div>
                  ))}
                </div>
              )}
              
              {field.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {field.options.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        id={`field-${index}-option-${i}`}
                        type="checkbox"
                        checked={Array.isArray(formData[field.label]) && formData[field.label].includes(option)}
                        onChange={(e) => {
                          const currentValues = Array.isArray(formData[field.label]) ? [...formData[field.label]] : [];
                          if (e.target.checked) {
                            handleInputChange(field.label, [...currentValues, option]);
                          } else {
                            handleInputChange(field.label, currentValues.filter(val => val !== option));
                          }
                        }}
                      />
                      <label htmlFor={`field-${index}-option-${i}`} className="text-sm">{option}</label>
                    </div>
                  ))}
                </div>
              )}
              
              {field.type === 'checkbox' && (
                <div className="flex items-center space-x-2">
                  <input
                    id={`field-${index}`}
                    type="checkbox"
                    checked={formData[field.label] || false}
                    onChange={(e) => handleInputChange(field.label, e.target.checked)}
                  />
                  <span className="text-sm">Check this box</span>
                </div>
              )}
              
              {field.type === 'date' && (
                <Input
                  id={`field-${index}`}
                  type="date"
                  value={formData[field.label] || ''}
                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                />
              )}
              {field.type === 'signature' && (
                <div className="h-24 border rounded-md relative">
                  <canvas
                    id={`signature-canvas-${index}`}
                    className="w-full h-full absolute top-0 left-0"
                    onMouseDown={(e) => {
                      const canvas = e.target;
                      const ctx = canvas.getContext('2d');
                      const rect = canvas.getBoundingClientRect();
                      let isDrawing = false;
                      let lastX = 0;
                      let lastY = 0;
                      
                      ctx.lineWidth = 2;
                      ctx.lineCap = 'round';
                      ctx.strokeStyle = '#000';
                      
                      const startDrawing = (e) => {
                        isDrawing = true;
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        lastX = x;
                        lastY = y;
                      };
                      
                      const draw = (e) => {
                        if (!isDrawing) return;
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        ctx.beginPath();
                        ctx.moveTo(lastX, lastY);
                        ctx.lineTo(x, y);
                        ctx.stroke();
                        
                        lastX = x;
                        lastY = y;
                        
                        // Save signature data
                        handleInputChange(field.label, canvas.toDataURL());
                      };
                      
                      const stopDrawing = () => {
                        isDrawing = false;
                      };
                      
                      canvas.addEventListener('mousemove', draw);
                      canvas.addEventListener('mouseup', stopDrawing);
                      canvas.addEventListener('mouseout', stopDrawing);
                      
                      startDrawing(e);
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="absolute bottom-2 right-2"
                    onClick={() => {
                      const canvas = document.getElementById(`signature-canvas-${index}`);
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      handleInputChange(field.label, '');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
}
