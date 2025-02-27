"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GripVertical, Trash2, List, Calendar, CheckSquare, Type, AlignLeft, FileSignature } from "lucide-react";
import { FIELD_TYPES } from "./field-type-sidebar";

export function DraggableField({ id, field, onUpdateField, onRemoveField }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const handleTypeChange = (type) => {
    onUpdateField(id, { ...field, type });
  };
  
  const handleLabelChange = (e) => {
    onUpdateField(id, { ...field, label: e.target.value });
  };
  
  const handleRequiredChange = (required) => {
    onUpdateField(id, { ...field, required: required === 'true' });
  };
  
  const handleOptionsChange = (e) => {
    const options = e.target.value.split(',').map(option => option.trim());
    onUpdateField(id, { ...field, options });
  };
  
  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div {...attributes} {...listeners} className="cursor-grab">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              <CardTitle className="text-md">
                {field.label || 'Unnamed Field'}
              </CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onRemoveField(id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`field-${id}-label`} className="text-white">Label</Label>
              <Input
                id={`field-${id}-label`}
                value={field.label}
                onChange={handleLabelChange}
                placeholder="Field Label"
                className="text-white"
              />
            </div>
            <div>
              <Label htmlFor={`field-${id}-type`} className="text-white">Type</Label>
              <Select value={field.type} onValueChange={handleTypeChange}>
                <SelectTrigger id={`field-${id}-type`} className="text-white">
                  <SelectValue placeholder="Field Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIELD_TYPES.TEXT}>Text</SelectItem>
                  <SelectItem value={FIELD_TYPES.TEXTAREA}>Text Area</SelectItem>
                  <SelectItem value={FIELD_TYPES.SELECT}>Select</SelectItem>
                  <SelectItem value={FIELD_TYPES.DROPDOWN}>Dropdown</SelectItem>
                  <SelectItem value={FIELD_TYPES.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                  <SelectItem value={FIELD_TYPES.RADIO}>Radio Buttons</SelectItem>
                  <SelectItem value={FIELD_TYPES.NUMBER}>Number</SelectItem>
                  <SelectItem value={FIELD_TYPES.CHECKBOX}>Checkbox</SelectItem>
                  <SelectItem value={FIELD_TYPES.DATE}>Date</SelectItem>
                  <SelectItem value={FIELD_TYPES.SIGNATURE}>Signature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor={`field-${id}-required`} className="text-white">Required</Label>
            <Select 
              value={field.required.toString()} 
              onValueChange={handleRequiredChange}
            >
              <SelectTrigger id={`field-${id}-required`} className="text-white">
                <SelectValue placeholder="Required" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(field.type === FIELD_TYPES.SELECT || 
            field.type === FIELD_TYPES.DROPDOWN || 
            field.type === FIELD_TYPES.RADIO || 
            field.type === FIELD_TYPES.MULTIPLE_CHOICE) && (
            <div>
              <Label htmlFor={`field-${id}-options`} className="text-white">Options (comma separated)</Label>
              <Input
                id={`field-${id}-options`}
                value={field.options?.join(', ') || ''}
                onChange={handleOptionsChange}
                placeholder="Option 1, Option 2, Option 3"
                className="text-white"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="w-full">
            <Label className="text-sm text-gray-400 mb-2 block">Field Preview</Label>
            <div className="p-2 border rounded-md bg-gray-800">
              {field.type === FIELD_TYPES.TEXT && (
                <Input placeholder={field.label || "Text input"} disabled className="bg-gray-700 text-white" />
              )}
              
              {field.type === FIELD_TYPES.TEXTAREA && (
                <Textarea placeholder={field.label || "Text area"} disabled className="bg-gray-700 text-white" />
              )}
              
              {(field.type === FIELD_TYPES.SELECT || field.type === FIELD_TYPES.DROPDOWN) && (
                <Select disabled>
                  <SelectTrigger className="bg-gray-700 text-white">
                    <SelectValue placeholder={field.label || "Select option"} />
                  </SelectTrigger>
                </Select>
              )}
              
              {field.type === FIELD_TYPES.RADIO && (
                <div className="space-y-2">
                  {(field.options?.length > 0 ? field.options : ['Option 1', 'Option 2']).map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input type="radio" disabled className="bg-gray-700" />
                      <span className="text-sm text-white">{option}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {field.type === FIELD_TYPES.MULTIPLE_CHOICE && (
                <div className="space-y-2">
                  {(field.options?.length > 0 ? field.options : ['Option 1', 'Option 2']).map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input type="checkbox" disabled className="bg-gray-700" />
                      <span className="text-sm text-white">{option}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {field.type === FIELD_TYPES.NUMBER && (
                <Input type="number" placeholder={field.label || "Number input"} disabled className="bg-gray-700 text-white" />
              )}
              
              {field.type === FIELD_TYPES.CHECKBOX && (
                <div className="flex items-center space-x-2">
                  <input type="checkbox" disabled className="bg-gray-700" />
                  <span className="text-sm text-white">{field.label || "Checkbox"}</span>
                </div>
              )}
              
              {field.type === FIELD_TYPES.DATE && (
                <Input type="date" disabled className="bg-gray-700 text-white" />
              )}
              
              {field.type === FIELD_TYPES.SIGNATURE && (
                <div className="h-16 bg-gray-700 rounded-md border border-gray-600 flex items-center justify-center">
                  <span className="text-gray-400">Signature field</span>
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
