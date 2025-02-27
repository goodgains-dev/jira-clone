"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormMetadata({ formName, formDescription, onNameChange, onDescriptionChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <Label htmlFor="form-name" className="text-white font-medium">Form Name</Label>
        <Input
          id="form-name"
          value={formName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter form name"
          className="text-white"
        />
      </div>
      <div>
        <Label htmlFor="form-description" className="text-white font-medium">Description (Optional)</Label>
        <Input
          id="form-description"
          value={formDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter form description"
          className="text-white"
        />
      </div>
    </div>
  );
}
