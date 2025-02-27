"use client";

import { useState, useCallback, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

// Import form builder components
import { FormHeader } from "@/components/form-builder/form-header";
import { FormMetadata } from "@/components/form-builder/form-metadata";
import { BuilderTab } from "@/components/form-builder/builder-tab";
import { FormPreview } from "@/components/form-builder/form-preview";
import { JsonPreview } from "@/components/form-builder/json-preview";
import { SavedFormsTab } from "@/components/form-builder/saved-forms-tab";
import { FormActions } from "@/components/form-builder/form-actions";
import { QrCodeDialog } from "@/components/form-builder/qr-code-dialog";
import { FieldTypeSidebar, FIELD_TYPES } from "@/components/form-builder/field-type-sidebar";
import { FormCanvas } from "@/components/form-builder/form-canvas";

// Import actions
import { createForm, getProjectForms } from "@/actions/forms";

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const [formName, setFormName] = useState('Custom Issue Form');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [activeTab, setActiveTab] = useState('builder');
  const [activeId, setActiveId] = useState(null);
  const [savedForms, setSavedForms] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const [formUrl, setFormUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const generateId = () => `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Fetch saved forms when the component mounts
  useEffect(() => {
    const fetchForms = async () => {
      try {
        // Get the organization ID from the URL params
        const orgId = params.orgId;
        
        // For now, we'll create a default project ID based on the organization
        // In a real implementation, you might want to fetch projects and let the user select one
        const projectId = `project-${orgId}`;
        setSelectedProject(projectId);
        
        const response = await getProjectForms(projectId);
        if (response && response.success) {
          setSavedForms(response.forms || []);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
      }
    };
    
    fetchForms();
  }, [params.orgId]);
  
  // Field management functions
  const addField = (type = FIELD_TYPES.TEXT) => {
    const newField = {
      id: generateId(),
      label: `Field ${fields.length + 1}`,
      type: type,
      required: false,
      options: type === FIELD_TYPES.SELECT ? ['Option 1', 'Option 2'] : []
    };
    
    setFields([...fields, newField]);
  };
  
  const updateField = (id, updatedField) => {
    setFields(fields.map(field => field.id === id ? { ...field, ...updatedField } : field));
  };
  
  const removeField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };
  
  // Drag and drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };
  
  const handleDragOver = (event) => {
    // This is where we can implement custom drag over logic if needed
    const { active, over } = event;
    
    // Check if we're dragging a field type over the canvas
    if (active.data?.current?.isFieldType && over?.id === "form-canvas") {
      // We can add visual feedback here if needed
    }
  };
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    if (!over) return;
    
    // Check if we're dragging a field type to the canvas
    if (active.data?.current?.isFieldType && over.id === "form-canvas") {
      // Extract the field type from the draggable item's ID
      const fieldType = active.data.current.type;
      addField(fieldType);
      return;
    }
    
    // Handle reordering existing fields
    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Form actions
  const saveForm = async () => {
    try {
      console.log("saveForm called");
      setIsLoading(true);
      
      if (!selectedProject) {
        console.log("No project selected");
        toast.error("Please select a project first");
        return;
      }
      
      if (fields.length === 0) {
        console.log("No fields added");
        toast.error("Please add at least one field to the form");
        return;
      }
      
      // Prepare the form data
      const fieldsWithoutId = fields.map(({ id, ...rest }) => rest);
      console.log("Fields without ID:", fieldsWithoutId);
      
      const fieldsJson = JSON.stringify(fieldsWithoutId);
      console.log("Fields JSON:", fieldsJson);
      
      const formData = {
        name: formName,
        description: formDescription,
        fields: fieldsJson,
        projectId: selectedProject,
      };
      
      console.log("Saving form with data:", formData);
      
      // Save the form
      console.log("Calling createForm...");
      const response = await createForm(formData);
      
      console.log("Form creation response:", response);
      
      if (!response) {
        console.log("Response is undefined");
        throw new Error("Failed to save form: Response is undefined");
      }
      
      if (!response.success) {
        console.log("Response indicates failure:", response.error);
        throw new Error(response.error || "Failed to save form");
      }
      
      console.log("Form saved successfully, updating UI");
      
      // Update the saved forms list
      if (!response.form) {
        console.log("Response.form is undefined");
        throw new Error("Failed to save form: Form data is missing in response");
      }
      
      setSavedForms([response.form, ...savedForms]);
      
      // Set the current form ID for QR code generation
      setCurrentFormId(response.form.id);
      
      // Generate the form URL
      const baseUrl = window.location.origin;
      const formUrl = `${baseUrl}/form/${response.form.id}`;
      setFormUrl(formUrl);
      
      // Show the QR code dialog
      setShowQrDialog(true);
      
      toast.success("Form saved successfully!");
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error(error.message || "Failed to save form");
    } finally {
      setIsLoading(false);
    }
  };
  
  const exportForm = () => {
    const formData = {
      name: formName,
      description: formDescription,
      fields: fields.map(({ id, ...rest }) => rest)
    };
    
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const importForm = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setFormName(data.name || 'Custom Issue Form');
        setFormDescription(data.description || '');
        setFields(data.fields.map(field => ({ ...field, id: generateId() })));
      } catch (error) {
        console.error('Error parsing form JSON:', error);
        toast.error('Invalid form file. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };
  
  const copyFormUrl = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success("Form URL copied to clipboard!");
  };
  
  const downloadQrCode = () => {
    const svg = document.getElementById('form-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${formName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };
  
  const showQrCodeForForm = (formId) => {
    setCurrentFormId(formId);
    const baseUrl = window.location.origin;
    setFormUrl(`${baseUrl}/form/${formId}`);
    setShowQrDialog(true);
  };
  
  // Create a hidden file input for importing
  const fileInputRef = useCallback((node) => {
    if (node) {
      node.addEventListener('change', importForm);
    }
  }, []);
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Form header with import/export buttons */}
      <FormHeader 
        onImport={() => document.querySelector('input[type="file"]').click()}
        onExport={exportForm}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
      />
      
      {/* Form name and description */}
      <FormMetadata 
        formName={formName}
        formDescription={formDescription}
        onNameChange={setFormName}
        onDescriptionChange={setFormDescription}
      />
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="saved">Saved Forms</TabsTrigger>
        </TabsList>
        
        {/* Builder tab */}
        <TabsContent value="builder">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Sidebar with field type buttons */}
              <div className="md:col-span-1">
                <FieldTypeSidebar onAddField={addField} />
              </div>
              
              {/* Form canvas */}
              <div className="md:col-span-3">
                <FormCanvas 
                  fields={fields} 
                  onAddField={addField} 
                  onUpdateField={updateField} 
                  onRemoveField={removeField}
                  activeId={activeId}
                />
              </div>
            </div>
          </DndContext>
        </TabsContent>
        
        {/* Preview tab */}
        <TabsContent value="preview">
          <FormPreview fields={fields} formName={formName} />
        </TabsContent>
        
        {/* JSON tab */}
        <TabsContent value="json">
          <JsonPreview fields={fields} formName={formName} formDescription={formDescription} />
        </TabsContent>
        
        {/* Saved forms tab */}
        <TabsContent value="saved">
          <SavedFormsTab forms={savedForms} onShowQrCode={showQrCodeForForm} />
        </TabsContent>
      </Tabs>
      
      {/* Form actions */}
      <FormActions 
        fieldCount={fields.length}
        onSave={saveForm}
        isLoading={isLoading}
      />
      
      {/* QR Code Dialog */}
      <QrCodeDialog 
        open={showQrDialog}
        onOpenChange={setShowQrDialog}
        formUrl={formUrl}
        formName={formName}
        onCopyUrl={copyFormUrl}
        onDownloadQrCode={downloadQrCode}
      />
    </div>
  );
}
