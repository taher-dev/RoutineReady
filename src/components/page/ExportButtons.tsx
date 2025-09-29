'use client';

import { RoutineData, ALL_DAYS, Day } from "@/lib/types";
import { Button } from "../ui/button";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { UserOptions } from 'jspdf-autotable';

// These should be imported from RoutineTable or a shared lib, but for simplicity, we define them here.
const timeSlots = [
    { start: 8 * 60 + 30, end: 10 * 60 }, // 8:30 - 10:00
    { start: 10 * 60, end: 11 * 60 + 30 }, // 10:00 - 11:30
    { start: 11 * 60 + 30, end: 13 * 60 },   // 11:30 - 1:00
    { start: 13 * 60, end: 13 * 60 + 30, isBreak: true }, // 1:00 - 1:30 (Break)
    { start: 13 * 60 + 30, end: 15 * 60 }, // 1:30 - 3:00
    { start: 15 * 60, end: 16 * 60 + 30 }, // 3:00 - 4:30
];

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const getShortDay = (day: Day): string => {
  return day.substring(0, 3).toUpperCase();
}


interface ExportButtonsProps {
  routineData: RoutineData;
  tableRef?: React.RefObject<any>; // tableRef is not used in the manual build approach
}


export function ExportButtons({ routineData }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<null | 'pdf' | 'excel'>(null);
  const { toast } = useToast();

  const exportToPDF = () => {
    setIsExporting('pdf');
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        format: 'a3',
      });

      const head = [['Day', ...timeSlots.map(slot => slot.isBreak ? 'Break' : `${formatTime(slot.start)} - ${formatTime(slot.end)}`)]];
      
      const body = ALL_DAYS.map(day => {
        const dayCourses = routineData[day] || [];
        // Important: Sort courses by start time to process them in order
        const sortedCourses = [...dayCourses].sort((a,b) => a.startTimeMinutes - b.startTimeMinutes);

        const row: (string | { content: string; colSpan: number; styles: { halign: 'center', valign: 'middle', fillColor: [number, number, number] } })[] = [getShortDay(day)];
        
        let lastCourseEndTime = 0;

        timeSlots.forEach((slot) => {
          // If the last processed course overlaps this slot, skip it.
          if(lastCourseEndTime > slot.start) {
            return;
          }

          const course = sortedCourses.find(c => c.startTimeMinutes >= slot.start && c.startTimeMinutes < slot.end);

          if (course) {
            const courseDuration = course.endTimeMinutes - course.startTimeMinutes;
            let colSpan = 0;
            let accumulatedDuration = 0;

            for(const s of timeSlots) {
                if (s.start >= course.startTimeMinutes) {
                    if(accumulatedDuration < courseDuration){
                        accumulatedDuration += (s.end - s.start);
                        colSpan++;
                    } else {
                        break;
                    }
                }
            }
            
            lastCourseEndTime = course.endTimeMinutes;
            
            row.push({
              content: `${course.course}\n${course.title}\nRoom: ${course.room}`,
              colSpan: colSpan,
              styles: { halign: 'center', valign: 'middle', fillColor: [208, 240, 221] },
            });
          } else if (slot.isBreak) {
            row.push(''); // Empty cell for break, styling applied via columnStyles
          } else {
            row.push(''); // Empty cell for no course
          }
        });
        return row;
      }).filter(row => row.length > 1); // Filter out days with no courses

      const columnStyles: { [key: number]: any } = {
        0: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [25, 25, 28] }, // Day column
      };

      // Style for break column
      const breakColumnIndex = timeSlots.findIndex(s => s.isBreak) + 1; // +1 because 'Day' is the first column
      if (breakColumnIndex > 0) {
        columnStyles[breakColumnIndex] = { fillColor: [235, 243, 255] };
      }


      (doc as any).autoTable({
        head,
        body,
        theme: 'grid',
        headStyles: {
            fillColor: [148, 211, 172],
            textColor: [32, 56, 42],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: columnStyles,
        didParseCell: (data: any) => {
            // This hook is still useful for row-specific styling if needed
            if (data.row.section === 'body' && data.cell.raw === '') {
                 const isBreakColumn = data.column.index === breakColumnIndex;
                 data.cell.styles.fillColor = isBreakColumn ? [235, 243, 255] : [255, 255, 255];
            }
        },
        margin: { left: 28.35, right: 28.35 }, // 1rem in points (1rem ~ 16px, 1pt = 1/72 inch, 96dpi => 16 * 72 / 96 * 2.835) approx. 28.35
      });

      doc.save('routine.pdf');

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
