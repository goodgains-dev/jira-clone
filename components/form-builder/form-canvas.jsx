"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DraggableField } from "./draggable-field";

export function FormCanvas({ fields, onAddField, onUpdateField, onRemoveField, activeId }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "form-canvas"
  });

  return (
    <Card className={`${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <CardTitle className="text-white">Form Canvas</CardTitle>
      </CardHeader>
      <CardContent ref={setNodeRef} className={`${isOver ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}>
        <SortableContext
          items={fields.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field) => (
            <DraggableField
              key={field.id}
              id={field.id}
              field={field}
              onUpdateField={onUpdateField}
              onRemoveField={onRemoveField}
            />
          ))}
        </SortableContext>
        
        {fields.length === 0 && (
          <div className="text-center py-8 text-white border-2 border-dashed rounded-md">
            <p className="mb-2">Drag field types here from the sidebar</p>
            <p>or</p>
            <Button onClick={() => onAddField()} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add Text Field
            </Button>
          </div>
        )}
      </CardContent>
      {fields.length > 0 && (
        <CardFooter>
          <Button onClick={() => onAddField()}>
            <Plus className="h-4 w-4 mr-2" /> Add Field
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
