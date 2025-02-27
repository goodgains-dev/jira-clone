"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Maximize2, Minimize2 } from "lucide-react";
import { FIELD_TYPES } from "./field-type-sidebar";

export function FormPreview({ fields, formName }) {
  const [fullscreen, setFullscreen] = useState(false);
  
  const FormContent = () => (
    <>
      <h2 className="text-xl font-bold mb-4 text-white">{formName || 'Custom Issue Form'}</h2>
      
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="text-white">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === FIELD_TYPES.TEXT && (
              <Input placeholder={`Enter ${field.label.toLowerCase()}`} disabled className="bg-gray-700 text-white" />
            )}
            
            {field.type === FIELD_TYPES.TEXTAREA && (
              <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} disabled className="bg-gray-700 text-white" />
            )}
            
            {(field.type === FIELD_TYPES.SELECT || field.type === FIELD_TYPES.DROPDOWN) && (
              <Select disabled>
                <SelectTrigger className="bg-gray-700 text-white">
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option, i) => (
                    <SelectItem key={i} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {field.type === FIELD_TYPES.RADIO && (
              <div className="space-y-2">
                {field.options?.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input type="radio" disabled className="bg-gray-700" />
                    <span className="text-sm text-white">{option}</span>
                  </div>
                ))}
              </div>
            )}
            
            {field.type === FIELD_TYPES.MULTIPLE_CHOICE && (
              <div className="space-y-2">
                {field.options?.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input type="checkbox" disabled className="bg-gray-700" />
                    <span className="text-sm text-white">{option}</span>
                  </div>
                ))}
              </div>
            )}
            
            {field.type === FIELD_TYPES.NUMBER && (
              <Input type="number" placeholder={`Enter ${field.label.toLowerCase()}`} disabled className="bg-gray-700 text-white" />
            )}
            
            {field.type === FIELD_TYPES.CHECKBOX && (
              <div className="flex items-center space-x-2">
                <input type="checkbox" disabled className="bg-gray-700" />
                <span className="text-sm text-white">Check this box</span>
              </div>
            )}
            
            {field.type === FIELD_TYPES.DATE && (
              <Input type="date" disabled className="bg-gray-700 text-white" />
            )}
            
            {field.type === FIELD_TYPES.SIGNATURE && (
              <div className="h-24 bg-gray-700 rounded-md border border-gray-600 flex items-center justify-center">
                <span className="text-gray-400">Signature field</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-700 rounded-md">
          <p>No fields added yet. Add fields in the Builder tab to see a preview.</p>
        </div>
      )}
    </>
  );
  
  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium text-white">Form Preview</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setFullscreen(true)}
          className="text-white"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Full Screen
        </Button>
      </div>
      <div className="p-4 border rounded-md bg-gray-800">
        <FormContent />
      </div>
      
      {/* Fullscreen Dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-bold">{formName || 'Custom Issue Form'}</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFullscreen(false)}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Full Screen
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-grow overflow-auto p-4 border rounded-md bg-gray-800">
            <FormContent />
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setFullscreen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
