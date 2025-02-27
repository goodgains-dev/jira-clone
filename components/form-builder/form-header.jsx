"use client";

import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpToLine, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function FormHeader({ onImport, onExport }) {
  const router = useRouter();
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="text-white hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onImport}
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={onExport}>
            <ArrowUpToLine className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
        Custom Issue Form Builder
      </h1>
    </div>
  );
}
