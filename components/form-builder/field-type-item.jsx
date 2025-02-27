"use client";

import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";

export function FieldTypeItem({ type, icon, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `field-type-${type}`,
    data: {
      type,
      isFieldType: true
    }
  });

  return (
    <Button
      ref={setNodeRef}
      variant="outline"
      className={`w-full mb-2 justify-start text-white font-medium ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onAdd(type)}
      {...listeners}
      {...attributes}
    >
      <div className="mr-2">{icon}</div>
      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </Button>
  );
}
