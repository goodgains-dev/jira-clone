"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export function SavedFormsTab({ forms, onShowQrCode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Saved Forms</CardTitle>
      </CardHeader>
      <CardContent>
        {forms.length === 0 ? (
          <div className="text-center py-8 text-white">
            <p>No saved forms yet. Create and save a form to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <Card key={form.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-white">{form.name}</h3>
                    {form.description && (
                      <p className="text-sm text-white">{form.description}</p>
                    )}
                    <p className="text-xs text-white">
                      Created: {new Date(form.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onShowQrCode(form.id)}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
