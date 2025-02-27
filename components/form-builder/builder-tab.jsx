"use client";

import { FieldTypeSidebar } from "./field-type-sidebar";
import { FormCanvas } from "./form-canvas";

export function BuilderTab({ fields, onAddField, onUpdateField, onRemoveField, activeId }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Sidebar with field type buttons */}
      <div className="md:col-span-1">
        <FieldTypeSidebar onAddField={onAddField} />
      </div>
      
      {/* Form canvas */}
      <div className="md:col-span-3">
        <FormCanvas 
          fields={fields} 
          onAddField={onAddField} 
          onUpdateField={onUpdateField} 
          onRemoveField={onRemoveField}
          activeId={activeId}
        />
      </div>
    </div>
  );
}
