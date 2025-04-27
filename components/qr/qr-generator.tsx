"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Student } from "@/types";
import { Printer, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRGeneratorProps {
  student: Student;
}

export function QRGenerator({ student }: QRGeneratorProps) {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [printed, setPrinted] = useState(false);

  // Create QR data containing student info
  const qrData = JSON.stringify({
    id: student.id,
    name: student.name,
    email: student.email,
  });

  const handlePrint = () => {
    if (!qrRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Printing Error",
        description: "Could not open print dialog. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }

    // Create printable HTML content
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${student.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              display: inline-block;
              padding: 15px;
              border: 1px solid #ccc;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .qr-info {
              margin-top: 10px;
              text-align: center;
            }
            .qr-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .qr-email {
              font-size: 14px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .qr-container {
                border: none;
              }
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${qrRef.current.innerHTML}
            <div class="qr-info">
              <div class="qr-name">${student.name}</div>
              <div class="qr-email">${student.email}</div>
            </div>
          </div>
          <button class="print-button" onclick="window.print();setTimeout(window.close, 500);">Print QR Code</button>
        </body>
      </html>
    `);

    printWindow.document.close();
    
    setPrinted(true);
    toast({
      title: "QR Code Ready",
      description: "QR code has been prepared for printing.",
      duration: 3000,
    });
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    // Create canvas from SVG for download
    const canvas = document.createElement('canvas');
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg!);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `qrcode-${student.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "QR Code Downloaded",
        description: "The QR code image has been saved.",
        duration: 3000,
      });
    };
    
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">QR Code for {student.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div ref={qrRef} className="p-4 bg-white rounded-lg shadow-sm border">
          <QRCodeSVG
            value={qrData}
            size={200}
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="H"
            includeMargin={true}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        <Button onClick={handlePrint} className="gap-2">
          {printed ? <Check className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
          Print QR Code
        </Button>
        <Button variant="outline" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}