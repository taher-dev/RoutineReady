'use client';

import { RoutineData, ALL_DAYS, Course } from "@/lib/types";
import { Button } from "../ui/button";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { RoutineTableRef } from "./RoutineTable";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  routineData: RoutineData;
  tableRef: React.RefObject<RoutineTableRef>;
}

export function ExportButtons({ routineData, tableRef }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<null | 'pdf' | 'excel'>(null);
  const { toast } = useToast();

  const exportToPDF = () => {
    setIsExporting('pdf');
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
      });

      const tableElement = tableRef.current?.getElement();
      if (tableElement) {
        (doc as any).autoTable({
          html: tableElement.querySelector('table'),
          theme: 'grid',
          styles: {
            fontSize: 7,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: '#94D3AC', // Primary color
            textColor: '#193925', // Primary foreground
          },
        });
        doc.save('routine.pdf');
      } else {
        throw new Error("Table element not found");
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        variant: 'destructive',
        title: "Export Failed",
        description: "Could not export to PDF. Please try again."
      });
    }
    setIsExporting(null);
  };

  const exportToExcel = () => {
    setIsExporting('excel');
    try {
      const wb = XLSX.utils.book_new();
      
      const ws_data: any[][] = [['Day', 'Time', 'Course Code', 'Course Title', 'Room']];
      
      ALL_DAYS.forEach(day => {
        const courses = routineData[day] || [];
        courses.sort((a,b) => a.startTimeMinutes - b.startTimeMinutes).forEach(course => {
          ws_data.push([day, course.time, course.course, course.title, course.room]);
        });
      });

      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, 'Routine');
      XLSX.writeFile(wb, 'routine.xlsx');

    } catch(error) {
      console.error("Excel Export Error:", error);
      toast({
        variant: 'destructive',
        title: "Export Failed",
        description: "Could not export to Excel. Please try again."
      });
    }
    setIsExporting(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={exportToPDF} variant="outline" size="sm" disabled={!!isExporting}>
        {isExporting === 'pdf' ? <Loader2 className="animate-spin" /> : <FileDown />}
        Export PDF
      </Button>
      <Button onClick={exportToExcel} variant="outline" size="sm" disabled={!!isExporting}>
        {isExporting === 'excel' ? <Loader2 className="animate-spin" /> : <FileText />}
        Export Excel
      </Button>
    </div>
  );
}
