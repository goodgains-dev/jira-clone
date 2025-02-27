"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { List } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FieldTypeItem } from "./field-type-item";

// Form field types
export const FIELD_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  RADIO: 'radio',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
  DATE: 'date',
  SIGNATURE: 'signature',
  DROPDOWN: 'dropdown',
  MULTIPLE_CHOICE: 'multiple_choice'
};

export function FieldTypeSidebar({ onAddField }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Field Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <FieldTypeItem 
            type={FIELD_TYPES.TEXT} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-md text-white">Aa</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.TEXTAREA} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-md text-white">¶</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.SELECT} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-purple-500 rounded-md text-white">
              <List className="h-4 w-4" />
            </div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.DROPDOWN} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-indigo-500 rounded-md text-white">▼</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.MULTIPLE_CHOICE} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-pink-500 rounded-md text-white">◉</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.RADIO} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-md text-white">○</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.NUMBER} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-md text-white">123</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.CHECKBOX} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-teal-500 rounded-md text-white">☑</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.DATE} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-orange-500 rounded-md text-white">📅</div>} 
            onAdd={onAddField} 
          />
          <FieldTypeItem 
            type={FIELD_TYPES.SIGNATURE} 
            icon={<div className="flex items-center justify-center w-6 h-6 bg-gray-500 rounded-md text-white">✍</div>} 
            onAdd={onAddField} 
          />
        </div>
        <div className="mt-4 text-sm text-white">
          <p>Drag and drop field types onto the form canvas or click to add.</p>
        </div>
      </CardContent>
    </Card>
  );
}
