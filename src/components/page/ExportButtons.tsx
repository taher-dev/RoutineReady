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
import type { UserOptions } from 'jspdf-autotable';

interface ExportButtonsProps {
  routineData: RoutineData;
  tableRef: React.RefObject<RoutineTableRef>;
}

// Extend the UserOptions type to include didParseCell hook
interface CustomUserOptions extends UserOptions {
    didParseCell?: (data: any) => void;
    didDrawPage?: (data: any) => void;
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
        const autoTableOptions: CustomUserOptions = {
          html: tableElement.querySelector('table'),
          theme: 'grid',
          styles: {
            fontSize: 14,
            cellPadding: 4,
            valign: 'middle',
          },
          headStyles: {
            fillColor: [148, 211, 172], // primary: hsl(141, 43%, 71%)
            textColor: [32, 56, 42], // primary-foreground: hsl(141, 25%, 15%)
            fontStyle: 'bold',
          },
           didDrawPage: (data) => {
            // Center the table horizontally
            const tableWidth = data.table.width;
            const pageWidth = doc.internal.pageSize.width;
            data.cursor.x = (pageWidth - tableWidth) / 2;
          },
          didParseCell: (data) => {
             // Color the day cells
            if (data.column.index === 0 && data.row.section === 'body') {
                data.cell.styles.fillColor = [245, 245, 245]; // background: hsl(0, 0%, 96%)
                data.cell.styles.textColor = [25, 25, 28]; // foreground: hsl(240, 10%, 3.9%)
                data.cell.styles.fontStyle = 'bold';
            }
            // Color the course cells
            if (data.cell.raw && (data.cell.raw as HTMLElement).hasAttribute('data-course-cell')) {
                 data.cell.styles.fillColor = [208, 240, 221]; // A lighter shade of primary
                 data.cell.styles.fontStyle = 'normal';
                 // Custom parsing for course content to make it look nice
                 const courseCell = data.cell.raw as HTMLElement;
                 const course = courseCell.querySelector('[data-course-field="course"]')?.textContent;
                 const title = courseCell.querySelector('[data-course-field="title"]')?.textContent;
                 const roomContent = courseCell.querySelector('[data-course-field="room"]')?.textContent;
                 
                 // The room content already contains "Room: ...", so we don't need to add it again.
                 const roomText = roomContent || '';

                 data.cell.text = [
                     course || '',
                     title || '',
                     roomText,
                 ].filter(Boolean);
            }
          },
        };

        (doc as any).autoTable(autoTableOptions);
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
