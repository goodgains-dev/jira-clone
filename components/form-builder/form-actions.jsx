"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";

export function FormActions({ fieldCount, onSave, isLoading }) {
  return (
    <div className="mt-8 flex justify-end">
      <Badge variant="outline" className="mr-auto text-white">
        {fieldCount} field{fieldCount !== 1 ? 's' : ''}
      </Badge>
      <Button onClick={onSave} disabled={isLoading}>
        <Save className="h-4 w-4 mr-2" />
        {isLoading ? "Saving..." : "Save Form Template"}
      </Button>
    </div>
  );
}
