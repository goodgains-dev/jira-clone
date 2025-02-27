"use client";

import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Download, Share2, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function QrCodeDialog({ open, onOpenChange, formUrl, formName, onCopyUrl, onDownloadQrCode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Form QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access the form or share the link below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <QRCodeSVG
              id="form-qr-code"
              value={formUrl}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <p className="mt-4 text-center text-sm text-gray-400">
            Scan with your phone camera to open the form
          </p>
          <div className="mt-4 w-full">
            <div className="flex items-center space-x-2">
              <Input value={formUrl} readOnly className="text-white" />
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => {
                  onCopyUrl();
                  toast.success("URL copied to clipboard!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4 w-full">
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${formName} - Form`,
                    text: `Please fill out this form: ${formName}`,
                    url: formUrl,
                  }).catch(err => {
                    console.error('Share failed:', err);
                    onCopyUrl();
                    toast.success("URL copied to clipboard!");
                  });
                } else {
                  onCopyUrl();
                  toast.success("URL copied to clipboard!");
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => {
                window.open(formUrl, '_blank');
              }}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Open Form
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onDownloadQrCode}>
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
